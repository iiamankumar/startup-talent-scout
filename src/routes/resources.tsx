import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Aveiq" },
      { name: "description", content: "Guides, templates, and playbooks for engineers and founders." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <InfoPage
      eyebrow="Library"
      title="Resources"
      intro="Practical guides we've written for the people we work with — engineers building their craft and founders building their first technical team."
    >
      <InfoBlock title="For engineers">
        <ul className="list-disc space-y-2 pl-5">
          <li>Building a GitHub that actually impresses reviewers</li>
          <li>How to write a project README a hiring manager will read</li>
          <li>Negotiating your first remote role with a US startup</li>
          <li>What we look for in a Aveiq Score interview</li>
        </ul>
      </InfoBlock>
      <InfoBlock title="For founders">
        <ul className="list-disc space-y-2 pl-5">
          <li>Writing a job brief that gets the right applications</li>
          <li>Structuring a 60-minute technical interview</li>
          <li>Setting compensation bands for engineers in India</li>
          <li>The first 90 days with a remote engineer</li>
        </ul>
      </InfoBlock>
      <InfoBlock title="Templates">
        <p>
          Free templates: job brief, offer letter, technical take-home, weekly 1:1 doc. Email{" "}
          <a className="underline" href="mailto:care@aveiq.app">care@aveiq.app</a> and we'll send
          the bundle.
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
