import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { FileText, Sparkles, Upload, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Lock } from "lucide-react";
import { reviewResume, type ResumeReviewResult } from "@/lib/resume-review.functions";
import { extractTextFromFile } from "@/lib/pdf-extract";
import { AveiqLogo } from "@/components/AveiqLogo";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/resume-review")({
  head: () => ({
    meta: [
      { title: "Free AI Resume Review & ATS Score — Aveiq" },
      {
        name: "description",
        content:
          "Get an instant AI resume review and accurate ATS score. Tailored feedback for AI engineers and tech roles — strengths, gaps, missing keywords, and rewritten bullets.",
      },
      { property: "og:title", content: "AI Resume Review & ATS Score — Aveiq" },
      {
        property: "og:description",
        content: "Upload your resume. Get an ATS score, missing keywords, and rewritten bullets in seconds. Free.",
      },
    ],
  }),
  component: ResumeReviewPage,
});

function ResumeReviewPage() {
  const { user } = useAuth();

  const fn = useServerFn(reviewResume);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      fn({
        data: {
          resumeText: resumeText.trim(),
          targetRole: targetRole.trim() || null,
          jobDescription: jobDescription.trim() || null,
        },
      }),
  });

  const result = mutation.data?.result ?? null;
  const apiError = mutation.data?.error ?? null;

  const handleFile = async (file: File) => {
    try {
      setFileName(file.name);
      const text = await extractTextFromFile(file);
      setResumeText(text.slice(0, 40000));
    } catch (e) {
      setFileName(null);
      setResumeText("");
      alert((e as Error).message);
    }
  };

  const wordCount = useMemo(() => resumeText.trim().split(/\s+/).filter(Boolean).length, [resumeText]);
  const canSubmit = !!user && resumeText.trim().length >= 100 && !mutation.isPending;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-2">
          <AveiqLogo />
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/network" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
            Network
          </Link>
          <Link to="/apply" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Apply as Talent
          </Link>
          <Link
            to="/hire"
            className="inline-flex items-center rounded-full bg-foreground py-2 pl-4 pr-4 text-sm font-medium text-background"
          >
            Hire Talent
          </Link>
        </div>
      </nav>

      <section className="px-6 pt-8 pb-12 lg:pt-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium ring-1 ring-black/5">
            <Sparkles className="size-3.5" />
            Free • Powered by AI
          </div>
          <h1 className="text-balance text-4xl font-medium leading-tight tracking-tight lg:text-6xl">
            Get your <span className="font-serif italic">ATS score</span> and AI resume review in seconds.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Upload your resume below. Our AI gives you an accurate ATS compatibility score, missing keywords,
            and rewritten bullets — the same way top AI startups screen candidates.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Input panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Upload your resume</h2>

            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`mt-3 flex h-72 w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-background p-6 text-center transition-colors ${dragActive ? "border-foreground bg-secondary" : ""}`}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                className="hidden"
                id="resume-upload"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {fileName ? (
                <div className="space-y-2">
                  <FileText className="mx-auto size-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{wordCount} words • {resumeText.length} chars</p>
                  <label
                    htmlFor="resume-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium ring-1 ring-black/5 hover:bg-muted"
                  >
                    <Upload className="size-3.5" /> Replace file
                  </label>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Drag & drop your resume here</p>
                  <p className="mt-1 text-xs text-muted-foreground">or</p>
                  <label
                    htmlFor="resume-upload"
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium ring-1 ring-black/5 hover:bg-muted"
                  >
                    <Upload className="size-3.5" /> Browse files
                  </label>
                  <p className="mt-3 text-[10px] text-muted-foreground">Supports PDF, .txt, .md</p>
                </>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{fileName ? "File loaded" : "No file selected"}</span>
              <span>{resumeText.length > 1 ? `${resumeText.length}/40000` : ""}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Target role (optional)</label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value.slice(0, 200))}
                  placeholder="e.g. Senior ML Engineer, RAG"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Job description (optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value.slice(0, 8000))}
                  placeholder="Add the JD for keyword-targeted feedback"
                  className="mt-1 h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" /> Get my ATS score & review
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Your resume is not stored. Analysis happens server-side and is discarded.
            </p>
          </div>

          {/* Result panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {!result && !mutation.isPending && !apiError && <EmptyState />}
            {mutation.isPending && <LoadingState />}
            {apiError && <ErrorState message={apiError} />}
            {result && <ResultView result={result} />}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h3 className="text-2xl font-medium">Resume scoring 80+?</h3>
          <p className="mt-2 text-muted-foreground">
            Apply to Aveiq's vetted AI engineer network. Get matched to top startups in 72 hours.
          </p>
          <Link
            to="/apply"
            className="mt-5 inline-flex items-center rounded-full bg-foreground py-2.5 pl-4 pr-5 text-sm font-medium text-background"
          >
            Apply as Talent <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
      <FileText className="size-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">Your AI review will appear here</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Upload your resume and click <span className="font-medium text-foreground">Get my ATS score</span> to
        see your score, missing keywords, and rewritten bullets.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
      <Loader2 className="size-10 animate-spin text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">Analyzing your resume…</h3>
      <p className="mt-2 text-sm text-muted-foreground">Scoring ATS compatibility, keywords, and impact.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h3 className="mt-4 text-lg font-medium">Couldn't analyze your resume</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function verdictColor(v: ResumeReviewResult["verdict"]) {
  switch (v) {
    case "excellent":
    case "strong":
      return "text-success";
    case "average":
      return "text-foreground";
    default:
      return "text-destructive";
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-foreground";
  return "text-destructive";
}

function ResultView({ result }: { result: ResumeReviewResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-border pb-5">
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted opacity-30" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${result.atsScore}, 100`}
              strokeLinecap="round"
              className={scoreColor(result.atsScore)}
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold ${scoreColor(result.atsScore)}`}>
            {result.atsScore}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">ATS Score</p>
          <p className={`text-lg font-semibold capitalize ${verdictColor(result.verdict)}`}>
            {result.verdict.replace("_", " ")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Score breakdown</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(result.atsBreakdown).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className={`mt-1 text-lg font-semibold ${scoreColor(v)}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" /> Strengths
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.strengths.map((s, i) => (
              <li key={i} className="leading-snug">• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" /> Weaknesses
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.weaknesses.map((s, i) => (
              <li key={i} className="leading-snug">• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      {result.missingKeywords.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Missing / under-used keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <span key={k} className="rounded-full bg-secondary px-2.5 py-1 text-xs ring-1 ring-black/5">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold">Section-by-section suggestions</h4>
        <div className="space-y-3">
          {result.suggestions.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.section}</p>
              <p className="mt-1 text-sm leading-snug">{s.advice}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Rewritten bullets</h4>
        <div className="space-y-3">
          {result.rewrittenBullets.map((b, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-destructive line-through opacity-80">{b.original}</p>
              <p className="mt-1.5 text-sm font-medium text-success">{b.improved}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
