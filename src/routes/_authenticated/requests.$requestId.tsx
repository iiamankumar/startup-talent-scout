import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listApplicationsForRequest,
  updateApplicationStatus,
} from "@/lib/applications.functions";
import { updateHireRequest, setHireRequestStatus } from "@/lib/hire.functions";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_authenticated/requests/$requestId")({
  head: () => ({ meta: [{ title: "Applications — Aveiq" }] }),
  component: RequestApplicationsPage,
});

function RequestApplicationsPage() {
  const { requestId } = useParams({ from: "/_authenticated/requests/$requestId" });
  const list = useServerFn(listApplicationsForRequest);
  const update = useServerFn(updateApplicationStatus);
  const editFn = useServerFn(updateHireRequest);
  const setStatusFn = useServerFn(setHireRequestStatus);

  const appsQ = useQuery({
    queryKey: ["requestApps", requestId],
    queryFn: () => list({ data: { hire_request_id: requestId } }),
  });

  // Live updates: refresh when new applications come in or this request is edited.
  useRealtimeInvalidate([
    {
      table: "applications",
      filter: `hire_request_id=eq.${requestId}`,
      invalidate: [["requestApps", requestId]],
    },
    {
      table: "hire_requests",
      filter: `id=eq.${requestId}`,
      invalidate: [["requestApps", requestId]],
    },
  ]);

  const hr = appsQ.data?.hire_request as
    | {
        role_title?: string;
        stack?: string[];
        budget_monthly_usd?: number | null;
        urgency?: string | null;
        notes?: string | null;
        status?: string;
      }
    | undefined;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    role_title: "",
    stack: "",
    budget_monthly_usd: "",
    urgency: "1w" as "72h" | "1w" | "2w" | "flex",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hr) return;
    setForm({
      role_title: hr.role_title ?? "",
      stack: (hr.stack ?? []).join(", "),
      budget_monthly_usd: hr.budget_monthly_usd != null ? String(hr.budget_monthly_usd) : "",
      urgency: (hr.urgency as typeof form.urgency) || "1w",
      notes: hr.notes ?? "",
    });
  }, [hr?.role_title, hr?.urgency]);

  const saveEdits = async () => {
    setBusy(true);
    try {
      await editFn({
        data: {
          hire_request_id: requestId,
          role_title: form.role_title,
          stack: form.stack.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15),
          budget_monthly_usd: form.budget_monthly_usd ? Number(form.budget_monthly_usd) : null,
          urgency: form.urgency,
          notes: form.notes || null,
        },
      });
      toast.success("Role updated");
      setEditing(false);
      appsQ.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    const next = hr?.status === "open" ? "closed" : "open";
    setBusy(true);
    try {
      await setStatusFn({ data: { hire_request_id: requestId, status: next } });
      toast.success(next === "closed" ? "Role closed" : "Role reopened");
      appsQ.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/dashboard" className="text-sm text-muted-foreground underline">
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">
            Applications for {hr?.role_title ?? "your role"}
          </h1>
          {hr?.status && (
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Status: {hr.status}
            </p>
          )}
        </div>
        {hr && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
            >
              {editing ? "Cancel" : "Edit role"}
            </button>
            <button
              onClick={toggleStatus}
              disabled={busy}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
            >
              {hr.status === "open" ? "Close role (fulfilled)" : "Reopen role"}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <section className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-black/5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Edit role
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Role title</span>
              <input
                value={form.role_title}
                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Urgency</span>
              <select
                value={form.urgency}
                onChange={(e) =>
                  setForm({ ...form, urgency: e.target.value as typeof form.urgency })
                }
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="72h">Within 72 hours</option>
                <option value="1w">Within a week</option>
                <option value="2w">Within two weeks</option>
                <option value="flex">Flexible</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Monthly budget (INR)</span>
              <input
                type="number"
                value={form.budget_monthly_usd}
                onChange={(e) => setForm({ ...form, budget_monthly_usd: e.target.value })}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Stack (comma-separated)</span>
              <input
                value={form.stack}
                onChange={(e) => setForm({ ...form, stack: e.target.value })}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
            <textarea
              rows={5}
              maxLength={5000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, 5000) })}
              className="w-full rounded-md border border-border bg-background p-3 text-sm"
            />
          </label>
          <div className="mt-4">
            <button
              onClick={saveEdits}
              disabled={busy}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      )}

      <div className="mt-8 space-y-4">
        {appsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {appsQ.data?.applications.map((a) => {
          const eng = a.engineers as {
            display_name?: string;
            headline?: string | null;
            location?: string | null;
            skills?: string[];
            years_experience?: number | null;
            aveiq_score?: number | null;
            github_url?: string | null;
            linkedin_url?: string | null;
            website_url?: string | null;
          } | null;
          return (
            <article key={a.id} className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to="/engineer/$userId"
                    params={{ userId: a.engineer_id as string }}
                    className="text-lg font-semibold hover:underline"
                  >
                    {eng?.display_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{eng?.headline ?? "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {eng?.location ?? "Remote"} · {eng?.years_experience ?? "?"} yrs
                    {eng?.aveiq_score != null && ` · Aveiq Score ${eng.aveiq_score}`}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/engineer/$userId"
                    params={{ userId: a.engineer_id as string }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    View profile
                  </Link>
                  {a.status === "hired" && (
                    <Link
                      to="/engineer/$userId"
                      params={{ userId: a.engineer_id as string }}
                      hash="reviews"
                      className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                    >
                      Leave a review
                    </Link>
                  )}
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
