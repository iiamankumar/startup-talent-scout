import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Aveiq" },
      { name: "description", content: "The terms governing your use of Aveiq's talent marketplace." },
      { property: "og:title", content: "Terms of Service — Aveiq" },
      { property: "og:description", content: "The terms governing your use of Aveiq's talent marketplace." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 25, 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance</h2>
            <p>By creating an account or using Aveiq, you agree to these terms. If you don't agree, don't use the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. The service</h2>
            <p>Aveiq is a marketplace that introduces vetted engineers to startups. We are not the employer or the agency. Hiring decisions and employment terms are between you and the other party.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Accounts</h2>
            <p>You're responsible for keeping your credentials safe and for the accuracy of information you submit (including your resume and company details).</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Acceptable use</h2>
            <ul className="list-disc pl-6">
              <li>No fake profiles, plagiarized resumes, or misrepresentation</li>
              <li>No scraping, spam, or abuse of other users</li>
              <li>No bypassing the platform to avoid fees once introduced (for paid plans)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. AI features</h2>
            <p>Resume scoring, AI interviews, and ATS reviews are provided "as is" to assist screening. They are not employment decisions and should not be solely relied upon.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Termination</h2>
            <p>We may suspend accounts that violate these terms. You can delete your account at any time.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Liability</h2>
            <p>To the extent permitted by law, Aveiq is not liable for indirect or consequential damages arising from use of the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
            <p>Questions? <a href="mailto:legal@aveiq.app" className="text-foreground underline">legal@aveiq.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
