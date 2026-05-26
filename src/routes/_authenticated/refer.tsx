import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Gift, Mail, Share2, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyReferrals, peekMyReferrals } from "@/lib/referrals.functions";

export const Route = createFileRoute("/_authenticated/refer")({
  head: () => ({ meta: [{ title: "Refer & earn — Aveiq" }] }),
  component: ReferPage,
});

function ReferPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const getRefs = useServerFn(getMyReferrals);
  const peek = useServerFn(peekMyReferrals);

  // Track whether the user has explicitly "generated" their link (or already had one).
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  // Auto-detect existing code so returning users skip the generate step.
  const peekQ = useQuery({
    queryKey: ["peekReferrals", user?.id],
    queryFn: () => peek(),
  });
  useEffect(() => {
    if (peekQ.data?.code) setGenerated(true);
  }, [peekQ.data?.code]);

  const q = useQuery({
    queryKey: ["myReferrals", user?.id],
    queryFn: () => getRefs(),
    enabled: generated, // Only fetch/create when generated
    initialData: peekQ.data?.code ? { code: peekQ.data.code, referrals: peekQ.data.referrals } : undefined,
  });

  const code = q.data?.code ?? "";
  const referrals = q.data?.referrals ?? [];
  const link =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/signup?ref=${code}`
      : "";

  const totalEarned = referrals
    .filter((r) => r.reward_status === "paid")
    .reduce((s, r) => s + (r.reward_amount_usd ?? 0), 0);
  const pendingEarned = referrals
    .filter((r) => r.reward_status === "pending")
    .reduce((s, r) => s + (r.reward_amount_usd ?? 0), 0);

  const generate = async () => {
    setGenerating(true);
    try {
      await qc.fetchQuery({ queryKey: ["myReferrals", user?.id], queryFn: () => getRefs() });
      setGenerated(true);
      toast.success("Referral link generated");
    } catch {
      toast.error("Couldn't generate link");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (text: string, kind: "code" | "link") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(`${kind === "code" ? "Code" : "Link"} copied`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Gift className="size-4" />
        Referrals
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Refer engineers. Earn rewards.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Share your link with engineers you'd vouch for. When they get vetted and complete their
        first engagement, you both get paid.
      </p>

      {!generated ? (
        <section className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 p-8 text-background sm:p-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-background/10 ring-1 ring-background/20">
              <Sparkles className="size-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Generate your referral link</h2>
            <p className="mt-2 text-sm text-background/70">
              Create a one-of-a-kind link tied to your account. Anyone who signs up through it is
              credited to you forever.
            </p>
            <button
              onClick={generate}
              disabled={generating}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-background px-6 text-sm font-semibold text-foreground hover:bg-background/90 disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {generating ? "Generating…" : "Generate referral link"}
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Stats */}
          <section className="mt-10 grid gap-4 sm:grid-cols-3">
            <Stat icon={Users} label="Signups via your link" value={referrals.length.toString()} />
            <Stat icon={Gift} label="Pending rewards" value={`$${pendingEarned}`} />
            <Stat icon={Check} label="Paid out" value={`$${totalEarned}`} accent />
          </section>

          {/* Link + Code */}
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Card title="Your referral link" icon={Share2}>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-background px-3 py-2.5 font-mono text-xs ring-1 ring-border">
                  {link || "—"}
                </code>
                <button
                  onClick={() => copy(link, "link")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
                >
                  {copied === "link" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied === "link" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:?subject=${encodeURIComponent("Join me on Aveiq")}&body=${encodeURIComponent(`I think you'd be a fit for the Aveiq talent network — sign up with my link: ${link}`)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary"
                >
                  <Mail className="size-3.5" />
                  Share via email
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Aveiq — the engineering talent network I'm part of: ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary"
                >
                  <Share2 className="size-3.5" />
                  Share on X
                </a>
              </div>
            </Card>

            <Card title="Your referral code" icon={Gift}>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-background px-3 py-2.5 text-center font-mono text-lg tracking-[0.2em] ring-1 ring-border">
                  {code || "—"}
                </code>
                <button
                  onClick={() => copy(code, "code")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary"
                >
                  {copied === "code" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied === "code" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Use the code at signup if a friend can't open the link.
              </p>
            </Card>
          </section>

          {/* How it works */}
          <section className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              How it works
            </h3>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              <Step n={1} title="Share your link">
                Send your unique link to engineers you'd vouch for.
              </Step>
              <Step n={2} title="They get vetted">
                They sign up and complete the Aveiq vetting flow.
              </Step>
              <Step n={3} title="You both earn">
                When they land their first engagement, you both get paid.
              </Step>
            </ol>
          </section>

          {/* Referral list */}
          <section className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Your referrals
              </h3>
              <span className="text-xs text-muted-foreground">{referrals.length} total</span>
            </div>
            {referrals.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No referrals yet. Share your link to get started.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {referrals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Referred user</p>
                      <p className="text-xs text-muted-foreground">
                        Code {r.referral_code} ·{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.status === "converted" ? "green" : "amber"}>
                        {r.status}
                      </Badge>
                      <Badge tone={r.reward_status === "paid" ? "green" : "muted"}>
                        {r.reward_status === "paid"
                          ? `$${r.reward_amount_usd} paid`
                          : r.reward_status === "pending"
                            ? `$${r.reward_amount_usd} pending`
                            : "no reward yet"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ${accent ? "bg-foreground text-background ring-foreground" : "bg-card ring-black/5"}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${accent ? "text-background/70" : "text-muted-foreground"}`} />
        <span className={`text-xs uppercase tracking-widest ${accent ? "text-background/70" : "text-muted-foreground"}`}>
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" /> {title}
      </div>
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background p-5 ring-1 ring-border">
      <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
        {n}
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "muted" }) {
  const styles =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-secondary text-muted-foreground ring-border";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${styles}`}>
      {children}
    </span>
  );
}
