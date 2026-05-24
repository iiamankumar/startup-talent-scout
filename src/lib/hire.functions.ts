import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  notes: z.string().trim().max(2000).optional().nullable(),
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

export const listOpenRequestsForEngineers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("hire_requests")
      .select("id, role_title, stack, urgency, budget_monthly_usd, created_at, companies(name, stage)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { requests: [], error: error.message };
    return { requests: data ?? [], error: null };
  });
