import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function callLovableAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("AI rate limit — please retry shortly.");
  if (r.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  return r.json();
}

// Upload resume: client uploads to storage, then calls this to record URL + trigger screening.
export const screenResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        resume_url: z.string().min(1).max(500),
        resume_text: z.string().min(50).max(40000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // load engineer for skills context
    const { data: eng } = await supabaseAdmin
      .from("engineers")
      .select("display_name, skills, headline, years_experience")
      .eq("user_id", userId)
      .maybeSingle();

    const system = `You are Klyro's senior engineering recruiter. Score resumes 0-100 on signal: real shipped products, technical depth, ownership, top-tier companies/projects, evidence of impact. Penalize buzzword stuffing, fabricated dates, and shallow experience. Return ONLY valid JSON.`;

    const user = `Engineer self-declared:
Name: ${eng?.display_name ?? "?"}
Headline: ${eng?.headline ?? "?"}
Skills: ${(eng?.skills ?? []).join(", ")}
Years: ${eng?.years_experience ?? "?"}

RESUME TEXT:
"""
${data.resume_text.slice(0, 30000)}
"""

Return JSON: { "score": 0-100, "feedback": "2-3 sentences plain English", "red_flags": ["..."], "strengths": ["..."], "verified_skills": ["..."] }`;

    const json = await callLovableAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_resume_score",
            description: "Submit resume evaluation",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                feedback: { type: "string" },
                red_flags: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                verified_skills: { type: "array", items: { type: "string" } },
              },
              required: ["score", "feedback", "strengths"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_resume_score" } },
    });

    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    if (!parsed?.score && parsed?.score !== 0) throw new Error("AI returned no score");

    const feedback = [
      parsed.feedback,
      parsed.strengths?.length ? `Strengths: ${parsed.strengths.join("; ")}` : "",
      parsed.red_flags?.length ? `Concerns: ${parsed.red_flags.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabaseAdmin
      .from("engineers")
      .update({
        resume_url: data.resume_url,
        resume_text: data.resume_text.slice(0, 40000),
        resume_score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        resume_feedback: feedback,
        vetting: "in_review",
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return {
      score: parsed.score,
      feedback,
      strengths: parsed.strengths ?? [],
      red_flags: parsed.red_flags ?? [],
      verified_skills: parsed.verified_skills ?? [],
    };
  });

// Update work authorization
export const setWorkAuthorization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        work_authorization: z.enum([
          "us_citizen",
          "us_green_card",
          "us_h1b",
          "us_opt_cpt",
          "us_tn",
          "other_visa",
          "india_resident",
          "eu_resident",
          "remote_only",
          "unspecified",
        ]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("engineers")
      .update({ work_authorization: data.work_authorization })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
