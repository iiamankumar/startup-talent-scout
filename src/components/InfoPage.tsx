import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { AveiqLogo } from "@/components/AveiqLogo";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <AveiqLogo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/network" className="text-muted-foreground hover:text-foreground">
            Network
          </Link>
          <Link to="/hire" className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
            Hire Talent
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight lg:text-5xl">{title}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>

        <div className="mt-20 border-t border-border pt-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to Aveiq
          </Link>
        </div>
      </section>
    </main>
  );
}

export function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 text-muted-foreground">{children}</div>
    </div>
  );
}
