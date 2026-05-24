import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise — Klyro" },
      { name: "description", content: "Build entire engineering pods with Klyro — dedicated sourcing, vetting, and account management for larger teams." },
    ],
  }),
  component: EnterprisePage,
});

function EnterprisePage() {
  return (
    <InfoPage
      eyebrow="For larger teams"
      title="Enterprise"
      intro="When you need to hire 5+ engineers, or you want a dedicated talent partner for the year, we set up a custom pipeline."
    >
      <InfoBlock title="What you get">
        <ul className="list-disc space-y-2 pl-5">
          <li>Dedicated account manager who learns your stack and culture</li>
          <li>Custom inbound pipeline with weekly shortlists</li>
          <li>Pre-negotiated rate cards and replacement guarantees</li>
          <li>SLA-backed turnaround on every brief</li>
        </ul>
      </InfoBlock>
      <InfoBlock title="Who it's for">
        Series A through Series C startups, AI labs, and engineering-led product companies hiring
        more than 5 engineers a year.
      </InfoBlock>
      <InfoBlock title="Talk to us">
        Email <a className="underline" href="mailto:enterprise@klyro.dev">enterprise@klyro.dev</a>{" "}
        with a sentence about your team and what you're hiring for, or post a brief and mention
        "Enterprise" in the notes.
      </InfoBlock>
      <div>
        <Link to="/hire" className="inline-flex rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          Post a brief
        </Link>
      </div>
    </InfoPage>
  );
}
