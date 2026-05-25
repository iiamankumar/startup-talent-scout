import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/help-center")({
  head: () => ({
    meta: [
      { title: "Help Center — Aveiq" },
      { name: "description", content: "Answers to common questions for engineers and founders using Aveiq." },
    ],
  }),
  component: HelpCenterPage,
});

function HelpCenterPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Help Center"
      intro="Quick answers to the questions we hear most often from engineers and founders."
    >
      <InfoBlock title="How does vetting work?">
        Every engineer who applies to Aveiq is reviewed manually. We look at GitHub activity, real
        project work, and have a short conversation before assigning a Aveiq Score. Nothing is
        automated and nothing is scraped.
      </InfoBlock>
      <InfoBlock title="How long does the review take?">
        Most applications get a first decision within 5–7 business days. If we need a longer
        conversation, we'll tell you upfront.
      </InfoBlock>
      <InfoBlock title="Is Aveiq free for engineers?">
        Yes. Applying to the network and applying to roles is always free for engineers. We charge
        founders a flat placement fee when they hire someone through the platform.
      </InfoBlock>
      <InfoBlock title="What kind of roles are on Aveiq?">
        Mostly full-time and long-term contract roles at funded startups, focused on AI/ML and
        AI engineering. We don't list low-effort gig work.
      </InfoBlock>
      <InfoBlock title="I still have a question">
        Email <a className="underline" href="mailto:hello@aveiq.com">hello@aveiq.com</a> and a real
        human will reply, usually within one business day.
      </InfoBlock>
      <div className="rounded-xl bg-surface p-6 ring-1 ring-black/5">
        <p className="text-sm text-muted-foreground">Ready to get started?</p>
        <div className="mt-3 flex gap-3">
          <Link to="/apply" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            Apply as engineer
          </Link>
          <Link to="/hire" className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5">
            Post a role
          </Link>
        </div>
      </div>
    </InfoPage>
  );
}
