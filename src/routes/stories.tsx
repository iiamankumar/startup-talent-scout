import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoBlock } from "@/components/InfoPage";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories — Klyro" },
      { name: "description", content: "Real stories from engineers and founders on the Klyro network." },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  return (
    <InfoPage
      eyebrow="From the network"
      title="Stories"
      intro="Engineers and founders talking honestly about hiring, getting hired, and shipping together."
    >
      <InfoBlock title="“I stopped sending cold emails the week I joined Klyro.”">
        Aarav, a backend engineer from Pune, was applying to 30+ jobs a week before joining the
        network. Within three weeks of being vetted he had two offers from YC-backed startups.
      </InfoBlock>
      <InfoBlock title="“The first three resumes were all hires.”">
        A seed-stage founder in San Francisco posted a single brief on Klyro and made offers to
        three of the first five engineers who applied. All three are still on the team a year later.
      </InfoBlock>
      <InfoBlock title="“Real reviews changed how I interview.”">
        Reviews from past founders gave one engineer leverage in salary conversations she'd never
        had before — and a clearer story to tell about her own work.
      </InfoBlock>
      <p className="text-sm text-muted-foreground">
        More stories are published every few weeks. Want to share yours? Email{" "}
        <a className="underline" href="mailto:stories@klyro.dev">stories@klyro.dev</a>.
      </p>
    </InfoPage>
  );
}
