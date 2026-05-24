import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOpenRequestsForEngineers } from "@/lib/hire.functions";
import { applyToHireRequest, listMyApplications } from "@/lib/applications.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "Open roles — Klyro" }] }),
  component: RolesPage,
});

function RolesPage() {
  const getOpen = useServerFn(listOpenRequestsForEngineers);
  const getMine = useServerFn(listMyApplications);
  const apply = useServerFn(applyToHireRequest);

  const rolesQ = useQuery({ queryKey: ["openRoles"], queryFn: () => getOpen() });
  const minesQ = useQuery({ queryKey: ["myApps"], queryFn: () => getMine() });

  const appliedIds = new Set(
    (minesQ.data?.applications ?? [])
      .map((a) => (a.hire_requests as { id?: string } | null)?.id)
      .filter(Boolean) as string[]
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Open roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-curated briefs from Klyro founders. Apply with a short note.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm text-muted-foreground underline">
          Dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rolesQ.isLoading && <p className="text-sm text-muted-foreground">Loading roles…</p>}
        {rolesQ.data?.requests.map((r) => (
          <RoleCard
            key={r.id}
            role={{
              id: r.id,
              role_title: r.role_title,
              stack: r.stack,
              urgency: r.urgency,
              budget_monthly_usd: r.budget_monthly_usd,
              companies: r.companies
                ? {
                    name: (r.companies as { name?: string }).name ?? undefined,
                    stage: (r.companies as { stage?: string | null }).stage ?? undefined,
                  }
                : null,
            }}
            alreadyApplied={appliedIds.has(r.id)}
            onApply={async (note) => {
              try {
                await apply({ data: { hire_request_id: r.id, note } });
                toast.success("Application sent.");
                minesQ.refetch();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          />
        ))}
        {rolesQ.data && rolesQ.data.requests.length === 0 && (
          <p className="text-sm text-muted-foreground">No open roles right now. Check back soon.</p>
        )}
      </div>

      <section className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Your applications
        </h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl bg-card ring-1 ring-black/5">
          {(minesQ.data?.applications ?? []).map((a) => {
            const hr = a.hire_requests as
              | { role_title?: string; companies?: { name?: string } | null }
              | null;
            return (
              <li key={a.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{hr?.role_title ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {hr?.companies?.name ?? "Stealth"} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-black/5">
                  {a.status}
                </span>
              </li>
            );
          })}
          {minesQ.data && minesQ.data.applications.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No applications yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}

function RoleCard({
  role,
  alreadyApplied,
}: {
  role: {
    id: string;
    role_title: string;
    stack: string[];
    urgency: string | null;
    budget_monthly_usd: number | null;
    companies: { name?: string; stage?: string } | null;
  };
  alreadyApplied: boolean;
  onApply: (note: string | null) => Promise<void>;
}) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: role.id }}
      className="group block rounded-2xl bg-card p-6 ring-1 ring-black/5 transition hover:ring-foreground/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold group-hover:underline">{role.role_title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {role.companies?.name ?? "Stealth"}
            {role.companies?.stage ? ` · ${role.companies.stage}` : ""}
          </p>
        </div>
        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          {role.urgency ?? "flex"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {role.stack.slice(0, 6).map((s) => (
          <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {role.budget_monthly_usd ? `$${role.budget_monthly_usd.toLocaleString()}/mo` : "Budget on request"}
        </span>
        {alreadyApplied ? (
          <span className="text-xs font-medium text-muted-foreground">✓ Applied</span>
        ) : (
          <span className="text-xs font-medium text-foreground">View role →</span>
        )}
      </div>
    </Link>
  );
}
