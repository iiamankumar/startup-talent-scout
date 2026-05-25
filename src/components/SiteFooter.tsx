import { Link } from "@tanstack/react-router";
import { AveiqLogo } from "@/components/AveiqLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AveiqLogo />
          <span className="text-xs">© {new Date().getFullYear()} Aveiq</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <Link to="/network" className="hover:text-foreground">Network</Link>
          <Link to="/signup" search={{ intent: "founder", redirect: "/hire" }} className="hover:text-foreground">Hire</Link>
          <Link to="/open-roles" className="hover:text-foreground">Apply</Link>
          <Link to="/help-center" className="hover:text-foreground">Help</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/security" className="hover:text-foreground">Security</Link>
        </nav>
      </div>
    </footer>
  );
}
