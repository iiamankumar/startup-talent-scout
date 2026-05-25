import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Github, Linkedin, Globe, Star, ArrowLeft } from "lucide-react";
import { getEngineerPublicProfile } from "@/lib/engineers.functions";
import { listEngineerReviews, submitEngineerReview } from "@/lib/reviews.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { AveiqLogo } from "@/components/AveiqLogo";

export const Route = createFileRoute("/engineer/$userId")({
  head: () => ({ meta: [{ title: "Engineer profile — Aveiq" }] }),
  component: EngineerProfilePage,
});

function EngineerProfilePage() {
  const { userId } = useParams({ from: "/engineer/$userId" });
  const { user } = useAuth();
  const getProfile = useServerFn(getEngineerPublicProfile);
  const getReviews = useServerFn(listEngineerReviews);
  const submit = useServerFn(submitEngineerReview);

  const profileQ = useQuery({
    queryKey: ["engineerProfile", userId],
    queryFn: () => getProfile({ data: { user_id: userId } }),
  });
  const reviewsQ = useQuery({
    queryKey: ["engineerReviews", userId],
    queryFn: () => getReviews({ data: { engineer_id: userId } }),
  });

  const e = profileQ.data?.engineer;
  const reviews = reviewsQ.data?.reviews ?? [];
  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <AveiqLogo />
        </Link>
        <Link to="/network" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 size-4" /> Network
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        {profileQ.isLoading && <p className="text-sm text-muted-foreground">Loading profile…</p>}
        {!profileQ.isLoading && !e && (
          <div className="rounded-2xl bg-card p-10 ring-1 ring-black/5">
            <h1 className="text-2xl font-medium">Profile not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This engineer is not on the public network.
            </p>
          </div>
        )}

        {e && (
          <>
            <div className="flex flex-col gap-6 rounded-2xl bg-card p-8 ring-1 ring-black/5 md:flex-row md:items-start">
              <div className="grid size-20 place-items-center rounded-full bg-secondary text-xl font-semibold">
                {e.display_name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-medium tracking-tight">{e.display_name}</h1>
                <p className="mt-1 text-muted-foreground">{e.headline ?? "Engineer"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground/70">
                  {e.location ?? "Remote"}
                  {e.years_experience != null ? ` · ${e.years_experience} yrs experience` : ""}
                  {e.hourly_rate_usd != null ? ` · $${e.hourly_rate_usd}/hr` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(e.skills ?? []).map((s) => (
                    <span key={s} className="rounded bg-background px-2 py-0.5 text-xs ring-1 ring-black/5">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-4 text-muted-foreground">
                  {e.github_url && (
                    <a href={e.github_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                      <Github className="size-4" />
                    </a>
                  )}
                  {e.linkedin_url && (
                    <a href={e.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                      <Linkedin className="size-4" />
                    </a>
                  )}
                  {e.website_url && (
                    <a href={e.website_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                      <Globe className="size-4" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {e.klyro_score != null && (
                  <div className="rounded-lg bg-background px-3 py-2 text-right ring-1 ring-black/5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Aveiq Score</p>
                    <p className="text-2xl font-medium text-success">{e.klyro_score}</p>
                  </div>
                )}
                {avg != null && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="size-3 fill-current text-success" />
                    <span className="font-medium">{avg}</span>
                    <span className="text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            {e.bio && (
              <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-black/5">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  About
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {e.bio}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Reviews ({reviews.length})
                </h2>
              </div>
              {reviewsQ.isLoading && (
                <p className="mt-4 text-sm text-muted-foreground">Loading reviews…</p>
              )}
              {!reviewsQ.isLoading && reviews.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  No reviews yet. Founders who hire {e.display_name.split(" ")[0]} through Aveiq can
                  leave a verified review.
                </p>
              )}
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl bg-background p-5 ring-1 ring-black/5">
                    <div className="flex items-center gap-1 text-success">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="size-3 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">“{r.quote}”</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {r.reviewer_name}
                      {r.reviewer_role ? ` · ${r.reviewer_role}` : ""}
                      {r.reviewer_company ? ` @ ${r.reviewer_company}` : ""}
                    </p>
                  </li>
                ))}
              </ul>

              {user ? (
                <ReviewForm
                  onSubmit={async (payload) => {
                    try {
                      await submit({ data: { engineer_id: userId, ...payload } });
                      toast.success("Review submitted. It will appear once an admin approves it.");
                      reviewsQ.refetch();
                    } catch (err) {
                      toast.error((err as Error).message);
                    }
                  }}
                />
              ) : (
                <p className="mt-6 rounded-md bg-background p-4 text-xs text-muted-foreground ring-1 ring-black/5">
                  <Link to="/login" className="underline">
                    Sign in
                  </Link>{" "}
                  to leave a review for {e.display_name.split(" ")[0]}.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function ReviewForm({
  onSubmit,
}: {
  onSubmit: (p: {
    reviewer_name: string;
    reviewer_role: string | null;
    reviewer_company: string | null;
    rating: number;
    quote: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit({
            reviewer_name: name,
            reviewer_role: role.trim() || null,
            reviewer_company: company.trim() || null,
            rating,
            quote,
          });
          setName("");
          setRole("");
          setCompany("");
          setQuote("");
          setRating(5);
        } finally {
          setBusy(false);
        }
      }}
      className="mt-6 space-y-3 rounded-xl bg-background p-5 ring-1 ring-black/5"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Leave a review
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          required
          placeholder="Your name"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <input
          placeholder="Your role (optional)"
          value={role}
          onChange={(ev) => setRole(ev.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <input
          placeholder="Company (optional)"
          value={company}
          onChange={(ev) => setCompany(ev.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-success" : "text-muted-foreground/40"}
          >
            <Star className="size-4 fill-current" />
          </button>
        ))}
      </div>
      <textarea
        required
        minLength={20}
        rows={3}
        placeholder="What was it like working with this engineer? (min 20 chars)"
        value={quote}
        onChange={(ev) => setQuote(ev.target.value)}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
