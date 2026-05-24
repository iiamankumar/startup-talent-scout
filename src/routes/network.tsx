import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Github, Linkedin, Globe } from "lucide-react";
import { listVettedEngineers } from "@/lib/engineers.functions";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "The Avyra Network — Vetted engineers" },
      {
        name: "description",
        content:
          "Browse Avyra's curated network of hand-vetted, available engineers — the top 0.1% of Indian developer talent.",
      },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  const fn = useServerFn(listVettedEngineers);
  const { data, isLoading } = useQuery({
    queryKey: ["vettedEngineers"],
    queryFn: () => fn(),
  });

  const engineers = data?.engineers ?? [];

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-5 rounded-sm bg-foreground" />
          <span className="text-sm font-semibold tracking-tight">AVYRA</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/hire"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Hire talent
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight lg:text-5xl">The Avyra Network</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Hand-vetted engineers available right now. Every profile passed a live technical
            interview with a senior engineer.
          </p>
        </div>

        <div className="mt-12 flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {isLoading ? "Loading network…" : `${engineers.length} engineers available`}
          </h2>
          <Link
            to="/apply"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Apply to the network →
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <div className="mt-16 rounded-2xl bg-surface p-12 text-center">
            <p className="text-lg font-medium">The network is being curated.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We're handpicking the first cohort. Be the first to apply.
            </p>
            <Link
              to="/apply"
              className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Apply to the network
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {engineers.map((e) => (
              <article
                key={e.user_id}
                className="rounded-xl bg-card p-6 ring-1 ring-black/5 transition-all hover:ring-black/10"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-semibold">
                    {(e.display_name ?? "AV")
                      .split(" ")
                      .map((s: string) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-black/5">
                    Available
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-semibold">{e.display_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {e.headline ?? (e.location ?? "Engineer")}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(e.skills ?? []).slice(0, 5).map((s: string) => (
                    <span
                      key={s}
                      className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-black/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {e.github_url && (
                      <a href={e.github_url} target="_blank" rel="noreferrer">
                        <Github className="size-4 hover:text-foreground" />
                      </a>
                    )}
                    {e.linkedin_url && (
                      <a href={e.linkedin_url} target="_blank" rel="noreferrer">
                        <Linkedin className="size-4 hover:text-foreground" />
                      </a>
                    )}
                    {e.website_url && (
                      <a href={e.website_url} target="_blank" rel="noreferrer">
                        <Globe className="size-4 hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  {e.avyra_score != null && (
                    <span className="text-xs">
                      <span className="text-muted-foreground/70">Avyra Score · </span>
                      <span className="font-medium text-foreground">{e.avyra_score}</span>
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
