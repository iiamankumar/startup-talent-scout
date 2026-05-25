import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  listAllEngineersAdmin,
  updateEngineerVetting,
  promoteSelfToAdmin,
  getAdminMetrics,
} from "@/lib/admin.functions";

import { scheduleMainInterview, setMainInterviewVerdict } from "@/lib/interview.functions";
import { listPendingReviewsAdmin, setReviewApprovalAdmin } from "@/lib/reviews.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ShieldCheck, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Aveiq" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { roles, refreshRoles } = useAuth();
  const isAdmin = roles.includes("admin");

  const list = useServerFn(listAllEngineersAdmin);
  const update = useServerFn(updateEngineerVetting);
  const promote = useServerFn(promoteSelfToAdmin);

  const engineersQ = useQuery({
    queryKey: ["adminEngineers"],
    queryFn: () => list(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <ShieldCheck className="size-6 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-medium tracking-tight">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If no admin has been set up for this Aveiq instance yet, you can claim it.
          </p>
          <button
            onClick={async () => {
              try {
                await promote();
                await refreshRoles();
                toast.success("You are now the Aveiq admin.");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Claim admin role
          </button>
          <Link to="/dashboard" className="ml-4 text-sm underline text-muted-foreground">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Vetting queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve, review, or reject engineer applications.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm text-muted-foreground underline">
          Dashboard
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-card ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Engineer</th>
              <th className="px-4 py-3 text-left font-semibold">Stack</th>
              <th className="px-4 py-3 text-left font-semibold">Score</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {engineersQ.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {engineersQ.data?.engineers.map((e) => (
              <AdminRow
                key={e.user_id}
                engineer={e}
                onUpdate={async (vetting, aveiq_score) => {
                  await update({ data: { user_id: e.user_id, vetting, aveiq_score } });
                  toast.success(`Updated ${e.display_name}`);
                  engineersQ.refetch();
                }}
              />
            ))}
            {engineersQ.data && engineersQ.data.engineers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No engineers in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ReviewModeration />
    </main>
  );
}

function ReviewModeration() {
  const list = useServerFn(listPendingReviewsAdmin);
  const setApproval = useServerFn(setReviewApprovalAdmin);
  const q = useQuery({ queryKey: ["pendingReviews"], queryFn: () => list() });

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Pending reviews
        </h2>
        <span className="text-xs text-muted-foreground/70">
          {q.data?.reviews.length ?? 0} awaiting
        </span>
      </div>
      <ul className="mt-6 space-y-4">
        {q.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {q.data?.reviews.map((r) => {
          const eng = r.engineers as { display_name?: string } | null;
          return (
            <li key={r.id} className="rounded-2xl bg-card p-5 ring-1 ring-black/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    For {eng?.display_name ?? "—"} · by {r.reviewer_name}
                    {r.reviewer_company ? ` @ ${r.reviewer_company}` : ""}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-success">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await setApproval({ data: { id: r.id, approved: true } });
                      toast.success("Approved");
                      q.refetch();
                    }}
                    className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      await setApproval({ data: { id: r.id, approved: false } });
                      toast.success("Hidden");
                      q.refetch();
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    Hide
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/90">“{r.quote}”</p>
            </li>
          );
        })}
        {q.data && q.data.reviews.length === 0 && (
          <li className="text-sm text-muted-foreground">No pending reviews.</li>
        )}
      </ul>
    </section>
  );
}

function AdminRow({
  engineer,
  onUpdate,
}: {
  engineer: {
    user_id: string;
    display_name: string;
    headline: string | null;
    skills: string[];
    aveiq_score: number | null;
    vetting: string;
    resume_score?: number | null;
    resume_url?: string | null;
    resume_feedback?: string | null;
    work_authorization?: string;
    ai_interview_status?: string;
    ai_interview_score?: number | null;
    ai_interview_summary?: string | null;
    main_interview_status?: string;
    main_interview_scheduled_at?: string | null;
  };
  onUpdate: (vetting: "pending" | "in_review" | "vetted" | "rejected", score: number | null) => Promise<void>;
}) {
  const [score, setScore] = useState<string>(engineer.aveiq_score?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [schedAt, setSchedAt] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const schedule = useServerFn(scheduleMainInterview);
  const verdict = useServerFn(setMainInterviewVerdict);

  const act = async (vetting: "pending" | "in_review" | "vetted" | "rejected") => {
    setBusy(true);
    try {
      const num = score === "" ? null : Math.max(0, Math.min(100, Number(score)));
      await onUpdate(vetting, Number.isFinite(num as number) ? (num as number | null) : null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <tr>
        <td className="px-4 py-4">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
            <ChevronDown className={`size-3 transition ${open ? "rotate-0" : "-rotate-90"}`} />
            <div>
              <p className="font-medium">{engineer.display_name}</p>
              <p className="text-xs text-muted-foreground">{engineer.headline ?? "—"}</p>
            </div>
          </button>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {engineer.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{s}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="space-y-0.5 text-[11px] text-muted-foreground">
            <p>Resume: <b className="text-foreground">{engineer.resume_score ?? "—"}</b></p>
            <p>AI: <b className="text-foreground">{engineer.ai_interview_score ?? "—"}</b></p>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Final"
              className="mt-1 w-20 rounded-md border border-border bg-background px-2 py-1 text-xs"
            />
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-black/5">
            {engineer.vetting}
          </span>
          <p className="mt-1 text-[10px] text-muted-foreground">main: {engineer.main_interview_status ?? "—"}</p>
        </td>
        <td className="px-4 py-4 text-right">
          <div className="inline-flex gap-2">
            <button disabled={busy} onClick={() => act("vetted")} className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50">Approve</button>
            <button disabled={busy} onClick={() => act("in_review")} className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium disabled:opacity-50">Review</button>
            <button disabled={busy} onClick={() => act("rejected")} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-50">Reject</button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-secondary/30">
          <td colSpan={5} className="px-6 py-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resume</h4>
                <p className="mt-1 text-xs">
                  {engineer.resume_url ? (
                    <span className="text-muted-foreground">Path: <code>{engineer.resume_url}</code></span>
                  ) : "No resume uploaded"}
                </p>
                {engineer.resume_feedback && (
                  <p className="mt-2 whitespace-pre-wrap rounded bg-background p-3 text-xs">{engineer.resume_feedback}</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Work auth: <b className="text-foreground">{engineer.work_authorization ?? "unspecified"}</b>
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI interview (Kai)</h4>
                <p className="mt-1 text-xs">Status: <b>{engineer.ai_interview_status ?? "not_started"}</b></p>
                {engineer.ai_interview_summary && (
                  <p className="mt-2 rounded bg-background p-3 text-xs">{engineer.ai_interview_summary}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Final interview</h4>
                {engineer.main_interview_scheduled_at && (
                  <p className="mt-1 text-xs">Scheduled: <b>{new Date(engineer.main_interview_scheduled_at).toLocaleString()}</b></p>
                )}
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Schedule at</span>
                    <input
                      type="datetime-local"
                      value={schedAt}
                      onChange={(e) => setSchedAt(e.target.value)}
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Notes / meeting link"
                    value={schedNotes}
                    onChange={(e) => setSchedNotes(e.target.value)}
                    className="h-9 flex-1 min-w-[200px] rounded-md border border-border bg-background px-2 text-xs"
                  />
                  <button
                    onClick={async () => {
                      if (!schedAt) return toast.error("Pick a date/time");
                      await schedule({ data: { user_id: engineer.user_id, scheduled_at: new Date(schedAt).toISOString(), notes: schedNotes } });
                      toast.success("Scheduled");
                    }}
                    className="h-9 rounded-md bg-foreground px-3 text-xs font-medium text-background"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={async () => {
                      await verdict({ data: { user_id: engineer.user_id, verdict: "passed", notes: schedNotes, approve_to_network: true } });
                      toast.success("Passed & added to network");
                    }}
                    className="h-9 rounded-md bg-success px-3 text-xs font-medium text-background"
                  >
                    Pass + Vet
                  </button>
                  <button
                    onClick={async () => {
                      await verdict({ data: { user_id: engineer.user_id, verdict: "failed", notes: schedNotes } });
                      toast.success("Marked failed");
                    }}
                    className="h-9 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground"
                  >
                    Fail
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
