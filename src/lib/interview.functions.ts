import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Turn = { role: "interviewer" | "candidate"; content: string; ts: string };

async function callAI(messages: Array<{ role: string; content: string }>, tools?: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
  });
  if (r.status === 429) throw new Error("AI rate limit — please retry shortly.");
  if (r.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  return r.json();
}

const INTERVIEWER_SYSTEM = `You are "Kai", Aveiq's senior AI technical interviewer. You conduct a focused 6-8 question screening interview to verify the candidate's depth and signal.

Rules:
- Open with a friendly intro stating your name (Kai) and that this is a verified screening on the record.
- Ask ONE question at a time. Keep each question short.
- Cover: (1) a real project they built end-to-end, (2) a hard technical decision and tradeoff, (3) a deep follow-up probing the previous answer, (4) one system-design or debugging scenario, (5) collaboration/ownership, (6) work authorization + availability.
- When the candidate gives vague or buzzword-y answers, push back politely and ask for specifics (numbers, names of services, what broke, what they fixed).
- After ~6-8 substantive exchanges, output the exact token [END_INTERVIEW] on its own line and stop.
- Never reveal scoring criteria or that you're an AI being graded.`;

// Start or resume the AI interview — returns next interviewer message
export const sendInterviewMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      message: z.string().trim().max(4000).optional(),
      pasted: z.boolean().optional(),
      typing_ms: z.number().int().min(0).max(60 * 60 * 1000).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: eng, error: e1 } = await supabaseAdmin
      .from("engineers")
      .select("display_name, headline, skills, resume_text, ai_interview_transcript, ai_interview_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!eng) throw new Error("Apply to the network first.");
    if (eng.ai_interview_status === "completed" || eng.ai_interview_status === "passed" || eng.ai_interview_status === "failed") {
      throw new Error("Interview already completed.");
    }

    const transcript = (eng.ai_interview_transcript as Turn[]) ?? [];

    if (data.message) {
      transcript.push({ role: "candidate", content: data.message, ts: new Date().toISOString() });

      // Server-side integrity check
      const { detectAiPaste } = await import("@/lib/interview-integrity");
      const heur = detectAiPaste(data.message, data.typing_ms ?? 0);
      const reasons: string[] = [];
      if (data.pasted) reasons.push("client-paste");
      if (heur.flagged && heur.reason) reasons.push(heur.reason);
      if (reasons.length > 0) {
        await supabaseAdmin.from("engineer_paste_flags").insert({
          user_id: userId,
          turn_index: transcript.length - 1,
          reason: reasons.join(","),
          snippet: data.message.slice(0, 280),
        });
      }
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: INTERVIEWER_SYSTEM },
      {
        role: "system",
        content: `Candidate profile:
Name: ${eng.display_name}
Headline: ${eng.headline ?? "—"}
Skills: ${(eng.skills ?? []).join(", ")}
Resume excerpt: ${(eng.resume_text ?? "").slice(0, 4000)}`,
      },
      ...transcript.map((t) => ({
        role: t.role === "interviewer" ? "assistant" : "user",
        content: t.content,
      })),
    ];

    if (transcript.length === 0) {
      messages.push({ role: "user", content: "[BEGIN INTERVIEW]" });
    }

    const res = await callAI(messages);
    const reply: string = res?.choices?.[0]?.message?.content?.trim() ?? "";
    const finished = reply.includes("[END_INTERVIEW]");
    const cleaned = reply.replace("[END_INTERVIEW]", "").trim();

    if (cleaned) {
      transcript.push({ role: "interviewer", content: cleaned, ts: new Date().toISOString() });
    }

    const newStatus = finished ? "completed" : "in_progress";

    await supabaseAdmin
      .from("engineers")
      .update({
        ai_interview_transcript: transcript,
        ai_interview_status: newStatus,
      })
      .eq("user_id", userId);

    if (finished) {
      await gradeInterview(userId, transcript);
    }

    return { reply: cleaned, finished, transcript };
  });

