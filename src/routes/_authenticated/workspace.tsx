import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Globe2,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyEngineerProfile, upsertMyEngineerProfile } from "@/lib/engineers.functions";
import { setWorkAuthorization } from "@/lib/screening.functions";
import { extractTextFromFile } from "@/lib/pdf-extract";
import { screenResume } from "@/lib/screening.functions";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { deleteMyAccount } from "@/lib/account.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tabSchema = z.object({
  tab: z
    .enum(["resume", "location", "availability", "preferences", "communications", "account"])
    .optional(),
});

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Aveiq" }] }),
  validateSearch: tabSchema,
  component: WorkspacePage,
});


type TabKey =
  | "resume"
  | "location"
  | "availability"
  | "preferences"
  | "communications"
  | "account";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "resume", label: "Resume", icon: FileText },
  { key: "location", label: "Location & Work authorization", icon: MapPin },
  { key: "availability", label: "Availability", icon: CalendarClock },
  { key: "preferences", label: "Work preferences", icon: Briefcase },
  { key: "communications", label: "Communications", icon: Bell },
  { key: "account", label: "Account", icon: UserCog },
];

const WORK_AUTH_OPTIONS = [
  { v: "unspecified", l: "Prefer not to say" },
  { v: "us_citizen", l: "US Citizen" },
  { v: "us_green_card", l: "US Green Card" },
  { v: "us_h1b", l: "US H1B" },
  { v: "us_opt_cpt", l: "US OPT / CPT" },
  { v: "us_tn", l: "US TN visa" },
  { v: "other_visa", l: "Other work visa" },
  { v: "india_resident", l: "India resident" },
  { v: "eu_resident", l: "EU resident" },
  { v: "remote_only", l: "Remote-only / contract" },
];

function WorkspacePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const get = useServerFn(getMyEngineerProfile);
  const upsert = useServerFn(upsertMyEngineerProfile);
  const setWA = useServerFn(setWorkAuthorization);
  const screen = useServerFn(screenResume);

  const [tab, setTab] = useState<TabKey>("resume");

  const { data, isLoading } = useQuery({
    queryKey: ["myEngineer", user?.id],
    queryFn: () => get(),
  });

  const e = data?.engineer;

  const [form, setForm] = useState({
    display_name: "",
    headline: "",
    bio: "",
    location: "",
    years_experience: "",
    hourly_rate_usd: "",
    skills: "",
    github_url: "",
    linkedin_url: "",
    website_url: "",
    available: true,
    work_authorization: "unspecified",
    email_notifications: true,
  });

  useEffect(() => {
    if (!e) {
      setForm((f) => ({
        ...f,
        display_name: (user?.user_metadata?.full_name as string) ?? "",
      }));
      return;
    }
    setForm({
      display_name: e.display_name ?? "",
      headline: e.headline ?? "",
      bio: e.bio ?? "",
      location: e.location ?? "",
      years_experience: e.years_experience?.toString() ?? "",
      hourly_rate_usd: e.hourly_rate_usd?.toString() ?? "",
      skills: (e.skills ?? []).join(", "),
      github_url: e.github_url ?? "",
      linkedin_url: e.linkedin_url ?? "",
      website_url: e.website_url ?? "",
      available: e.available ?? true,
      work_authorization: (e.work_authorization as string) ?? "unspecified",
      email_notifications: true,
    });
  }, [e, user]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsert({
        data: {
          display_name: form.display_name,
          headline: form.headline || null,
          bio: form.bio || null,
          location: form.location || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          hourly_rate_usd: form.hourly_rate_usd ? Number(form.hourly_rate_usd) : null,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20),
          github_url: form.github_url || null,
          linkedin_url: form.linkedin_url || null,
          website_url: form.website_url || null,
          available: form.available,
        },
      });
      await setWA({ data: { work_authorization: form.work_authorization as never } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["myEngineer"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (file: File) => {
    if (!user?.id) return;
    if (!e?.display_name) {
      toast.error("Fill in your basic info first.");
      return;
    }
    setUploading(true);
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted.trim().length < 100) {
        throw new Error("Couldn't read enough text from this file.");
      }
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const { error } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      const r = await screen({ data: { resume_url: path, resume_text: extracted } });
      toast.success(`Resume screened — score ${r.score}/100`);
      qc.invalidateQueries({ queryKey: ["myEngineer"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const completion = useMemo(() => {
    const items = [
      !!form.display_name,
      !!form.headline,
      !!form.location,
      !!form.years_experience,
      !!form.skills,
      !!form.linkedin_url,
      !!e?.resume_url,
      form.work_authorization !== "unspecified",
    ];
    const done = items.filter(Boolean).length;
    return Math.round((done / items.length) * 100);
  }, [form, e]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything companies see about you, in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            {completion}% complete
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${
              e?.vetting === "vetted"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            <ShieldCheck className="size-3" />
            {e?.vetting === "vetted" ? "Vetted" : e?.vetting === "in_review" ? "In review" : "Pending"}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar tabs */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto border-b border-border md:border-b-0 md:border-r md:pr-4 pb-2 md:pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`group inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <section className="rounded-2xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : tab === "resume" ? (
            <div className="space-y-6">
              <Heading title="Resume" subtitle="This is what companies use to find you opportunities." />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full name *">
                  <input
                    className={input}
                    value={form.display_name}
                    onChange={(ev) => setForm({ ...form, display_name: ev.target.value })}
                    placeholder="Enter your full name"
                  />
                </Field>
                <Field label="Email">
                  <input className={input} value={user?.email ?? ""} disabled />
                </Field>
                <Field label="Headline">
                  <input
                    className={input}
                    value={form.headline}
                    onChange={(ev) => setForm({ ...form, headline: ev.target.value })}
                    placeholder="e.g. Senior AI engineer · Ex-Razorpay"
                  />
                </Field>
                <Field label="LinkedIn URL *">
                  <input
                    className={input}
                    value={form.linkedin_url}
                    onChange={(ev) => setForm({ ...form, linkedin_url: ev.target.value })}
                    placeholder="https://www.linkedin.com/in/..."
                  />
                </Field>
                <Field label="GitHub URL">
                  <input
                    className={input}
                    value={form.github_url}
                    onChange={(ev) => setForm({ ...form, github_url: ev.target.value })}
                    placeholder="https://github.com/..."
                  />
                </Field>
                <Field label="Personal website">
                  <input
                    className={input}
                    value={form.website_url}
                    onChange={(ev) => setForm({ ...form, website_url: ev.target.value })}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="rounded-xl border-2 border-dashed border-border bg-background p-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-semibold">Drop your resume here</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or browse files on your computer · PDF up to 3MB
                </p>
                <label className="mt-4 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-medium hover:bg-secondary">
                  <Upload className="size-3.5" />
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={(ev) => ev.target.files?.[0] && onFile(ev.target.files[0])}
                  />
                </label>
                {e?.resume_url && (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 className="size-3" /> Resume uploaded · score{" "}
                    {e.resume_score ?? "—"}/100
                  </p>
                )}
              </div>

              <Field label="Summary">
                <textarea
                  className={`${input} min-h-[120px] py-2`}
                  value={form.bio}
                  onChange={(ev) => setForm({ ...form, bio: ev.target.value })}
                  placeholder="Briefly describe your experience…"
                />
              </Field>

              <Field label="Skills (comma separated)">
                <input
                  className={input}
                  value={form.skills}
                  onChange={(ev) => setForm({ ...form, skills: ev.target.value })}
                  placeholder="React, TypeScript, LLMs, RAG…"
                />
              </Field>
            </div>
          ) : tab === "location" ? (
            <div className="space-y-6">
              <Heading
                title="Location & Work authorization"
                subtitle="Helps us match you to roles in your timezone and that fit your legal status."
              />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Country *">
                  <select
                    className={input}
                    value={form.location}
                    onChange={(ev) => setForm({ ...form, location: ev.target.value })}
                  >
                    <option value="">Select your country…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Work authorization *">
                  <select
                    className={input}
                    value={form.work_authorization}
                    onChange={(ev) => setForm({ ...form, work_authorization: ev.target.value })}
                  >
                    {WORK_AUTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ) : tab === "availability" ? (
            <div className="space-y-6">
              <Heading
                title="Availability"
                subtitle="When you can start and how many hours per week."
              />
              <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(ev) => setForm({ ...form, available: ev.target.checked })}
                  className="size-4"
                />
                <div>
                  <p className="text-sm font-medium">I'm available to take on new work</p>
                  <p className="text-xs text-muted-foreground">
                    Turn this off and you won't show up in match results.
                  </p>
                </div>
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Years of experience">
                  <input
                    className={input}
                    type="number"
                    value={form.years_experience}
                    onChange={(ev) => setForm({ ...form, years_experience: ev.target.value })}
                  />
                </Field>
                <Field label="Expected hourly rate (USD)">
                  <input
                    className={input}
                    type="number"
                    value={form.hourly_rate_usd}
                    onChange={(ev) => setForm({ ...form, hourly_rate_usd: ev.target.value })}
                  />
                </Field>
              </div>
            </div>
          ) : tab === "preferences" ? (
            <div className="space-y-6">
              <Heading
                title="Work preferences"
                subtitle="The kind of work and engagements that get you excited."
              />
              <Field label="What roles are you interested in?">
                <textarea
                  className={`${input} min-h-[120px] py-2`}
                  placeholder="Describe the kind of work you want — e.g. AI engineering at seed-to-series-B, contract or full time, async-friendly…"
                />
              </Field>
            </div>
          ) : tab === "communications" ? (
            <div className="space-y-6">
              <Heading
                title="Communications"
                subtitle="How and how often you hear from us."
              />
              <div className="space-y-3">
                <Toggle
                  icon={Mail}
                  title="Email notifications"
                  desc="New role matches and interview updates"
                  checked={form.email_notifications}
                  onChange={(v) => setForm({ ...form, email_notifications: v })}
                />
                <Toggle
                  icon={Globe2}
                  title="Product updates"
                  desc="Occasional announcements about Aveiq"
                  checked
                  onChange={() => {}}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Heading title="Account" subtitle="Account-level settings and links." />
              <div className="space-y-3 text-sm">
                <Row label="Email" value={user?.email ?? "—"} />
                <Row label="User ID" value={user?.id ?? "—"} mono />
                <Row label="Vetting" value={e?.vetting ?? "pending"} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/refer"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
                >
                  Refer & earn
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-border pt-6">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const input =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Toggle({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
    </label>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
