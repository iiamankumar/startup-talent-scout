import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOpenRequestsPublic } from "@/lib/hire.functions";
import { AveiqLogo } from "@/components/AveiqLogo";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/open-roles")({
  head: () => ({
    meta: [
      { title: "Open roles — Aveiq" },
      { name: "description", content: "Browse open AI engineering roles from Aveiq founders. Apply in minutes." },
    ],
  }),
  component: OpenRolesPage,
});

function OpenRolesPage() {
  const { user, roles } = useAuth();
  const fn = useServerFn(listOpenRequestsPublic);
  const { data, isLoading } = useQuery({ queryKey: ["openRolesPublic"], queryFn: () => fn() });
  const isEngineer = roles.includes("engineer");
  const requests = data?.requests ?? [];

  useRealtimeInvalidate([
    { table: "hire_requests", invalidate: [["openRolesPublic"]] },
  ]);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <AveiqLogo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <Link to="/dashboard" className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
              <Link
                to="/signup"
                search={{ intent: "engineer", redirect: "/apply" }}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Apply to network
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight lg:text-5xl">Open roles</h1>
          <p className="mt-3 text-muted-foreground">
            Hand-curated briefs from Aveiq founders. Sign up as an engineer to apply.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading roles…</p>}
          {!isLoading && requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No open roles right now. Check back soon.</p>
          )}
          {requests.map((r) => {
            const company = r.companies as { name?: string; stage?: string } | null;
            // Logged-in engineers go to the full job page; everyone else goes to signup.
            const card = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{r.role_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {company?.name ?? "Stealth"}
                      {company?.stage ? ` · ${company.stage}` : ""}
                    </p>
                  </div>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    {r.urgency ?? "flex"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(r.stack ?? []).slice(0, 6).map((s: string) => (
                    <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {r.budget_monthly_usd
                      ? `₹${r.budget_monthly_usd.toLocaleString("en-IN")}/mo`
                      : "Budget on request"}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {user && isEngineer ? "View role →" : "Sign in to apply →"}
                  </span>
                </div>
              </>
            );

            const className =
              "group block rounded-2xl bg-card p-6 ring-1 ring-black/5 transition hover:ring-foreground/20";

            if (user && isEngineer) {
              return (
                <Link key={r.id} to="/jobs/$jobId" params={{ jobId: r.id }} className={className}>
                  {card}
                </Link>
              );
            }
            return (
              <Link
                key={r.id}
                to="/signup"
                search={{ intent: "engineer", redirect: `/jobs/${r.id}` }}
                className={className}
              >
                {card}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
