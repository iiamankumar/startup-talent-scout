import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Klyro" },
      { name: "description", content: "How Klyro protects engineer and founder data — infrastructure, access controls, and disclosure policy." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Security at Klyro"
      intro="Engineers trust us with their resumes, GitHub history, and salary expectations. Founders trust us with hiring plans and budgets. We take that seriously."
    >
      <InfoBlock title="Infrastructure">
        Klyro runs on managed cloud infrastructure with encryption in transit (TLS 1.2+) and at
        rest. Database access is restricted to a small set of engineers and is audit-logged.
      </InfoBlock>
      <InfoBlock title="Authentication & access">
        All access to user data is authenticated and protected by row-level security — engineers
        only see their own data, founders only see applications to their own briefs, and admins
        only access what is required for review.
      </InfoBlock>
      <InfoBlock title="Data handling">
        Resumes and personal data are stored only as long as needed for the platform's function.
        You can request deletion of your account and all associated data at any time.
      </InfoBlock>
      <InfoBlock title="Responsible disclosure">
        Found a vulnerability? Email{" "}
        <a className="underline" href="mailto:security@klyro.dev">security@klyro.dev</a>. We
        respond within 48 hours and credit researchers who report in good faith.
      </InfoBlock>
    </InfoPage>
  );
}
