import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applySchema = z.object({
  hire_request_id: z.string().uuid(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const applyToHireRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => applySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Must be a vetted engineer
    const { data: eng, error: eErr } = await supabase
      .from("engineers")
      .select("vetting")
      .eq("user_id", userId)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);
    if (!eng || eng.vetting !== "vetted") {
      throw new Error("Only vetted engineers can apply.");
    }

    const { error } = await supabase.from("applications").insert({
      hire_request_id: data.hire_request_id,
      engineer_id: userId,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("applications")
      .select("id, status, note, created_at, hire_requests(id, role_title, stack, companies(name))")
      .eq("engineer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

export const listApplicationsForRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { hire_request_id: string }) =>
    z.object({ hire_request_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify the requester owns this hire_request
    const { data: hr, error: hErr } = await supabase
      .from("hire_requests")
      .select("id, owner_id, role_title")
      .eq("id", data.hire_request_id)
      .maybeSingle();
    if (hErr) throw new Error(hErr.message);
    if (!hr || hr.owner_id !== userId) throw new Error("Forbidden");

    // Use admin to join engineer profiles (RLS would otherwise hide them)
    const { data: apps, error } = await supabaseAdmin
      .from("applications")
      .select(
        "id, status, note, created_at, engineer_id, engineers!inner(display_name, headline, location, skills, years_experience, aveiq_score, github_url, linkedin_url, website_url)"
      )
      .eq("hire_request_id", data.hire_request_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: apps ?? [], hire_request: hr };
  });

const updateAppSchema = z.object({
  application_id: z.string().uuid(),
  status: z.enum(["submitted", "shortlisted", "hired", "rejected"]),
});

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateAppSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // RLS already enforces: founder can update apps tied to own hire_requests
    const { error } = await supabase
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.application_id);
    if (error) throw new Error(error.message);

    // Notify the candidate by email (best-effort; do not fail the request)
    try {
      const { data: app } = await supabaseAdmin
        .from("applications")
        .select(
          "engineer_id, hire_requests(role_title, companies(name)), engineers!inner(display_name)"
        )
        .eq("id", data.application_id)
        .maybeSingle();

      if (app?.engineer_id) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          app.engineer_id
        );
        const email = authUser?.user?.email;
        if (email) {
          const hr = app.hire_requests as
            | { role_title?: string; companies?: { name?: string } | null }
            | null;
          const eng = app.engineers as { display_name?: string } | null;
          await supabaseAdmin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              templateName: "application-status-update",
              recipientEmail: email,
              templateData: {
                candidateName: eng?.display_name,
                roleTitle: hr?.role_title,
                companyName: hr?.companies?.name,
                status: data.status,
              } as never,
              idempotencyKey: `app-status-${data.application_id}-${data.status}-${Date.now()}`,
            } as never,
          });
        }
      }
    } catch (e) {
      console.error("Failed to enqueue status email:", e);
    }

    return { ok: true };
  });
