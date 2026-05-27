import { createServerFn } from "@tanstack/react-start";
import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEMPLATES } from "./email-templates/registry";

const SITE_NAME = "AVEIQ";
const SENDER_DOMAIN = "notify.aveiq.app";
const FROM_DOMAIN = "aveiq.app";
const MIN_AGE_HOURS = 24; // only nudge accounts older than this

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !existing.used_at) return existing.token;
  const token = generateToken();
  await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
  const { data: stored } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return stored?.token ?? token;
}

export const sendIncompleteSignupReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const template = TEMPLATES["complete-your-signup"];
    if (!template) throw new Error("Template not found");

    // 1. List all auth users (paginate)
    const allUsers: { id: string; email: string | null; created_at: string; user_metadata?: any }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      const users = data?.users ?? [];
      for (const u of users) {
        allUsers.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          user_metadata: u.user_metadata,
        });
      }
      if (users.length < perPage) break;
      page += 1;
      if (page > 20) break; // safety cap
    }

    const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;
    const candidates = allUsers.filter(
      (u) => u.email && new Date(u.created_at).getTime() < cutoff,
    );
    if (candidates.length === 0) {
      return { scanned: allUsers.length, eligible: 0, queued: 0, skipped: 0, suppressed: 0 };
    }

    const ids = candidates.map((u) => u.id);
    const emailsLower = candidates.map((u) => u.email!.toLowerCase());

    // 2. Identify "completed" users (have engineer record OR have hire_request)
    const [engRes, hireRes, sentRes, suppRes] = await Promise.all([
      supabaseAdmin.from("engineers").select("user_id").in("user_id", ids),
      supabaseAdmin.from("hire_requests").select("owner_id").in("owner_id", ids),
      supabaseAdmin
        .from("email_send_log")
        .select("recipient_email")
        .eq("template_name", "complete-your-signup")
        .in("recipient_email", candidates.map((u) => u.email!)),
      supabaseAdmin
        .from("suppressed_emails")
        .select("email")
        .in("email", emailsLower),
    ]);

    const completedEngineers = new Set((engRes.data ?? []).map((r: any) => r.user_id));
    const completedFounders = new Set((hireRes.data ?? []).map((r: any) => r.owner_id));
    const alreadySent = new Set(
      (sentRes.data ?? []).map((r: any) => (r.recipient_email as string).toLowerCase()),
    );
    const suppressed = new Set((suppRes.data ?? []).map((r: any) => r.email));

    // Look up role hints
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    const roleMap = new Map<string, string[]>();
    for (const r of rolesData ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    let queued = 0;
    let skipped = 0;
    let suppressedCount = 0;

    for (const u of candidates) {
      const email = u.email!;
      const emailLower = email.toLowerCase();
      const isComplete = completedEngineers.has(u.id) || completedFounders.has(u.id);
      if (isComplete) {
        skipped += 1;
        continue;
      }
      if (alreadySent.has(emailLower)) {
        skipped += 1;
        continue;
      }
      if (suppressed.has(emailLower)) {
        suppressedCount += 1;
        continue;
      }

      const roles = roleMap.get(u.id) ?? [];
      const audience: "engineer" | "founder" | "unknown" = roles.includes("founder")
        ? "founder"
        : roles.includes("engineer")
          ? "engineer"
          : "unknown";

      const name =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        (email.split("@")[0] ?? "there");

      const props = { name, audience };
      const element = React.createElement(template.component, props);
      const html = await render(element);
      const text = await render(element, { plainText: true });
      const subject =
        typeof template.subject === "function" ? template.subject(props) : template.subject;

      const messageId = crypto.randomUUID();
      const idempotencyKey = `complete-signup-${u.id}`;
      const unsubscribeToken = await getOrCreateUnsubscribeToken(email);

      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "complete-your-signup",
        recipient_email: email,
        status: "pending",
      });

      const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          to: email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text,
          purpose: "transactional",
          label: "complete-your-signup",
          idempotency_key: idempotencyKey,
          unsubscribe_token: unsubscribeToken,
          queued_at: new Date().toISOString(),
        },
      });

      if (enqErr) {
        await supabaseAdmin.from("email_send_log").insert({
          message_id: messageId,
          template_name: "complete-your-signup",
          recipient_email: email,
          status: "failed",
          error_message: enqErr.message,
        });
        skipped += 1;
        continue;
      }

      queued += 1;
    }

    return {
      scanned: allUsers.length,
      eligible: candidates.length,
      queued,
      skipped,
      suppressed: suppressedCount,
    };
  });