async function gradeInterview(userId: string, transcript: Turn[]) {
  const convo = transcript.map((t) => `${t.role === "interviewer" ? "KAI" : "CANDIDATE"}: ${t.content}`).join("\n\n");

  const res = await callAI(
    [
      {
        role: "system",
        content: `You are Aveiq's grading panel. Score the candidate 0-100 on technical depth, ownership, communication, and authenticity. Be strict. Return ONLY via the tool.`,
      },
      { role: "user", content: `TRANSCRIPT:\n\n${convo}` },
    ],
    [
      {
        type: "function",
        function: {
          name: "grade",
          description: "Submit grade",
          parameters: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 0, maximum: 100 },
              summary: { type: "string" },
              verdict: { type: "string", enum: ["passed", "failed"] },
            },
            required: ["score", "summary", "verdict"],
            additionalProperties: false,
          },
        },
      },
    ],
  );
  const args = res?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const parsed = typeof args === "string" ? JSON.parse(args) : args;
  if (!parsed) return;

  await supabaseAdmin
    .from("engineers")
    .update({
      ai_interview_score: parsed.score,
      ai_interview_summary: parsed.summary,
      ai_interview_status: parsed.verdict === "passed" ? "passed" : "failed",
      ai_interview_completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

// Admin: schedule main interview
export const scheduleMainInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        scheduled_at: z.string().min(1),
        notes: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");
    const { error } = await supabaseAdmin
      .from("engineers")
      .update({
        main_interview_scheduled_at: data.scheduled_at,
        main_interview_status: "in_progress",
        main_interview_notes: data.notes ?? null,
        main_interviewer_id: context.userId,
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);

    // Notify candidate + interviewer (Google Calendar deep-link, no attachment)
    try {
      await sendInterviewScheduledEmails({
        candidateUserId: data.user_id,
        interviewerUserId: context.userId,
        scheduledAt: data.scheduled_at,
        notes: data.notes,
      });
    } catch (err) {
      // Don't fail the scheduling if email fails
      console.error("Failed to send interview emails", err);
    }

    return { ok: true };
  });

async function sendInterviewScheduledEmails(opts: {
  candidateUserId: string;
  interviewerUserId: string;
  scheduledAt: string;
  notes?: string;
}) {
  const start = new Date(opts.scheduledAt);
  if (isNaN(start.getTime())) return;
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h block
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const calendarUrl = new URL("https://calendar.google.com/calendar/render");
  calendarUrl.searchParams.set("action", "TEMPLATE");
  calendarUrl.searchParams.set("text", "Aveiq — Final Interview");
  calendarUrl.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
  calendarUrl.searchParams.set(
    "details",
    `Final interview${opts.notes ? `\n\nNotes: ${opts.notes}` : ""}`,
  );

  const scheduledAtPretty = start.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Resolve candidate
  const { data: candidate } = await supabaseAdmin
    .from("engineers")
    .select("display_name, user_id")
    .eq("user_id", opts.candidateUserId)
    .maybeSingle();
  const { data: candidateAuth } = await supabaseAdmin.auth.admin.getUserById(
    opts.candidateUserId,
  );
  const candidateEmail = candidateAuth?.user?.email;

  // Resolve interviewer
  const { data: interviewerAuth } = await supabaseAdmin.auth.admin.getUserById(
    opts.interviewerUserId,
  );
  const interviewerEmail = interviewerAuth?.user?.email;

  const baseUrl = process.env.VITE_PUBLIC_APP_URL || "";

  const sendOne = async (
    templateName: string,
    recipientEmail: string,
    templateData: Record<string, unknown>,
  ) => {
    await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        templateName,
        recipientEmail,
        templateData: templateData as never,
        idempotencyKey: `interview-${templateName}-${opts.candidateUserId}-${start.getTime()}`,
      } as never,
    });
  };

  if (candidateEmail) {
    await sendOne("interview-scheduled-engineer", candidateEmail, {
      candidateName: candidate?.display_name,
      scheduledAt: scheduledAtPretty,
      notes: opts.notes,
      calendarUrl: calendarUrl.toString(),
    });
  }
  if (interviewerEmail) {
    await sendOne("interview-scheduled-admin", interviewerEmail, {
      candidateName: candidate?.display_name,
      candidateEmail,
      scheduledAt: scheduledAtPretty,
      notes: opts.notes,
      calendarUrl: calendarUrl.toString(),
      adminUrl: baseUrl ? `${baseUrl}/admin` : undefined,
    });
  }
}

// Admin: record main interview verdict
export const setMainInterviewVerdict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        verdict: z.enum(["passed", "failed"]),
        notes: z.string().max(2000).optional(),
        approve_to_network: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");
    const vetting: "vetted" | "rejected" | undefined =
      data.approve_to_network && data.verdict === "passed"
        ? "vetted"
        : data.verdict === "failed"
          ? "rejected"
          : undefined;
    const { error } = await supabaseAdmin
      .from("engineers")
      .update({
        main_interview_status: data.verdict,
        main_interview_verdict: data.verdict,
        main_interview_notes: data.notes ?? null,
        ...(vetting ? { vetting } : {}),
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Get my interview state (for /interview page)
export const getMyInterviewState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("engineers")
      .select(
        "ai_interview_status, ai_interview_score, ai_interview_summary, ai_interview_transcript, main_interview_status, main_interview_scheduled_at, main_interview_notes, main_interview_verdict, resume_url, resume_score, work_authorization, vetting"
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { state: data };
  });
