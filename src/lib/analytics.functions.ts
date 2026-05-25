import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Record a custom analytics event. Authenticated callers only. */
export const trackEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        event_name: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await supabaseAdmin.from("analytics_events").insert({
      event_name: data.event_name,
      user_id: context.userId,
      metadata: data.metadata ?? null,
    });
    return { ok: true };
  });

/**
 * Daily counts for the last `days` days for signups (profiles),
 * application submissions (applications), and hire requests.
 * Admin only.
 */
export const getAnalyticsTimeSeries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ days: z.number().int().min(7).max(90).default(30) }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    const [profilesRes, appsRes, hiresRes, eventsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("applications").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("hire_requests").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin
        .from("analytics_events")
        .select("event_name, created_at")
        .gte("created_at", sinceIso),
    ]);

    const bucket = (rows: Array<{ created_at: string }> | null) => {
      const map = new Map<string, number>();
      (rows ?? []).forEach((r) => {
        const d = r.created_at.slice(0, 10);
        map.set(d, (map.get(d) ?? 0) + 1);
      });
      return map;
    };

    const signups = bucket(profilesRes.data);
    const apps = bucket(appsRes.data);
    const hires = bucket(hiresRes.data);

    const series: Array<{
      date: string;
      signups: number;
      applications: number;
      hire_requests: number;
    }> = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      series.push({
        date: d,
        signups: signups.get(d) ?? 0,
        applications: apps.get(d) ?? 0,
        hire_requests: hires.get(d) ?? 0,
      });
    }

    const totals = {
      signups: Array.from(signups.values()).reduce((a, b) => a + b, 0),
      applications: Array.from(apps.values()).reduce((a, b) => a + b, 0),
      hire_requests: Array.from(hires.values()).reduce((a, b) => a + b, 0),
      custom_events: eventsRes.data?.length ?? 0,
    };

    // Top custom events
    const eventCounts = new Map<string, number>();
    (eventsRes.data ?? []).forEach((e) => {
      eventCounts.set(e.event_name, (eventCounts.get(e.event_name) ?? 0) + 1);
    });
    const topEvents = Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return { series, totals, topEvents, days: data.days };
  });
