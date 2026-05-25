import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listApplicationsForRequest,
  updateApplicationStatus,
} from "@/lib/applications.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/requests/$requestId")({
  head: () => ({ meta: [{ title: "Applications — Aveiq" }] }),
  component: RequestApplicationsPage,
});

function RequestApplicationsPage() {
  const { requestId } = useParams({ from: "/_authenticated/requests/$requestId" });
  const list = useServerFn(listApplicationsForRequest);
  const update = useServerFn(updateApplicationStatus);

  const appsQ = useQuery({
    queryKey: ["requestApps", requestId],
    queryFn: () => list({ data: { hire_request_id: requestId } }),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/dashboard" className="text-sm text-muted-foreground underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-medium tracking-tight">
        Applications for {appsQ.data?.hire_request?.role_title ?? "your role"}
      </h1>

      <div className="mt-8 space-y-4">
        {appsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {appsQ.data?.applications.map((a) => {
          const eng = a.engineers as {
            display_name?: string;
            headline?: string | null;
            location?: string | null;
            skills?: string[];
            years_experience?: number | null;
            klyro_score?: number | null;
            github_url?: string | null;
            linkedin_url?: string | null;
            website_url?: string | null;
          } | null;
          return (
            <article key={a.id} className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold">{eng?.display_name}</p>
                  <p className="text-sm text-muted-foreground">{eng?.headline ?? "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {eng?.location ?? "Remote"} · {eng?.years_experience ?? "?"} yrs
                    {eng?.klyro_score != null && ` · Aveiq Score ${eng.klyro_score}`}
                  </p>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-black/5">
                  {a.status}
                </span>
              </div>
              {a.note && (
                <p className="mt-4 rounded-md bg-secondary/50 p-3 text-sm text-foreground/80">
                  {a.note}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(eng?.skills ?? []).slice(0, 8).map((s) => (
                  <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {eng?.github_url && (
                    <a href={eng.github_url} target="_blank" rel="noreferrer" className="underline">
                      GitHub
                    </a>
                  )}
                  {eng?.linkedin_url && (
                    <a href={eng.linkedin_url} target="_blank" rel="noreferrer" className="underline">
                      LinkedIn
                    </a>
                  )}
                  {eng?.website_url && (
                    <a href={eng.website_url} target="_blank" rel="noreferrer" className="underline">
                      Website
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  {(["shortlisted", "hired", "rejected"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={async () => {
                        try {
                          await update({ data: { application_id: a.id, status: s } });
                          toast.success(`Marked ${s}`);
                          appsQ.refetch();
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-foreground hover:text-background"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
        {appsQ.data && appsQ.data.applications.length === 0 && (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        )}
      </div>
    </main>
  );
}
