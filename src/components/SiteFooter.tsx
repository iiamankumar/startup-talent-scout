import { Link } from "@tanstack/react-router";
import { AveiqLogo } from "@/components/AveiqLogo";
import { Linkedin, Twitter, Instagram } from "lucide-react";

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
        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label="LinkedIn"
            title="Open LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label="X (Twitter)"
            title="Open X (Twitter)"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label="Instagram"
            title="Open Instagram"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
