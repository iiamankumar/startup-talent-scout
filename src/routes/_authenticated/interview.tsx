import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import { getMyInterviewState, sendInterviewMessage } from "@/lib/interview.functions";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "AI Interview with Kai — Aveiq" }] }),
  component: InterviewPage,
});

type Turn = { role: "interviewer" | "candidate"; content: string; ts: string };

function InterviewPage() {
  const getState = useServerFn(getMyInterviewState);
  const send = useServerFn(sendInterviewMessage);

  const stateQ = useQuery({ queryKey: ["interviewState"], queryFn: () => getState() });
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);
  const typingStartRef = useRef<number | null>(null);
  const pastedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = (stateQ.data?.state?.ai_interview_transcript as Turn[] | undefined) ?? [];
    if (t.length > 0 && transcript.length === 0) setTranscript(t);
    const status = stateQ.data?.state?.ai_interview_status;
    if (status === "completed" || status === "passed" || status === "failed") setFinished(true);
  }, [stateQ.data]); // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, sending]);

  const startOrSend = async (msg?: string) => {
    setSending(true);
    try {
      const typingMs = typingStartRef.current ? Date.now() - typingStartRef.current : 0;
      const res = await send({ data: { message: msg, pasted: pastedRef.current, typing_ms: typingMs } });
      setTranscript(res.transcript);
      pastedRef.current = false;
      typingStartRef.current = null;
      if (res.finished) {
        setFinished(true);
        toast.success("Interview complete. Kai is reviewing your responses.");
        stateQ.refetch();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const state = stateQ.data?.state;

  if (stateQ.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-5 animate-spin" /> Loading…
      </main>
    );
  }

  if (!state) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <h1 className="text-2xl font-medium tracking-tight">Apply first</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your profile and upload your resume before the AI interview.
          </p>
          <Link
            to="/apply"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Go to application
          </Link>
        </div>
      </main>
    );
  }

  if (!state.resume_url) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <h1 className="text-2xl font-medium tracking-tight">Resume required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload your resume on the application page first — Kai uses it to tailor the interview.
          </p>
          <Link
            to="/apply"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Upload resume
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" /> AI screening interview · conducted by Kai
          </div>
          <h1 className="mt-3 text-2xl font-medium tracking-tight">Verified on the record</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you say is logged. A senior Aveiq engineer reviews it before the final interview.
          </p>
        </div>
        {state.ai_interview_score != null && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Kai score</p>
            <p className="text-3xl font-medium">{state.ai_interview_score}</p>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="mt-6 h-[55vh] overflow-y-auto rounded-2xl bg-card p-6 ring-1 ring-black/5"
      >
        {transcript.length === 0 && !sending && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-sm text-muted-foreground">
                When you're ready, Kai will begin. Allow ~10 minutes.
              </p>
              <button
                onClick={() => startOrSend()}
                className="mt-4 inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                Begin interview
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-4">
          {transcript.map((t, i) => (
            <li
              key={i}
              className={t.role === "interviewer" ? "flex gap-3" : "flex flex-row-reverse gap-3"}
            >
              <div
                className={
                  t.role === "interviewer"
                    ? "max-w-[80%] rounded-2xl bg-secondary px-4 py-3 text-sm"
                    : "max-w-[80%] rounded-2xl bg-foreground px-4 py-3 text-sm text-background"
                }
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  {t.role === "interviewer" ? "Kai" : "You"}
                </p>
                <p className="whitespace-pre-wrap">{t.content}</p>
              </div>
            </li>
          ))}
          {sending && (
            <li className="flex gap-3">
              <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </li>
          )}
        </ul>
      </div>

      {finished ? (
        <div className="mt-5 rounded-2xl bg-success/10 p-5 text-sm ring-1 ring-success/30">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="size-4" /> Interview complete
          </div>
          {state.ai_interview_summary && (
            <p className="mt-2 text-muted-foreground">{state.ai_interview_summary}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            A senior Aveiq engineer will reach out within 48 hours to schedule the final interview.
          </p>
        </div>
      ) : (
        transcript.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || sending) return;
              const m = input;
              setInput("");
              startOrSend(m);
            }}
            className="mt-5 space-y-2"
          >
            <textarea
              value={input}
              onChange={(e) => {
                if (!typingStartRef.current) typingStartRef.current = Date.now();
                setInput(e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                pastedRef.current = true;
                setPasteWarning(
                  "Paste blocked — please type your answer in your own words. Paste attempts are recorded for the reviewer.",
                );
                setTimeout(() => setPasteWarning(null), 5000);
              }}
              onDrop={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              placeholder="Type your answer in your own words…"
              rows={3}
              className="w-full rounded-md border border-border bg-background p-3 text-sm"
              disabled={sending}
            />
            {pasteWarning && (
              <p className="text-xs text-destructive">{pasteWarning}</p>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Answers must be typed live. Pasted or AI-generated answers are flagged for the human reviewer.</span>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
              >
                <Send className="size-4" /> Send
              </button>
            </div>
          </form>
        )
      )}
    </main>
  );
}
