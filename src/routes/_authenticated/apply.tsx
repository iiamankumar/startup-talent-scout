import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyEngineerProfile, upsertMyEngineerProfile } from "@/lib/engineers.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/apply")({
  head: () => ({ meta: [{ title: "Apply to the network — Klyro" }] }),
  component: ApplyPage,
});

function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getMyEngineerProfile);
  const upsert = useServerFn(upsertMyEngineerProfile);

  const { data } = useQuery({
    queryKey: ["myEngineer", user?.id],
    queryFn: () => get(),
  });

  const [form, setForm] = useState({
    display_name: "",
    headline: "",
    bio: "",
    location: "",
    years_experience: "" as string,
    hourly_rate_usd: "" as string,
    skills: "",
    github_url: "",
    linkedin_url: "",
    website_url: "",
    available: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const e = data?.engineer;
    if (!e) {
      // Pre-fill display name from auth
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
    });
  }, [data, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success("Profile saved. We'll review and notify you.");
      qc.invalidateQueries({ queryKey: ["myEngineer"] });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-medium tracking-tight">Apply to the network</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about yourself. Every applicant is manually reviewed by a senior engineer.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6 rounded-2xl bg-card p-8 ring-1 ring-black/5">
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Display name *"
            required
            value={form.display_name}
            onChange={(v) => setForm({ ...form, display_name: v })}
          />
          <Input
            label="Headline"
            placeholder="e.g. Full-stack AI engineer · Ex-Razorpay"
            value={form.headline}
            onChange={(v) => setForm({ ...form, headline: v })}
          />
          <Input
            label="Location"
            placeholder="e.g. Bangalore, IN"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
          />
          <Input
            label="Years of experience"
            type="number"
            value={form.years_experience}
            onChange={(v) => setForm({ ...form, years_experience: v })}
          />
          <Input
            label="Hourly rate (USD)"
            type="number"
            value={form.hourly_rate_usd}
            onChange={(v) => setForm({ ...form, hourly_rate_usd: v })}
          />
          <Input
            label="Available"
            type="checkbox"
            checked={form.available}
            onChange={(v) => setForm({ ...form, available: v === "true" })}
          />
        </div>

        <TextArea
          label="Bio"
          placeholder="What have you built? What are you cracked at?"
          value={form.bio}
          onChange={(v) => setForm({ ...form, bio: v })}
        />

        <Input
          label="Skills (comma-separated)"
          placeholder="Next.js, PyTorch, Rust, LangChain"
          value={form.skills}
          onChange={(v) => setForm({ ...form, skills: v })}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Input
            label="GitHub URL"
            type="url"
            value={form.github_url}
            onChange={(v) => setForm({ ...form, github_url: v })}
          />
          <Input
            label="LinkedIn URL"
            type="url"
            value={form.linkedin_url}
            onChange={(v) => setForm({ ...form, linkedin_url: v })}
          />
          <Input
            label="Website"
            type="url"
            value={form.website_url}
            onChange={(v) => setForm({ ...form, website_url: v })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-md bg-foreground px-6 text-sm font-medium text-background disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}

function Input({
  label,
  type = "text",
  value,
  checked,
  onChange,
  ...rest
}: {
  label: string;
  type?: string;
  value?: string;
  checked?: boolean;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="size-4 rounded border-border"
        />
        <span>{label}</span>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
        {...rest}
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
        rows={5}
        className="w-full rounded-md border border-border bg-background p-3 text-sm"
      />
    </label>
  );
}
