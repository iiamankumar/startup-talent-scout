import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createHireRequest, getMyLatestCompany } from "@/lib/hire.functions";
import { sendTransactionalEmail } from "@/lib/email/send";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/hire")({
  head: () => ({ meta: [{ title: "Hire talent — Aveiq" }] }),
  component: HirePage,
});

function HirePage() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isEngineer = roles.includes("engineer");
  const isFounder = roles.includes("founder");
  const isAdmin = roles.includes("admin");
  // Lock account to applying — engineer accounts can't post hire requests.
  const blocked = isEngineer && !isFounder && !isAdmin;

  const submitFn = useServerFn(createHireRequest);
  const getCompany = useServerFn(getMyLatestCompany);
  const { data: companyData } = useQuery({
    queryKey: ["myLatestCompany"],
    queryFn: () => getCompany(),
    enabled: !blocked,
  });
  const [form, setForm] = useState({
    company_name: "",
    company_website: "",
    company_stage: "" as "" | "idea" | "pre_seed" | "seed" | "series_a" | "series_b_plus",
    role_title: "",
    stack: "",
    budget_monthly_usd: "",
    urgency: "1w" as "72h" | "1w" | "2w" | "flex",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = companyData?.company;
    if (!c) return;
    setForm((f) => ({
      ...f,
      company_name: f.company_name || c.name || "",
      company_website: f.company_website || c.website || "",
      company_stage: (f.company_stage || (c.stage ?? "")) as typeof f.company_stage,
    }));
  }, [companyData]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFn({
        data: {
          company_name: form.company_name,
          company_website: form.company_website || "",
          company_stage: form.company_stage || null,
          role_title: form.role_title,
          stack: form.stack
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 15),
          budget_monthly_usd: form.budget_monthly_usd ? Number(form.budget_monthly_usd) : null,
          urgency: form.urgency,
          notes: form.notes || null,
        },
      });
      toast.success("Brief submitted. We'll send a shortlist within 72 hours.");
      if (user?.email) {
        sendTransactionalEmail({
          templateName: 'hire-request-submitted',
          recipientEmail: user.email,
          idempotencyKey: `hire-${user.id}-${Date.now()}`,
          templateData: { companyName: form.company_name, roleTitle: form.role_title },
        }).catch(() => {});
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (blocked) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <h1 className="text-2xl font-medium tracking-tight">This is an engineer account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account is set up to apply for roles. One account is locked to one path —
            you can't post hire requests from an engineer account. To hire, sign out and create a
            separate account with a different email.
          </p>
          <div className="mt-5 flex gap-3">
            <Link to="/roles" className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background">
              Browse open roles
            </Link>
            <Link to="/dashboard" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-medium tracking-tight">Tell us what you're hiring for</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll hand-pick 3–5 cracked engineers and send the shortlist within 72 hours.
      </p>


      <form
        onSubmit={submit}
        className="mt-10 space-y-6 rounded-2xl bg-card p-8 ring-1 ring-black/5"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Company name *">
            <input
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Company website">
            <input
              type="url"
              value={form.company_website}
              onChange={(e) => setForm({ ...form, company_website: e.target.value })}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Stage">
            <select
              value={form.company_stage}
              onChange={(e) =>
                setForm({ ...form, company_stage: e.target.value as typeof form.company_stage })
              }
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Select…</option>
              <option value="idea">Idea</option>
              <option value="pre_seed">Pre-seed</option>
              <option value="seed">Seed</option>
              <option value="series_a">Series A</option>
              <option value="series_b_plus">Series B+</option>
            </select>
          </Field>
          <Field label="Urgency *">
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value as typeof form.urgency })}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="72h">Within 72 hours</option>
              <option value="1w">Within a week</option>
              <option value="2w">Within two weeks</option>
              <option value="flex">Flexible</option>
            </select>
          </Field>
          <Field label="Role title *">
            <input
              required
              placeholder="e.g. Founding AI Engineer"
              value={form.role_title}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Monthly budget (INR)">
            <input
              type="number"
              value={form.budget_monthly_usd}
              onChange={(e) => setForm({ ...form, budget_monthly_usd: e.target.value })}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </Field>
        </div>

        <Field label="Stack (comma-separated)">
          <input
            placeholder="Next.js, Python, Postgres, LangChain"
            value={form.stack}
            onChange={(e) => setForm({ ...form, stack: e.target.value })}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>

        <Field label="Notes">
          <textarea
            rows={5}
            placeholder="What are you building? What does this person need to be cracked at?"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-md bg-foreground px-6 text-sm font-medium text-background disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit brief"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
