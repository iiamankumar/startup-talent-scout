import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { getMyEngineerProfile } from "@/lib/engineers.functions";
import { listMyHireRequests, listOpenRequestsForEngineers } from "@/lib/hire.functions";
import { ArrowRight, Briefcase, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Avyra" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, roles } = useAuth();
  const isEngineer = roles.includes("engineer");

  const getProfile = useServerFn(getMyEngineerProfile);
  const getMyRequests = useServerFn(listMyHireRequests);
  const getOpen = useServerFn(listOpenRequestsForEngineers);

  const profileQ = useQuery({
    queryKey: ["myEngineer", user?.id],
    queryFn: () => getProfile(),
  });
  const requestsQ = useQuery({
    queryKey: ["myHireRequests", user?.id],
    queryFn: () => getMyRequests(),
  });
  const openQ = useQuery({
    queryKey: ["openRequests"],
    queryFn: () => getOpen(),
    enabled: isEngineer,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-medium tracking-tight">
        Welcome back, {user?.user_metadata?.full_name ?? user?.email}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEngineer
          ? "Manage your profile and browse open roles."
          : "Post a brief and we'll match you with cracked engineers."}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Engineer profile card */}
        <section className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <UserCircle2 className="size-4" /> Engineer profile
          </div>
          {profileQ.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : profileQ.data?.engineer ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-lg font-medium">{profileQ.data.engineer.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {profileQ.data.engineer.headline ?? "Add a headline"}
                </p>
              </div>
              <div className="inline-flex rounded-full bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ring-1 ring-black/5">
                {profileQ.data.engineer.vetting === "vetted"
                  ? "Vetted · Live on network"
                  : profileQ.data.engineer.vetting === "in_review"
                    ? "In review"
                    : "Pending review"}
              </div>
              <Link
                to="/apply"
                className="mt-4 inline-flex items-center text-sm font-medium text-foreground underline"
              >
                Edit profile <ArrowRight className="ml-1 size-3" />
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                You haven't created an engineer profile yet. Apply to the network and get matched
                with elite startups.
              </p>
              <Link
                to="/apply"
                className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                Apply to the network <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Founder hire requests */}
        <section className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Briefcase className="size-4" /> Your hire requests
            </div>
            <Link
              to="/hire"
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              New request
            </Link>
          </div>
          {requestsQ.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : requestsQ.data && requestsQ.data.requests.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {requestsQ.data.requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{r.role_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(r.companies as { name: string } | null)?.name ?? "—"} ·{" "}
                      {r.stack.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-black/5">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No hire requests yet. Post one and get a curated shortlist in 72 hours.
            </p>
          )}
        </section>
      </div>

      {/* Engineer-only: open roles feed */}
      {isEngineer && (
        <section className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Open roles for you
            </h2>
            <span className="text-xs text-muted-foreground/70">
              {openQ.data?.requests.length ?? 0} live
            </span>
          </div>
          {openQ.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : openQ.data && openQ.data.requests.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openQ.data.requests.map((r) => (
                <li key={r.id} className="rounded-xl bg-background p-5 ring-1 ring-black/5">
                  <p className="text-sm font-semibold">{r.role_title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(r.companies as { name?: string; stage?: string } | null)?.name ?? "Stealth"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {r.stack.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Urgency: {r.urgency}</span>
                    {r.budget_monthly_usd && <span>${r.budget_monthly_usd.toLocaleString()}/mo</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No open roles right now. Check back soon.</p>
          )}
        </section>
      )}
    </main>
  );
}
