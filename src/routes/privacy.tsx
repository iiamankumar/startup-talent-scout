import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Aveiq" },
      { name: "description", content: "How Aveiq collects, uses, and protects your personal data." },
      { property: "og:title", content: "Privacy Policy — Aveiq" },
      { property: "og:description", content: "How Aveiq collects, uses, and protects your personal data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 25, 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Who we are</h2>
            <p>Aveiq ("we", "us") operates a curated talent marketplace connecting vetted AI engineers with startups. This policy explains what data we collect and how we use it.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. What we collect</h2>
            <ul className="list-disc pl-6">
              <li>Account info: name, email, password hash, profile photo</li>
              <li>Engineer profile: resume, skills, experience, links, interview transcripts</li>
              <li>Company info: company name, website, hiring requirements</li>
              <li>Usage data: pages visited, actions taken, device/browser info</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. How we use it</h2>
            <p>To match engineers with startups, run AI screening and interviews, send transactional emails, improve the product, and meet legal obligations.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Sharing</h2>
            <p>We share engineer profiles only with startups you've applied to or matched with. We use trusted processors (cloud hosting, AI providers, email) under contract. We never sell personal data.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Your rights</h2>
            <p>You can access, correct, or delete your data anytime by emailing <a href="mailto:privacy@aveiq.app" className="text-foreground underline">privacy@aveiq.app</a>. EU/UK/India residents have additional rights under GDPR / DPDP Act.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Security</h2>
            <p>Data is encrypted in transit and at rest. Access is restricted via role-based controls and row-level security.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>Questions? <a href="mailto:privacy@aveiq.app" className="text-foreground underline">privacy@aveiq.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
