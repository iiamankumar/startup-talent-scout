import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/data-partnerships")({
  head: () => ({
    meta: [
      { title: "Data Partnerships — Aveiq" },
      { name: "description", content: "Partner with Aveiq on hiring data, salary benchmarks, and labor-market research for Indian engineering talent." },
    ],
  }),
  component: DataPartnershipsPage,
});

function DataPartnershipsPage() {
  return (
    <InfoPage
      eyebrow="For researchers & platforms"
      title="Data Partnerships"
      intro="Aveiq has one of the cleanest datasets on Indian AI engineering talent — vetted, structured, and consent-based."
    >
      <InfoBlock title="What we share">
        <ul className="list-disc space-y-2 pl-5">
          <li>Anonymized skill and seniority distributions</li>
          <li>Salary and rate benchmarks by city and stack</li>
          <li>Hiring funnel benchmarks (application → offer → accept)</li>
          <li>Trends in AI/ML hiring demand</li>
        </ul>
      </InfoBlock>
      <InfoBlock title="How it works">
        Every engineer on Aveiq has consented to anonymized aggregate sharing. We never share
        identifying data without a separate explicit opt-in.
      </InfoBlock>
      <InfoBlock title="Get in touch">
        Email <a className="underline" href="mailto:care@aveiq.app">care@aveiq.app</a> with what
        you're researching and we'll get back within two business days.
      </InfoBlock>
    </InfoPage>
  );
}
