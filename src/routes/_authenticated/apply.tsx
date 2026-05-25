import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Sparkles, Upload } from "lucide-react";
import { getMyEngineerProfile, upsertMyEngineerProfile } from "@/lib/engineers.functions";
import { screenResume, setWorkAuthorization } from "@/lib/screening.functions";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/apply")({
  head: () => ({ meta: [{ title: "Apply to the network — Aveiq" }] }),
  component: ApplyPage,
});

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

function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getMyEngineerProfile);
  const upsert = useServerFn(upsertMyEngineerProfile);
  const screen = useServerFn(screenResume);
  const setWA = useServerFn(setWorkAuthorization);

  const { data } = useQuery({
    queryKey: ["myEngineer", user?.id],
    queryFn: () => get(),
  });

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
  });
  const [submitting, setSubmitting] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [screening, setScreening] = useState(false);

  useEffect(() => {
    const e = data?.engineer;
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
      work_authorization: e.work_authorization ?? "unspecified",
    });
    setResumeUrl(e.resume_url ?? null);
    setResumeText(e.resume_text ?? "");
  }, [data, user]);

  const profileSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    try {
      await upsert({
        data: {
          display_name: form.display_name,
          headline: form.headline || null,
          bio: form.bio || null,
          location: form.location || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          hourly_rate_usd: form.hourly_rate_usd ? Number(form.hourly_rate_usd) : null,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
          github_url: form.github_url || null,
          linkedin_url: form.linkedin_url || null,
          website_url: form.website_url || null,
          available: form.available,
        },
      });
      await setWA({ data: { work_authorization: form.work_authorization as never } });
      toast.success("Profile saved.");
      qc.invalidateQueries({ queryKey: ["myEngineer"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const onFile = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const { error } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      setResumeUrl(path);
      toast.success("Resume uploaded. Paste the resume text below, then run AI screening.");
      if (file.type.startsWith("text/")) {
        const txt = await file.text();
        setResumeText(txt);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const runScreen = async () => {
    if (!resumeUrl) return toast.error("Upload your resume first.");
    if (resumeText.trim().length < 200) return toast.error("Paste at least 200 chars of your resume text so AI can read it.");
    setScreening(true);
    try {
      const r = await screen({ data: { resume_url: resumeUrl, resume_text: resumeText } });
      toast.success(`Screening done — score ${r.score}/100`);
      qc.invalidateQueries({ queryKey: ["myEngineer"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setScreening(false);
    }
  };

  const eng = data?.engineer;
  const profileSaved = !!eng?.display_name;
  const screened = eng?.resume_score != null;
  const aiDone =
    eng?.ai_interview_status === "completed" ||
    eng?.ai_interview_status === "passed" ||
    eng?.ai_interview_status === "failed";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-medium tracking-tight">Apply to the network</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Four steps. Every engineer is screened on resume signal, an AI interview, and a final human round.
      </p>

      <ol className="mt-8 grid gap-2 md:grid-cols-4">
        <Step n={1} label="Profile" done={profileSaved} />
        <Step n={2} label="Resume + AI screen" done={screened} />
        <Step n={3} label="AI interview" done={aiDone} />
        <Step n={4} label="Final interview" done={eng?.main_interview_status === "passed"} />
      </ol>

      {/* STEP 1 */}
      <section className="mt-10">
        <SectionHeader index={1} title="Profile & work authorization" />
        <form onSubmit={profileSubmit} className="mt-4 space-y-6 rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <div className="grid gap-6 md:grid-cols-2">
            <Input label="Display name *" required value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
            <Input label="Headline" placeholder="e.g. AI AI engineer · Ex-Razorpay" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
            <Input label="Location" placeholder="e.g. Bangalore, IN" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <Input label="Years of experience" type="number" value={form.years_experience} onChange={(v) => setForm({ ...form, years_experience: v })} />
            <Input label="Hourly rate (USD)" type="number" value={form.hourly_rate_usd} onChange={(v) => setForm({ ...form, hourly_rate_usd: v })} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Work authorization *</span>
              <select
                value={form.work_authorization}
                onChange={(e) => setForm({ ...form, work_authorization: e.target.value })}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {WORK_AUTH_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </label>
          </div>
          <TextArea label="Bio" placeholder="What have you built? What are you cracked at?" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} />
          <Input label="Skills (comma-separated)" placeholder="Next.js, PyTorch, Rust, LangChain" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
          <div className="grid gap-6 md:grid-cols-3">
            <Input label="GitHub URL" type="url" value={form.github_url} onChange={(v) => setForm({ ...form, github_url: v })} />
            <Input label="LinkedIn URL" type="url" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
            <Input label="Website" type="url" value={form.website_url} onChange={(v) => setForm({ ...form, website_url: v })} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="size-4 rounded border-border"
            />
            <span>Available for new opportunities</span>
          </label>
          <button type="submit" disabled={submitting} className="h-11 rounded-md bg-foreground px-6 text-sm font-medium text-background disabled:opacity-60">
            {submitting ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      {/* STEP 2 */}
      <section className="mt-10">
        <SectionHeader index={2} title="Resume + AI screening" />
        <div className="mt-4 space-y-5 rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border bg-background/50 p-5 hover:bg-background">
            <div className="flex items-center gap-3">
              {resumeUrl ? <FileText className="size-5 text-success" /> : <Upload className="size-5 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">
                  {resumeUrl ? "Resume on file" : "Upload your resume (PDF, DOCX, TXT)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stored privately. Visible only to you and Aveiq reviewers.
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <span className="text-xs text-muted-foreground underline">
              {uploading ? "Uploading…" : "Choose file"}
            </span>
          </label>

          <TextArea
            label="Paste resume text (so AI can read it accurately)"
            value={resumeText}
            onChange={setResumeText}
            placeholder="Paste the full plain-text contents of your resume here…"
          />

          <button
            onClick={runScreen}
            disabled={screening || !profileSaved}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {screening ? "Screening…" : screened ? "Re-run AI screening" : "Run AI screening"}
          </button>

          {eng?.resume_score != null && (
            <div className="rounded-xl bg-secondary p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Resume score</p>
                <p className="text-2xl font-medium">{eng.resume_score}/100</p>
              </div>
              {eng.resume_feedback && (
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{eng.resume_feedback}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* STEP 3 */}
      <section className="mt-10">
        <SectionHeader index={3} title="AI interview with Kai" />
        <div className="mt-4 rounded-2xl bg-card p-8 ring-1 ring-black/5">
          {aiDone ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 size-5 text-success" />
              <div>
                <p className="text-sm font-medium">
                  Interview complete{eng?.ai_interview_score != null ? ` — score ${eng.ai_interview_score}/100` : ""}
                </p>
                {eng?.ai_interview_summary && (
                  <p className="mt-1 text-xs text-muted-foreground">{eng.ai_interview_summary}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                A 10-minute on-the-record conversation with Kai, our AI interviewer. The transcript is reviewed by a senior Aveiq engineer before your final round.
              </p>
              <button
                onClick={() => navigate({ to: "/interview" })}
                disabled={!screened}
                className="mt-4 inline-flex h-11 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
              >
                {screened ? "Start AI interview" : "Complete screening first"}
              </button>
            </>
          )}
        </div>
      </section>

      {/* STEP 4 */}
      <section className="mt-10">
        <SectionHeader index={4} title="Final human interview" />
        <div className="mt-4 rounded-2xl bg-card p-8 ring-1 ring-black/5">
          {eng?.main_interview_scheduled_at ? (
            <p className="text-sm">
              Scheduled for <span className="font-medium">{new Date(eng.main_interview_scheduled_at).toLocaleString()}</span>.
              {eng.main_interview_notes && (
                <span className="mt-2 block text-xs text-muted-foreground">{eng.main_interview_notes}</span>
              )}
            </p>
          ) : aiDone ? (
            <p className="text-sm text-muted-foreground">
              Kai has logged your AI interview. A senior Aveiq engineer will email you within 48 hours to schedule the final round.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Unlocks after the AI interview.</p>
          )}
          <Link to="/dashboard" className="mt-4 inline-block text-xs text-muted-foreground underline">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function Step({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${done ? "bg-success/10 ring-success/30" : "bg-card ring-black/5"}`}>
      <span className={`grid size-7 place-items-center rounded-full text-xs font-medium ${done ? "bg-success text-background" : "bg-secondary text-muted-foreground"}`}>
        {done ? <CheckCircle2 className="size-4" /> : n}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </li>
  );
}

function SectionHeader({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border pb-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step {index}</span>
      <h2 className="text-lg font-medium">{title}</h2>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  type?: string;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-md border border-border bg-background p-3 text-sm"
      />
    </label>
  );
}
