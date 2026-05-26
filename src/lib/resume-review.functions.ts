import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  resumeText: z.string().min(100, "Resume is too short").max(40000, "Resume is too long"),
  jobDescription: z.string().max(8000).optional().nullable(),
  targetRole: z.string().max(200).optional().nullable(),
});

export type ResumeReviewResult = {
  atsScore: number;
  atsBreakdown: {
    keywords: number;
    formatting: number;
    impact: number;
    clarity: number;
    completeness: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestions: { section: string; advice: string }[];
  rewrittenBullets: { original: string; improved: string }[];
  verdict: "excellent" | "strong" | "average" | "needs_work" | "poor";
};

const reviewTool = {
  type: "function" as const,
  function: {
    name: "submit_resume_review",
    description: "Submit the structured resume review and ATS analysis.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        atsScore: { type: "integer", minimum: 0, maximum: 100, description: "Overall ATS compatibility score 0-100." },
        atsBreakdown: {
          type: "object",
          additionalProperties: false,
          properties: {
            keywords: { type: "integer", minimum: 0, maximum: 100 },
            formatting: { type: "integer", minimum: 0, maximum: 100 },
            impact: { type: "integer", minimum: 0, maximum: 100 },
            clarity: { type: "integer", minimum: 0, maximum: 100 },
            completeness: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["keywords", "formatting", "impact", "clarity", "completeness"],
        },
        summary: { type: "string", description: "2-3 sentence overview of the candidate's resume." },
        strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
        weaknesses: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
        missingKeywords: { type: "array", items: { type: "string" }, maxItems: 15 },
        suggestions: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              section: { type: "string" },
              advice: { type: "string" },
            },
            required: ["section", "advice"],
          },
        },
        rewrittenBullets: {
          type: "array",
          minItems: 2,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              original: { type: "string" },
              improved: { type: "string" },
            },
            required: ["original", "improved"],
          },
        },
        verdict: { type: "string", enum: ["excellent", "strong", "average", "needs_work", "poor"] },
      },
      required: [
        "atsScore",
        "atsBreakdown",
        "summary",
        "strengths",
        "weaknesses",
        "missingKeywords",
        "suggestions",
        "rewrittenBullets",
        "verdict",
      ],
    },
  },
};

export const reviewResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ result: ResumeReviewResult | null; error: string | null }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { result: null, error: "AI service is not configured." };
    }

    const system = `You are a senior technical recruiter and ATS expert who has reviewed 50,000+ engineering resumes for top AI startups (OpenAI, Anthropic, Mercor, Scale, Perplexity).
Your job is to score a resume's ATS compatibility (0-100) and give brutally honest, specific, actionable feedback.

CRITICAL SCORING RULES — follow exactly:
1. Score each of the 5 breakdown dimensions INDEPENDENTLY on 0-100 based ONLY on what you observe in THIS resume. Do NOT default to round numbers like 70, 75, 80. Use the full 0-100 range. Most real resumes score between 38 and 88; only the top 1% break 90.
2. atsScore MUST equal round(0.30*keywords + 0.15*formatting + 0.25*impact + 0.15*clarity + 0.15*completeness). Compute it, do not guess. If your computed value lands on a round number like 70, that is fine, but never start from 70 and work backwards.
3. Two different resumes MUST receive different scores. Tiny differences in wording, metrics, or stack should move the score by 2-10 points.
4. Penalize HARD: no quantified metrics (-15 impact), passive verbs / "helped/worked on" (-10 impact), no modern stack (-15 keywords), tables/columns/images (-20 formatting), missing sections (-15 completeness), walls of text (-15 clarity), no links (GitHub/LinkedIn) (-10 completeness), typos (-10 clarity).
5. Reward HARD: quantified impact ($, %, x, ms, users, latency, accuracy) (+15 impact), strong action verbs (+8 clarity), modern AI/ML stack matching target role (+15 keywords), OSS/publications/patents (+10 completeness), ownership signals ("led", "owned", "architected") (+8 impact).

Verdict mapping (use the COMPUTED atsScore):
- 90-100 excellent | 75-89 strong | 60-74 average | 40-59 needs_work | 0-39 poor

Always:
- Be specific. No generic advice like "add more keywords". Name the keyword and the line.
- Quantify weaknesses. ("3 of 8 bullets lack metrics" not "lacks metrics")
- Rewrite at least 2 weak bullets from THIS resume verbatim into strong, metric-driven ones in rewrittenBullets. The "original" field MUST be a quote from the actual resume, not invented.
- For missingKeywords, list ATS-relevant technical terms relevant to the target role (or inferred role) that are missing or underrepresented in THIS resume.`;

    const userParts: string[] = [];
    if (data.targetRole) userParts.push(`Target role: ${data.targetRole}`);
    if (data.jobDescription) userParts.push(`Job description:\n${data.jobDescription}`);
    userParts.push(`Resume (${data.resumeText.length} chars):\n${data.resumeText}`);
    userParts.push(`\nAnalyze THIS specific resume. Return ONLY by calling submit_resume_review with the structured analysis. Remember: atsScore = round(0.30*keywords + 0.15*formatting + 0.25*impact + 0.15*clarity + 0.15*completeness).`);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          temperature: 0.4,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userParts.join("\n\n") },
          ],
          tools: [reviewTool],
          tool_choice: { type: "function", function: { name: "submit_resume_review" } },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("Resume review AI error", res.status, body);
        if (res.status === 429) return { result: null, error: "Too many requests. Please try again in a minute." };
        if (res.status === 402) return { result: null, error: "AI credits exhausted. Please contact support." };
        return { result: null, error: "AI service is temporarily unavailable." };
      }

      const json = await res.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsRaw = toolCall?.function?.arguments;
      if (!argsRaw) {
        console.error("Resume review: missing tool call", JSON.stringify(json).slice(0, 500));
        return { result: null, error: "AI did not return a structured analysis. Please try again." };
      }
      const parsed = JSON.parse(argsRaw) as ResumeReviewResult;

      // Enforce weighted-sum scoring server-side so the model can't anchor on 70.
      const b = parsed.atsBreakdown;
      const computed = Math.round(0.30 * b.keywords + 0.15 * b.formatting + 0.25 * b.impact + 0.15 * b.clarity + 0.15 * b.completeness);
      parsed.atsScore = Math.max(0, Math.min(100, computed));
      parsed.verdict =
        computed >= 90 ? "excellent" :
        computed >= 75 ? "strong" :
        computed >= 60 ? "average" :
        computed >= 40 ? "needs_work" : "poor";

      return { result: parsed, error: null };
    } catch (err) {
      console.error("Resume review failed", err);
      return { result: null, error: "Something went wrong analyzing your resume." };
    }
  });
