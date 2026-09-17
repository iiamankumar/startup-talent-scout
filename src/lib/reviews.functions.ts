import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// PUBLIC: landing page stats — only real numbers from the DB.
export const getLandingStats = createServerFn({ method: "GET" }).handler(async () => {
  const [vetted, pending, openRoles, reviews] = await Promise.all([
    supabaseAdmin
      .from("engineers")
      .select("*", { count: "exact", head: true })
      .eq("vetting", "vetted"),
    supabaseAdmin
      .from("engineers")
      .select("*", { count: "exact", head: true })
      .in("vetting", ["pending", "in_review"]),
    supabaseAdmin
      .from("hire_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabaseAdmin
      .from("engineer_reviews")
      .select("*", { count: "exact", head: true })
      .eq("approved", true),
  ]);
  return {
    vettedEngineers: vetted.count ?? 0,
    pendingEngineers: pending.count ?? 0,
    openRoles: openRoles.count ?? 0,
    approvedReviews: reviews.count ?? 0,
  };
});

// PUBLIC: featured vetted engineers + their top approved review (if any)
export const getFeaturedEngineers = createServerFn({ method: "GET" }).handler(async () => {
  const { data: engineers, error } = await supabaseAdmin
    .from("engineers")
    .select(
      "user_id, display_name, headline, location, years_experience, skills, github_url, linkedin_url, website_url, aveiq_score"
    )
    .eq("vetting", "vetted")
    .eq("available", true)
    .order("aveiq_score", { ascending: false, nullsFirst: false })
    .limit(6);
  if (error) return { engineers: [] as const };
  if (!engineers || engineers.length === 0) return { engineers: [] as const };

  const ids = engineers.map((e) => e.user_id);
  const { data: reviews } = await supabaseAdmin
    .from("engineer_reviews")
    .select("engineer_id, rating, quote, reviewer_name, reviewer_company")
    .in("engineer_id", ids)
    .eq("approved", true)
    .order("rating", { ascending: false });

  const reviewMap = new Map<string, { rating: number; quote: string; reviewer_name: string; reviewer_company: string | null }>();
  (reviews ?? []).forEach((r) => {
    if (!reviewMap.has(r.engineer_id)) {
      reviewMap.set(r.engineer_id, {
        rating: r.rating,
        quote: r.quote,
        reviewer_name: r.reviewer_name,
        reviewer_company: r.reviewer_company,
      });
    }
  });

  return {
    engineers: engineers.map((e) => ({ ...e, topReview: reviewMap.get(e.user_id) ?? null })),
  };
});

// PUBLIC: list approved reviews for an engineer (used on profile)
export const listEngineerReviews = createServerFn({ method: "GET" })
  .inputValidator((input: { engineer_id: string }) =>
    z.object({ engineer_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: reviews, error } = await supabaseAdmin
      .from("engineer_reviews")
      .select("id, rating, quote, reviewer_name, reviewer_role, reviewer_company, created_at")
      .eq("engineer_id", data.engineer_id)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (error) return { reviews: [] };
    return { reviews: reviews ?? [] };
  });

const submitSchema = z.object({
  engineer_id: z.string().uuid(),
  reviewer_name: z.string().trim().min(2).max(120),
  reviewer_role: z.string().trim().max(120).optional().nullable(),
  reviewer_company: z.string().trim().max(120).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().min(20).max(1000),
});

export const submitEngineerReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("engineer_reviews").insert({
      engineer_id: data.engineer_id,
      reviewer_user_id: userId,
      reviewer_name: data.reviewer_name,
      reviewer_role: data.reviewer_role ?? null,
      reviewer_company: data.reviewer_company ?? null,
      rating: data.rating,
      quote: data.quote,
      approved: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: review moderation queue + actions
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

// ADMIN: all reviews (pending + approved) with engineer names resolved manually —
// engineer_reviews has no FK to engineers, so PostgREST cannot embed the relation.
export const listAllReviewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("engineer_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    const ids = Array.from(new Set(rows.map((r) => r.engineer_id)));
    const nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: engineers } = await supabaseAdmin
        .from("engineers")
        .select("user_id, display_name")
        .in("user_id", ids);
      (engineers ?? []).forEach((e) => nameMap.set(e.user_id, e.display_name));
    }

    return {
      reviews: rows.map((r) => ({
        ...r,
        engineer_name: nameMap.get(r.engineer_id) ?? null,
      })),
    };
  });

export const listPendingReviewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("engineer_reviews")
      .select("*")
      .eq("approved", false)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reviews: data ?? [] };
  });

export const setReviewApprovalAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("engineer_reviews")
      .update({ approved: data.approved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
