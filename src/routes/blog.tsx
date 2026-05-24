import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Klyro" },
      { name: "description", content: "Writing from the Klyro team on hiring, vetting, and building engineering teams in India." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <InfoPage
      eyebrow="Writing"
      title="Blog"
      intro="Thoughts from the Klyro team on hiring engineers, vetting talent, and building remote teams across India."
    >
      <InfoBlock title="Why we hand-vet every engineer">
        Why we refuse to run an algorithmic marketplace, and what manual review actually costs us.
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground/70">Coming soon</p>
      </InfoBlock>
      <InfoBlock title="The honest truth about the Indian engineering market">
        Salary bands, supply curves, and what we see in our review queue every week.
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground/70">Coming soon</p>
      </InfoBlock>
      <InfoBlock title="What a great founder brief actually looks like">
        We've reviewed hundreds. Here's the structure of the ones that get the best applications.
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground/70">Coming soon</p>
      </InfoBlock>
      <p className="text-sm text-muted-foreground">
        Subscribe to the monthly Klyro letter — email{" "}
        <a className="underline" href="mailto:hello@klyro.dev?subject=Subscribe">hello@klyro.dev</a>{" "}
        with the subject "Subscribe".
      </p>
    </InfoPage>
  );
}
