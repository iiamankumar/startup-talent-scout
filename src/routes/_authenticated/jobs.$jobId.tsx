import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getJobDetail, listOpenRequestsForEngineers } from "@/lib/hire.functions";
import { applyToHireRequest } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Role — Aveiq" }] }),
  component: JobDetailPage,
});

type StepState = "done" | "in_progress" | "todo";

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const getJob = useServerFn(getJobDetail);
  const getOpen = useServerFn(listOpenRequestsForEngineers);
  const apply = useServerFn(applyToHireRequest);

  const jobQ = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob({ data: { job_id: jobId } }),
  });
  const similarQ = useQuery({
    queryKey: ["openRoles"],
    queryFn: () => getOpen(),
  });

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (jobQ.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted-foreground">
        Loading role…
      </main>
    );
  }
  if (jobQ.error || !jobQ.data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-muted-foreground">
          We couldn't load this role. <Link to="/roles" className="underline">Back to all roles</Link>
        </p>
      </main>
    );
  }

  const { job, applicantCount, myApplication, engineer } = jobQ.data;
  const company = (job.companies ?? null) as
    | { name?: string; stage?: string | null; website?: string | null; logo_url?: string | null }
    | null;

  const resumeStep: StepState = engineer?.resume_url
    ? engineer.resume_score != null
      ? "done"
      : "in_progress"
    : "todo";
  const aiStep: StepState =
    engineer?.ai_interview_status === "completed"
      ? "done"
      : engineer?.ai_interview_status === "in_progress"
      ? "in_progress"
      : "todo";
  const workAuthStep: StepState =
    engineer?.work_authorization && engineer.work_authorization !== "unspecified"
      ? "done"
      : "todo";

  const steps = [
    { key: "resume", label: "Resume", state: resumeStep },
    { key: "interview", label: "AI Interview", tag: "CORE", state: aiStep },
    { key: "work_auth", label: "Work Authorization", state: workAuthStep },
  ];
  const doneCount = steps.filter((s) => s.state === "done").length;
  const pct = Math.round((doneCount / steps.length) * 100);

  const budget = job.budget_monthly_usd
    ? `₹${job.budget_monthly_usd.toLocaleString("en-IN")}/mo`
    : "Budget on request";

  const postedAgo = relTime(new Date(job.created_at));

  const canApply =
    engineer?.vetting === "vetted" && job.status === "open" && !myApplication;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/roles" className="text-xs text-muted-foreground hover:text-foreground">
        ← View all opportunities
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* MAIN */}
        <article>
          <header className="border-b border-border pb-8">
            <div className="flex items-start gap-4">
              {company?.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name ?? "Company"}
                  className="h-12 w-12 rounded-lg object-cover ring-1 ring-black/5"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-sm font-semibold text-muted-foreground">
                  {(company?.name ?? "S").slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {company?.name ?? "Stealth"}
                  {company?.stage ? ` · ${formatStage(company.stage)}` : ""}
                </p>
                <h1 className="mt-1 text-3xl font-medium tracking-tight">{job.role_title}</h1>
                <p className="mt-3 text-2xl font-medium">{budget}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Contract</span>
                  <span>· Remote</span>
                  <span>· {urgencyLabel(job.urgency)}</span>
                  <span>· Posted {postedAgo}</span>
                  {applicantCount > 0 && <span>· {applicantCount} applied</span>}
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Required stack
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.stack.length === 0 && (
                <span className="text-xs text-muted-foreground">Open to all stacks</span>
              )}
              {job.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              About the role
            </h2>
            <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-foreground">
              {job.notes?.trim() ||
                "The founder has not added a long-form brief yet. Tap Apply to send a short note — we'll route you directly to the team."}
            </div>
          </section>

          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Contract & payment
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li>· Engaged as an independent contractor.</li>
              <li>· Fully remote with flexible working hours.</li>
              <li>· Monthly payouts.</li>
              <li>· Work at Aveiq never requires confidential or proprietary information from any current employer.</li>
            </ul>
          </section>

          {similarQ.data?.requests && similarQ.data.requests.length > 1 && (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Similar opportunities
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {similarQ.data.requests
                  .filter((r) => r.id !== job.id)
                  .slice(0, 4)
                  .map((r) => (
                    <Link
                      key={r.id}
                      to="/jobs/$jobId"
                      params={{ jobId: r.id }}
                      className="rounded-xl bg-card p-4 ring-1 ring-black/5 transition hover:ring-foreground/20"
                    >
                      <p className="text-sm font-medium">{r.role_title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {(r.companies as { name?: string } | null)?.name ?? "Stealth"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {r.budget_monthly_usd
                          ? `₹${r.budget_monthly_usd.toLocaleString("en-IN")}/mo`
                          : "Budget on request"}
                      </p>
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </article>

        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Application</p>
            <p className="mt-1 text-sm font-medium">
              {myApplication
                ? `Status: ${myApplication.status}`
                : doneCount === 0
                ? "Not started"
                : doneCount === steps.length
                ? "Ready to submit"
                : "In progress"}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {doneCount} of {steps.length} steps complete
            </p>

            <ul className="mt-5 space-y-2">
              {steps.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <StepDot state={s.state} />
                    {s.label}
                    {s.tag && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground">
                        {s.tag}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {s.state === "done" ? "Done" : s.state === "in_progress" ? "In progress" : "Not done"}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Application steps are reused across roles — you only complete each one once.
            </p>

            <div className="mt-5 border-t border-border pt-5">
              {!engineer ? (
                <button
                  onClick={() => navigate({ to: "/apply" })}
                  className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background"
                >
                  Create engineer profile
                </button>
              ) : engineer.vetting !== "vetted" ? (
                <div className="space-y-3">
                  <button
                    onClick={() => navigate({ to: "/apply" })}
                    className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background"
                  >
                    Complete vetting to apply
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    Only vetted engineers can apply to roles. Finish your screening to unlock all open briefs.
                  </p>
                </div>
              ) : myApplication ? (
                <div className="rounded-md bg-secondary px-3 py-2 text-center text-xs">
                  ✓ Application sent {relTime(new Date(myApplication.created_at))}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional: a brief note for the founder…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    disabled={busy || !canApply}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await apply({
                          data: { hire_request_id: job.id, note: note.trim() || null },
                        });
                        toast.success("Application sent.");
                        jobQ.refetch();
                      } catch (e) {
                        toast.error((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50"
                  >
                    {busy ? "Sending…" : "Start application"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Compensation" value={budget} />
              <Row label="Urgency" value={urgencyLabel(job.urgency)} />
              <Row label="Location" value="Remote" />
              <Row label="Posted" value={postedAgo} />
              {company?.website && (
                <Row
                  label="Company"
                  value={
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Website ↗
                    </a>
                  }
                />
              )}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] text-background">
        ✓
      </span>
    );
  }
  if (state === "in_progress") {
    return <span className="h-3 w-3 rounded-full bg-foreground/40" />;
  }
  return <span className="h-3 w-3 rounded-full border border-border" />;
}

function urgencyLabel(u: string | null) {
  switch (u) {
    case "72h":
      return "Hiring in 72 hours";
    case "1w":
      return "Hiring within a week";
    case "2w":
      return "Hiring within two weeks";
    default:
      return "Flexible timeline";
  }
}

function formatStage(s: string) {
  return s.replace(/_/g, " ");
}

function relTime(d: Date) {
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day) return "today";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}w ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}
