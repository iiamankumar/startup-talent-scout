import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Aveiq" },
      { name: "description", content: "Open roles at Aveiq. We're a small team building the talent engine for India's best engineers." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <InfoPage
      eyebrow="Join Aveiq"
      title="Careers"
      intro="We're a small, opinionated team building the talent engine for India's best engineers. We hire people who care about craft, write clearly, and ship."
    >
      <InfoBlock title="Open roles">
        <ul className="list-disc space-y-2 pl-5">
          <li>Founding Engineer — AI (Bengaluru / Remote)</li>
          <li>Talent Reviewer — Engineering (Remote)</li>
          <li>Growth Lead — B2B (Bengaluru)</li>
        </ul>
      </InfoBlock>
      <InfoBlock title="How we work">
        Async-first, written communication, small team (under 15), no meetings without an agenda,
        and a strong bias toward shipping. Equity for every hire.
      </InfoBlock>
      <InfoBlock title="Apply">
        Send a short note about you and a link or two that shows your work to{" "}
        <a className="underline" href="mailto:care@aveiq.app">care@aveiq.app</a>. No cover
        letters, please.
      </InfoBlock>
    </InfoPage>
  );
}
