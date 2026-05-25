import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, FileText, Instagram, Linkedin, ArrowRight, Star } from "lucide-react";
import { getFeaturedEngineers, getLandingStats } from "@/lib/reviews.functions";
import { AveiqLogo } from "@/components/AveiqLogo";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aveiq — Hire India's top AI engineers in 72 hours" },
      {
        name: "description",
        content:
          "Aveiq is a curated network of India's top AI engineers — RAG, agents, fine-tuning, evals, inference. Hand-vetted on shipped work. Matched to startups in under 72 hours.",
      },
      { property: "og:title", content: "Aveiq — India's top AI engineers, hand-vetted" },
      {
        property: "og:description",
        content: "RAG, agents, fine-tuning, inference. The top 0.1% of India's AI engineers, matched to startups in 72 hours.",
      },
    ],

    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@1&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const fetchStats = useServerFn(getLandingStats);
  const fetchEngineers = useServerFn(getFeaturedEngineers);

  const statsQ = useQuery({ queryKey: ["landingStats"], queryFn: () => fetchStats() });
  const engineersQ = useQuery({ queryKey: ["featuredEngineers"], queryFn: () => fetchEngineers() });

  const stats = statsQ.data;
  const engineers = engineersQ.data?.engineers ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-secondary">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <AveiqLogo />
        </Link>
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            to="/network"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Network
          </Link>
          <a
            href="#process"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            How it works
          </a>
          <Link
            to="/resume-review"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Free ATS check
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/hire"
            className="inline-flex items-center rounded-full bg-foreground py-2 pl-3 pr-4 text-sm font-medium text-background ring-1 ring-foreground transition-transform hover:scale-[1.02]"
          >
            <Plus className="mr-1.5 size-4" />
            Hire Talent
          </Link>
        </div>
      </nav>

      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-[48ch]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground ring-1 ring-black/5">
              <span className="size-1.5 rounded-full bg-success" />
              For AI startups hiring in India
            </div>
            <h1 className="text-balance text-5xl font-medium leading-tight tracking-tight lg:text-7xl">
              Hire India's top{" "}
              <span className="font-serif italic">AI engineers</span> in 72 hours.
            </h1>
          </div>

          <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-[56ch] text-pretty text-lg text-muted-foreground lg:text-xl">
              RAG, agents, fine-tuning, evals, inference. The top 0.1% of India's
              AI engineers — hand-vetted on shipped work, technical depth, and
              ownership. No resume spam, no agency fluff.
            </p>

            <div className="flex gap-3">
              <Link
                to="/network"
                className="inline-flex h-10 items-center rounded-md bg-foreground py-2 pl-3 pr-4 text-sm font-medium text-background ring-1 ring-foreground"
              >
                <FileText className="mr-2 size-4" />
                View Network
              </Link>
              <Link
                to="/apply"
                className="inline-flex h-10 items-center rounded-md bg-secondary py-2 pl-3 pr-4 text-sm font-medium text-foreground ring-1 ring-black/5 hover:bg-muted"
              >
                Apply as Talent
              </Link>
            </div>
          </div>

          {/* Real live stats from the DB */}
          <dl className="mt-20 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            <Stat label="Vetted engineers" value={stats?.vettedEngineers} loading={statsQ.isLoading} />
            <Stat label="In review" value={stats?.pendingEngineers} loading={statsQ.isLoading} />
            <Stat label="Open roles" value={stats?.openRoles} loading={statsQ.isLoading} />
            <Stat label="Verified reviews" value={stats?.approvedReviews} loading={statsQ.isLoading} />
          </dl>
        </div>
      </section>

      <section id="network" className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Featured engineers
            </h2>
            <Link to="/network" className="text-sm text-muted-foreground/80 hover:text-foreground">
              See full network →
            </Link>
          </div>

          {engineersQ.isLoading && (
            <p className="mt-12 text-sm text-muted-foreground">Loading engineers…</p>
          )}

          {!engineersQ.isLoading && engineers.length === 0 && (
            <div className="mt-12 rounded-xl bg-card p-10 ring-1 ring-black/5">
              <h3 className="text-lg font-medium">The network is just opening up.</h3>
              <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
                No engineers have been vetted onto Aveiq yet. We're reviewing applications by hand.
                Be one of the first profiles on the network — apply below.
              </p>
              <Link
                to="/apply"
                className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                Apply to the network <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          )}

          {engineers.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {engineers.map((e) => {
                const initials = e.display_name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <article
                    key={e.user_id}
                    className="group relative rounded-xl bg-card p-6 ring-1 ring-black/5 transition-all hover:ring-black/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-semibold text-foreground outline outline-1 -outline-offset-1 outline-black/5">
                        {initials}
                      </div>
                      <div className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-success ring-1 ring-black/5">
                        AVAILABLE
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-semibold">{e.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {e.headline ?? "Engineer"}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {(e.skills ?? []).slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-black/5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {e.topReview && (
                      <blockquote className="mt-5 rounded-md bg-background p-3 ring-1 ring-black/5">
                        <div className="flex items-center gap-1 text-success">
                          {Array.from({ length: e.topReview.rating }).map((_, i) => (
                            <Star key={i} className="size-3 fill-current" />
                          ))}
                        </div>
                        <p className="mt-2 line-clamp-3 text-xs text-foreground/80">
                          “{e.topReview.quote}”
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {e.topReview.reviewer_name}
                          {e.topReview.reviewer_company ? ` · ${e.topReview.reviewer_company}` : ""}
                        </p>
                      </blockquote>
                    )}
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                      <span className="text-muted-foreground/70">
                        {e.years_experience != null ? `${e.years_experience} yrs` : "—"}
                      </span>
                      {e.aveiq_score != null ? (
                        <span className="font-medium text-success">
                          Aveiq Score {e.aveiq_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">Newly vetted</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="process" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-balance lg:text-4xl">
                Hiring in India is broken.{" "}
                <span className="font-serif italic text-muted-foreground">We fix the noise.</span>
              </h2>
              <p className="mt-4 max-w-[56ch] text-pretty text-muted-foreground">
                Stop sifting through thousands of generic applications. We do the manual work of
                verifying code quality and communication so you don't have to.
              </p>
            </div>
            <div className="space-y-12">
              {[
                {
                  n: "01",
                  t: "Engineers apply, we review by hand",
                  d: "Every applicant submits their GitHub, LinkedIn, and projects. A reviewer goes through them and assigns a Aveiq Score before anyone goes live on the network.",
                },
                {
                  n: "02",
                  t: "Founders post a brief",
                  d: "Tell us your stack, stage, and budget. The brief goes to vetted engineers — they apply directly with a short note explaining why they're a fit.",
                },
                {
                  n: "03",
                  t: "You shortlist and hire",
                  d: "See real applications, real GitHubs, and real reviews from past founders. Move them through shortlist → hired right inside Aveiq.",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-6">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground/40">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="hire" className="border-t border-border py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-10 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              For founders
            </p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">
              Post a brief. See real applications.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Tell us your stack and stage. Vetted engineers apply directly — every profile has a
              real GitHub, real experience, and (when available) verified reviews.
            </p>
            <Link
              to="/hire"
              className="mt-8 inline-flex h-10 items-center rounded-md bg-foreground py-2 pl-4 pr-3 text-sm font-medium text-background"
            >
              Post a brief
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-surface p-10 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              For engineers
            </p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">
              Get matched with serious startups.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Apply once. Once you're vetted, you can apply to any open role on the network with one
              click. Collect verified reviews from every founder you work with.
            </p>
            <Link
              to="/apply"
              className="mt-8 inline-flex h-10 items-center rounded-md bg-foreground py-2 pl-4 pr-3 text-sm font-medium text-background"
            >
              Apply to the network
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 md:grid-cols-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Engineers</h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link to="/network" className="hover:text-foreground">Find work</Link></li>
                <li><Link to="/help-center" className="hover:text-foreground">Help center</Link></li>
                <li><Link to="/resources" className="hover:text-foreground">Resources</Link></li>
                <li><Link to="/stories" className="hover:text-foreground">Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Network</h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link to="/network" className="hover:text-foreground">Browse talent</Link></li>
                <li><a href="/#process" className="hover:text-foreground">How it works</a></li>
                <li><Link to="/apply" className="hover:text-foreground">Apply</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Business</h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link to="/hire" className="hover:text-foreground">Hire talent</Link></li>
                <li><Link to="/enterprise" className="hover:text-foreground">Enterprise</Link></li>
                <li><Link to="/data-partnerships" className="hover:text-foreground">Data partnerships</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Contact</h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><a href="mailto:care@aveiq.app" className="hover:text-foreground">Support</a></li>
                <li><a href="mailto:care@aveiq.app" className="hover:text-foreground">Press</a></li>
                <li><a href="mailto:care@aveiq.app" className="hover:text-foreground">Sales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Aveiq</h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link to="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link to="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>© 2026 Aveiq</span>
              <span className="text-muted-foreground/70">Bengaluru, India</span>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
            </div>
            <div className="flex items-center gap-5">
              <a href="https://x.com/aveiq" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="text-muted-foreground hover:text-foreground">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zM17.083 19.77h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/aveiq" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="size-4" />
              </a>
              <a href="https://www.instagram.com/aveiq" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                <Instagram className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground/70">{label}</dt>
      <dd className="mt-2 text-3xl font-medium tabular-nums tracking-tight">
        {loading ? "—" : (value ?? 0)}
      </dd>
    </div>
  );
}
