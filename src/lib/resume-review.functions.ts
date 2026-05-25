import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ result: ResumeReviewResult | null; error: string | null }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { result: null, error: "AI service is not configured." };
    }

    const system = `You are a senior technical recruiter and ATS expert who has reviewed 50,000+ engineering resumes for top AI startups (OpenAI, Anthropic, Mercor, Scale, Perplexity).
Your job is to score a resume's ATS compatibility (0-100) and give brutally honest, specific, actionable feedback.

Scoring rubric:
- 90-100 excellent: top 1%, ready for FAANG / top AI labs
- 75-89 strong: clearly hireable, minor polish needed
- 60-74 average: needs real work on impact metrics and keywords
- 40-59 needs_work: major rewrites needed
- 0-39 poor: fundamental restructuring required

Always:
- Be specific. No generic advice like "add more keywords". Name the keyword.
- Quantify weaknesses. ("3 of 8 bullets lack metrics" not "lacks metrics")
- Rewrite at least 2 weak bullets into strong, metric-driven ones in rewrittenBullets.
- For missingKeywords, list ATS-relevant technical terms actually relevant to the target role (or inferred role) that are missing or underrepresented.
- Penalize: tables, columns, images, headers/footers (ATS-unfriendly), passive voice, vague verbs ("helped", "worked on"), no metrics, no tech stack.
- Reward: action verbs, quantified impact ($, %, x, ms, users), modern tech stack, ownership signals, OSS / publications.`;

    const userParts: string[] = [];
    if (data.targetRole) userParts.push(`Target role: ${data.targetRole}`);
    if (data.jobDescription) userParts.push(`Job description:\n${data.jobDescription}`);
    userParts.push(`Resume:\n${data.resumeText}`);
    userParts.push(`\nReturn ONLY by calling submit_resume_review with the structured analysis.`);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
      return { result: parsed, error: null };
    } catch (err) {
      console.error("Resume review failed", err);
      return { result: null, error: "Something went wrong analyzing your resume." };
    }
  });
