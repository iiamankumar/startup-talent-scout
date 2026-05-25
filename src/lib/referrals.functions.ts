import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admin only");
}

// Get my code + my referrals
export const getMyReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    let { data: codeRow } = await supabaseAdmin
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (!codeRow) {
      // Backfill if missing
      const { data: gen } = await supabaseAdmin.rpc("gen_referral_code");
      const code = (gen as unknown as string) || Math.random().toString(36).slice(2, 10).toUpperCase();
      await supabaseAdmin.from("referral_codes").insert({ user_id: userId, code });
      codeRow = { code };
    }
    const { data: referrals } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", userId)
      .order("created_at", { ascending: false });
    return { code: codeRow.code, referrals: referrals ?? [] };
  });

// Attribute a referral on signup (called from auth-context after login if ?ref=CODE was stored)
export const attributeReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ code: z.string().trim().min(4).max(16) }).parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const code = data.code.toUpperCase();
    // Don't re-attribute
    const { data: exists } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .maybeSingle();
    if (exists) return { ok: true, already: true };

    const { data: codeRow } = await supabaseAdmin
      .from("referral_codes")
      .select("user_id")
      .eq("code", code)
      .maybeSingle();
    if (!codeRow || codeRow.user_id === userId) return { ok: false };

    await supabaseAdmin.from("referrals").insert({
      referrer_user_id: codeRow.user_id,
      referred_user_id: userId,
      referral_code: code,
      status: "pending",
    });
    return { ok: true };
  });

// Admin: list all referrals
export const listAllReferralsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return { referrals: data ?? [] };
  });

// Admin: mark reward as paid / set amount
export const updateReferralReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        reward_amount_usd: z.number().int().min(0).max(100000).optional(),
        reward_status: z.enum(["none", "pending", "paid"]).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.reward_amount_usd !== undefined) patch.reward_amount_usd = data.reward_amount_usd;
    if (data.reward_status !== undefined) {
      patch.reward_status = data.reward_status;
      if (data.reward_status === "paid") patch.paid_at = new Date().toISOString();
    }
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await supabaseAdmin.from("referrals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
