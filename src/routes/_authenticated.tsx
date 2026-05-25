import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AveiqLogo } from "@/components/AveiqLogo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/network", label: "Network" },
  { to: "/hire", label: "Hire" },
  { to: "/apply", label: "Apply" },
] as const;

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <AveiqLogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => signOut()}
              className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Sign out
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="mt-1 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
