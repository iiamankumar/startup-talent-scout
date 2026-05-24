import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// PUBLIC: list vetted, available engineers for the /network directory.
// Uses admin client with explicit projection — no PII (no email).
export const listVettedEngineers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("engineers")
    .select(
      "user_id, display_name, headline, location, years_experience, skills, github_url, linkedin_url, website_url, available, klyro_score, vetting"
    )
    .eq("vetting", "vetted")
    .eq("available", true)
    .order("klyro_score", { ascending: false, nullsFirst: false })
    .limit(60);
  if (error) return { engineers: [], error: error.message };
  return { engineers: data ?? [], error: null };
});

// AUTH: get current user's engineer profile (may be null if not created)
export const getMyEngineerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("engineers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { engineer: data };
  });

const upsertSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  headline: z.string().trim().max(140).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  years_experience: z.number().int().min(0).max(60).optional().nullable(),
  hourly_rate_usd: z.number().int().min(0).max(10000).optional().nullable(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  github_url: z.string().url().max(200).optional().nullable().or(z.literal("")),
  linkedin_url: z.string().url().max(200).optional().nullable().or(z.literal("")),
  website_url: z.string().url().max(200).optional().nullable().or(z.literal("")),
  available: z.boolean().default(true),
});

export const upsertMyEngineerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      ...data,
      github_url: data.github_url || null,
      linkedin_url: data.linkedin_url || null,
      website_url: data.website_url || null,
    };
    const { error } = await supabase.from("engineers").upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);

    // Ensure user has the 'engineer' role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "engineer" }, { onConflict: "user_id,role" });

    return { ok: true };
  });

// PUBLIC: full engineer profile (vetted only)
export const getEngineerPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { user_id: string }) => {
    if (typeof input?.user_id !== "string") throw new Error("user_id required");
    return input;
  })
  .handler(async ({ data }) => {
    const { data: e, error } = await supabaseAdmin
      .from("engineers")
      .select(
        "user_id, display_name, headline, bio, location, years_experience, hourly_rate_usd, skills, github_url, linkedin_url, website_url, available, klyro_score, vetting"
      )
      .eq("user_id", data.user_id)
      .eq("vetting", "vetted")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { engineer: e };
  });
