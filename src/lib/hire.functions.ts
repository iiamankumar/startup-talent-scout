import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listOpenRequestsPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("hire_requests")
    .select("id, role_title, stack, urgency, budget_monthly_usd, created_at, companies(name, stage)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { requests: [], error: error.message };
  return { requests: data ?? [], error: null };
});

const hireSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  company_website: z.string().url().max(200).optional().or(z.literal("")),
  company_stage: z
    .enum(["idea", "pre_seed", "seed", "series_a", "series_b_plus"])
    .optional()
    .nullable(),
  role_title: z.string().trim().min(2).max(120),
  stack: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  budget_monthly_usd: z.number().int().min(0).max(1_000_000).optional().nullable(),
  urgency: z.enum(["72h", "1w", "2w", "flex"]),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const createHireRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => hireSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Create or reuse a company by name for this owner
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", userId)
      .eq("name", data.company_name)
      .maybeSingle();

    let companyId = existing?.id;
    if (!companyId) {
      const { data: c, error: cErr } = await supabase
        .from("companies")
        .insert({
          owner_id: userId,
          name: data.company_name,
          website: data.company_website || null,
          stage: data.company_stage ?? null,
        })
        .select("id")
        .single();
      if (cErr) throw new Error(cErr.message);
      companyId = c.id;
    }

    const { error } = await supabase.from("hire_requests").insert({
      company_id: companyId,
      owner_id: userId,
      role_title: data.role_title,
      stack: data.stack,
      budget_monthly_usd: data.budget_monthly_usd ?? null,
      urgency: data.urgency,
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyHireRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, role_title, stack, urgency, status, created_at, companies(name)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

const updateSchema = z.object({
  hire_request_id: z.string().uuid(),
  role_title: z.string().trim().min(2).max(120).optional(),
  stack: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  budget_monthly_usd: z.number().int().min(0).max(1_000_000).nullable().optional(),
  urgency: z.enum(["72h", "1w", "2w", "flex"]).optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const updateHireRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { hire_request_id, ...patch } = data;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) clean[k] = v;
    if (Object.keys(clean).length === 0) return { ok: true };
    const { error } = await supabase
      .from("hire_requests")
      .update(clean)
      .eq("id", hire_request_id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setHireRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        hire_request_id: z.string().uuid(),
        status: z.enum(["open", "filled", "closed"]),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("hire_requests")
      .update({ status: data.status })
      .eq("id", data.hire_request_id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyLatestCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("companies")
      .select("name, website, stage")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { company: data ?? null };
  });

export const listOpenRequestsForEngineers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Use admin client so any authenticated engineer (vetted or not) can browse
    // open roles. Apply action is still gated server-side in applyToHireRequest.
    const { data, error } = await supabaseAdmin
      .from("hire_requests")
      .select("id, role_title, stack, urgency, budget_monthly_usd, created_at, companies(name, stage)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { requests: [], error: error.message };
    return { requests: data ?? [], error: null };
  });

export const getJobDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { job_id: string }) =>
    z.object({ job_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Read the job via admin so unvetted/pending engineers can browse it.
    const { data: job, error } = await supabaseAdmin
      .from("hire_requests")
      .select(
        "id, role_title, stack, urgency, budget_monthly_usd, notes, status, created_at, owner_id, companies(name, stage, website, logo_url)"
      )
      .eq("id", data.job_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) throw new Error("Job not found");

    const { count: applicantCount } = await supabaseAdmin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("hire_request_id", data.job_id);

    const { data: existingApp } = await supabaseAdmin
      .from("applications")
      .select("id, status, created_at")
      .eq("hire_request_id", data.job_id)
      .eq("engineer_id", userId)
      .maybeSingle();

    const { data: eng } = await supabaseAdmin
      .from("engineers")
      .select(
        "vetting, resume_url, resume_score, ai_interview_status, main_interview_status, work_authorization"
      )
      .eq("user_id", userId)
      .maybeSingle();

    return {
      job,
      applicantCount: applicantCount ?? 0,
      myApplication: existingApp,
      engineer: eng,
    };
  });
