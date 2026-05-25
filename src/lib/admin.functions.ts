import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const listAllEngineersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("engineers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { engineers: data ?? [] };
  });

const updateSchema = z.object({
  user_id: z.string().uuid(),
  vetting: z.enum(["pending", "in_review", "vetted", "rejected"]),
  aveiq_score: z.number().int().min(0).max(100).optional().nullable(),
});

export const updateEngineerVetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("engineers")
      .update({
        vetting: data.vetting,
        ...(data.aveiq_score !== undefined ? { aveiq_score: data.aveiq_score } : {}),
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const bulkSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(100),
  vetting: z.enum(["pending", "in_review", "vetted", "rejected"]),
});

export const bulkUpdateEngineerVetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => bulkSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("engineers")
      .update({ vetting: data.vetting })
      .in("user_id", data.user_ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.user_ids.length };
  });

export const promoteSelfToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Bootstrap: only allowed if there are zero existing admins.
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("Admin already exists. Ask an existing admin to grant access.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: real-data metrics dashboard.
export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalEng,
      vetted,
      pending,
      inReview,
      rejected,
      appsLast7,
      appsLast30,
      openBriefs,
      totalBriefs,
      apps,
      reviews,
      pendingReviews,
      scoreAgg,
    ] = await Promise.all([
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).eq("vetting", "vetted"),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).eq("vetting", "pending"),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).eq("vetting", "in_review"),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).eq("vetting", "rejected"),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabaseAdmin.from("engineers").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabaseAdmin.from("hire_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("hire_requests").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("engineer_reviews").select("*", { count: "exact", head: true }).eq("approved", true),
      supabaseAdmin.from("engineer_reviews").select("*", { count: "exact", head: true }).eq("approved", false),
      supabaseAdmin.from("engineers").select("aveiq_score").eq("vetting", "vetted").not("aveiq_score", "is", null),
    ]);

    const scores = (scoreAgg.data ?? []).map((r) => r.aveiq_score as number).filter((n) => typeof n === "number");
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return {
      engineers: {
        total: totalEng.count ?? 0,
        vetted: vetted.count ?? 0,
        pending: pending.count ?? 0,
        inReview: inReview.count ?? 0,
        rejected: rejected.count ?? 0,
        newLast7: appsLast7.count ?? 0,
        newLast30: appsLast30.count ?? 0,
        avgScore,
      },
      briefs: {
        open: openBriefs.count ?? 0,
        total: totalBriefs.count ?? 0,
      },
      applications: {
        total: apps.count ?? 0,
      },
      reviews: {
        approved: reviews.count ?? 0,
        pending: pendingReviews.count ?? 0,
      },
    };
  });

