import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { AuthShell, Field, Divider, GoogleIcon } from "@/components/AuthShell";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
    intent:
      search.intent === "engineer" || search.intent === "founder"
        ? (search.intent as "engineer" | "founder")
        : undefined,
  }),
  component: SignupPage,
});

function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/dashboard";
  return target;
}

function SignupPage() {
  const navigate = useNavigate();
  const { redirect, intent: intentParam } = Route.useSearch();
  const defaultIntent: "engineer" | "founder" =
    intentParam ?? (redirect?.startsWith("/apply") || redirect?.startsWith("/jobs") ? "engineer" : "founder");
  const target = safeRedirect(redirect ?? (defaultIntent === "engineer" ? "/apply" : "/hire"));
  const { user, loading } = useAuth();
  const [intent, setIntent] = useState<"engineer" | "founder">(defaultIntent);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: target });
  }, [loading, user, navigate, target]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Enter your full name");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + target,
        data: { full_name: fullName.trim(), intent },
      },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Welcome to Aveiq.");
    navigate({ to: target });
  };

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + target,
    });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
  };

  return (
    <AuthShell title="Join Aveiq" subtitle="Hire elite talent or get matched with elite startups.">
      <button
        onClick={handleGoogle}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium hover:bg-secondary"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <Divider />

      <form onSubmit={handleEmail} className="space-y-3">
        <Field label="Full name">
          <input
            required
            minLength={2}
            maxLength={80}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-md bg-foreground text-sm font-medium text-background disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect: target }} className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
