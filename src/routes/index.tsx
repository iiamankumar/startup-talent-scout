import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, FileText, Github, Twitter, Linkedin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avyra — India's top 0.1% engineers, hired in 72 hours" },
      {
        name: "description",
        content:
          "Avyra is a hand-curated talent network. We manually vet India's top AI and full-stack engineers so startups can hire world-class talent in 72 hours.",
      },
      { property: "og:title", content: "Avyra — Elite engineers, hired in 72h" },
      {
        property: "og:description",
        content: "Hand-vetted AI and full-stack engineers from India. No resume spam.",
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

type Engineer = {
  initials: string;
  name: string;
  role: string;
  tags: string[];
  status: "AVAILABLE" | "ON INTERVIEW";
  metricLabel: string;
  metricValue: string;
  metricAccent?: boolean;
};

const engineers: Engineer[] = [
  {
    initials: "IM",
    name: "Ishaan M.",
    role: "Full-stack Engineer · Ex-Razorpay",
    tags: ["Next.js", "PyTorch", "Rust"],
    status: "AVAILABLE",
    metricLabel: "GitHub Activity",
    metricValue: "Top 1% in India",
  },
  {
    initials: "PS",
    name: "Priya S.",
    role: "AI Research · GSoC 2023",
    tags: ["LLMs", "LangChain", "Python"],
    status: "ON INTERVIEW",
    metricLabel: "Avyra Score",
    metricValue: "98 / 100",
    metricAccent: true,
  },
  {
    initials: "KR",
    name: "Karthik R.",
    role: "Systems Engineer · Hackathon Lead",
    tags: ["C++", "Go", "Postgres"],
    status: "AVAILABLE",
    metricLabel: "Commits (YTD)",
    metricValue: "1,284",
  },
  {
    initials: "AN",
    name: "Aanya N.",
    role: "Frontend Engineer · Open Source",
    tags: ["React", "Three.js", "TypeScript"],
    status: "AVAILABLE",
    metricLabel: "OSS Stars",
    metricValue: "4.2k",
  },
  {
    initials: "RV",
    name: "Rohan V.",
    role: "ML Engineer · IIT Bombay",
    tags: ["PyTorch", "CUDA", "Triton"],
    status: "ON INTERVIEW",
    metricLabel: "Avyra Score",
    metricValue: "96 / 100",
    metricAccent: true,
  },
  {
    initials: "DS",
    name: "Devika S.",
    role: "Infra Engineer · Ex-Swiggy",
    tags: ["Kubernetes", "Go", "AWS"],
    status: "AVAILABLE",
    metricLabel: "Years Shipping",
    metricValue: "6+",
  },
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-secondary">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-5 rounded-sm bg-foreground" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">AVYRA</span>
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
          <div className="max-w-[40ch]">
            <h1 className="text-balance text-5xl font-medium leading-tight tracking-tight lg:text-7xl">
              The talent engine for India's{" "}
              <span className="font-serif italic">cracked</span> engineers.
            </h1>
          </div>

          <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-[56ch] text-pretty text-lg text-muted-foreground lg:text-xl">
              We manually vet the top 0.1% of Indian developer talent. No resume spam. No
              ghosting. Just world-class engineers deployed to your startup in 72 hours.
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

          <div className="mt-20 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-border pt-8 text-xs uppercase tracking-widest text-muted-foreground/70">
            <span>Trusted by founders at</span>
            <span className="font-semibold tracking-wider text-foreground/70">YC W24</span>
            <span className="font-semibold tracking-wider text-foreground/70">SEQUOIA SURGE</span>
            <span className="font-semibold tracking-wider text-foreground/70">ACCEL ATOMS</span>
            <span className="font-semibold tracking-wider text-foreground/70">PEAK XV</span>
            <span className="font-semibold tracking-wider text-foreground/70">SOUTH PARK</span>
          </div>
        </div>
      </section>

      <section id="network" className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Featured Engineers
            </h2>
            <Link to="/network" className="text-sm text-muted-foreground/80 hover:text-foreground">
              See full network →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {engineers.map((e) => (
              <article
                key={e.name}
                className="group relative rounded-xl bg-card p-6 ring-1 ring-black/5 transition-all hover:ring-black/10"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-semibold text-foreground outline outline-1 -outline-offset-1 outline-black/5">
                    {e.initials}
                  </div>
                  <div className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-black/5">
                    {e.status}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-semibold">{e.name}</h3>
                  <p className="text-sm text-muted-foreground">{e.role}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-black/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-8 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/70">{e.metricLabel}</span>
                    <span
                      className={
                        e.metricAccent
                          ? "font-medium text-success"
                          : "font-medium text-foreground"
                      }
                    >
                      {e.metricValue}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
                  t: "Source globally, hire locally",
                  d: "We scan open-source contributions, hackathon results, and competitive programming rankings to find invisible talent.",
                },
                {
                  n: "02",
                  t: "Technical proof of work",
                  d: "Every candidate completes a rigorous live interview with a senior engineer. No automated MCQs. Real code, real signal.",
                },
                {
                  n: "03",
                  t: "Handpicked matching",
                  d: "Get a curated shortlist of 3–5 candidates who match your stack, stage, and culture — within 72 hours.",
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

      <section className="bg-foreground py-24 text-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-[44ch]">
            <p className="text-2xl font-medium leading-snug text-pretty lg:text-3xl">
              <span className="font-serif italic text-background/60">"</span>
              Avyra helped us scale engineering from 2 to 12 in under a month. Quality was
              consistently better than any agency we've used.
              <span className="font-serif italic text-background/60">"</span>
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="grid size-10 place-items-center rounded-full bg-white/10 text-xs font-semibold text-background outline outline-1 -outline-offset-1 outline-white/10">
                AV
              </div>
              <div>
                <p className="text-sm font-semibold">Akash Verma</p>
                <p className="text-xs text-background/60">Founder, TensorIndia (YC W24)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hire" className="border-t border-border py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-10 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              For Founders
            </p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">
              Get a shortlist in 72 hours.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Tell us your stack and stage. We'll handpick 3–5 cracked engineers ready to ship from
              day one.
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
              For Engineers
            </p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">
              Get matched with elite startups.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              One interview. Lifetime access to YC, Sequoia Surge, and top-tier Indian founders
              looking for cracked talent.
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

      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded-sm bg-foreground" />
            <span className="text-xs font-semibold tracking-tight">AVYRA NETWORK</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
              <Twitter className="size-4" />
            </a>
            <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
              <Github className="size-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="size-4" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground/70">
            © 2026 Avyra. Built for the top 0.1%.
          </p>
        </div>
      </footer>
    </main>
  );
}
