import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { getMyEngineerProfile } from "@/lib/engineers.functions";
import { listMyHireRequests, listOpenRequestsForEngineers } from "@/lib/hire.functions";
import { peekMyReferrals } from "@/lib/referrals.functions";
import { ArrowRight, Briefcase, Copy, Gift, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aveiq" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const getProfile = useServerFn(getMyEngineerProfile);
  const getMyRequests = useServerFn(listMyHireRequests);
  const getOpen = useServerFn(listOpenRequestsForEngineers);
  const getRefs = useServerFn(peekMyReferrals);

  const profileQ = useQuery({
    queryKey: ["myEngineer", user?.id],
    queryFn: () => getProfile(),
  });
  const requestsQ = useQuery({
    queryKey: ["myHireRequests", user?.id],
    queryFn: () => getMyRequests(),
  });
  const referralsQ = useQuery({
    queryKey: ["myReferrals", user?.id],
    queryFn: () => getRefs(),
  });

  // Decide which dashboard to show based on actual activity (not just role).
  const hasEngineerProfile = !!profileQ.data?.engineer;
  const hasHireRequests = (requestsQ.data?.requests?.length ?? 0) > 0;
  const roleEngineer = roles.includes("engineer");
  const roleFounder = roles.includes("founder");

  // Show founder dashboard if they've hired or are tagged founder (and not engineer).
  const showFounderPanel = hasHireRequests || (roleFounder && !roleEngineer && !hasEngineerProfile);
  // Show engineer dashboard if they've applied, are tagged engineer, or neither path yet.
  const showEngineerPanel = hasEngineerProfile || roleEngineer || (!showFounderPanel);

  const openQ = useQuery({
    queryKey: ["openRequests"],
    queryFn: () => getOpen(),
    enabled: showEngineerPanel,
  });

  const referralCode = referralsQ.data?.code ?? "";
  const referralLink =
    typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/signup?ref=${referralCode}`
      : "";
  const referralCount = referralsQ.data?.referrals?.length ?? 0;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-medium tracking-tight">
        Welcome back, {user?.user_metadata?.full_name ?? user?.email}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {showFounderPanel && !showEngineerPanel
          ? "Post a brief and we'll match you with cracked engineers."
          : showEngineerPanel && !showFounderPanel
            ? "Manage your profile and browse open roles."
            : "Apply as an engineer or post a hire request — both work from this account."}
      </p>

      {isAdmin && (
        <Link
          to="/admin"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <ShieldCheck className="size-4" /> Open admin console
        </Link>
      )}

      <div className={`mt-10 grid gap-6 ${showFounderPanel && showEngineerPanel ? "md:grid-cols-2" : showFounderPanel ? "md:grid-cols-2" : ""}`}>
        {/* Engineer profile card */}
        {showEngineerPanel && (
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
        )}

        {/* Founder hire requests */}
        {showFounderPanel && (
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
              {requestsQ.data.requests.map((r) => {
                const company = r.companies as { name?: string; logo_url?: string | null } | null;
                const name = company?.name ?? "—";
                const initial = (name?.[0] ?? "?").toUpperCase();
                return (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {company?.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={name}
                          className="size-9 rounded-md object-cover ring-1 ring-black/5"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground ring-1 ring-black/5">
                          {initial}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{r.role_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {name} · {r.stack.slice(0, 3).join(", ")}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/requests/$requestId"
                      params={{ requestId: r.id }}
                      className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-black/5 hover:bg-foreground hover:text-background"
                    >
                      {r.status} · view
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No hire requests yet. Post one and get a curated shortlist in 72 hours.
            </p>
          )}
        </section>
        )}

        {/* Referral card — shown to everyone */}
        <section className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Gift className="size-4" /> Refer & earn
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Share your link or code. When someone signs up using it, you get credit toward a
            referral reward.
          </p>
          {referralsQ.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !referralCode ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                You haven't generated your referral link yet. Create a unique link tied to your
                account in seconds.
              </p>
              <Link
                to="/refer"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
              >
                <Sparkles className="size-4" />
                Generate your referral link
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Your code
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-background px-3 py-2 text-sm font-mono ring-1 ring-black/5">
                    {referralCode}
                  </code>
                  <button
                    onClick={() => copy(referralCode, "Code")}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-secondary"
                    aria-label="Copy code"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Invite link
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-background px-3 py-2 text-xs ring-1 ring-black/5">
                    {referralLink || "—"}
                  </code>
                  <button
                    onClick={() => copy(referralLink, "Link")}
                    disabled={!referralLink}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-secondary disabled:opacity-50"
                    aria-label="Copy link"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {referralCount === 0
                    ? "No referrals yet."
                    : `${referralCount} referral${referralCount === 1 ? "" : "s"} so far.`}
                </p>
                <Link to="/refer" className="text-xs font-medium underline">
                  Manage
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Engineer-only: open roles feed */}
      {showEngineerPanel && (
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
                <li key={r.id}>
                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: r.id }}
                    className="group block rounded-xl bg-background p-5 ring-1 ring-black/5 transition hover:ring-foreground/30"
                  >
                    <p className="text-sm font-semibold group-hover:underline">{r.role_title}</p>
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
                      {r.budget_monthly_usd && (
                        <span>₹{r.budget_monthly_usd.toLocaleString("en-IN")}/mo</span>
                      )}
                    </div>
                    <div className="mt-3 text-xs font-medium text-foreground">View role →</div>
                  </Link>
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
