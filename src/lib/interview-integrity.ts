/**
 * Heuristic detection that a candidate answer was pasted from an AI (e.g. ChatGPT)
 * rather than typed. Used as a soft signal — flagged answers are recorded but the
 * interview continues; admins see flags during vetting.
 */
export function detectAiPaste(text: string, typingMs: number): { flagged: boolean; reason: string | null } {
  const t = text.trim();
  if (t.length < 60) return { flagged: false, reason: null };

  // Tell-tale phrases AI assistants use
  const aiPhrases = [
    /as an ai (language )?model/i,
    /i (cannot|can't) (provide|browse|access)/i,
    /here['']s (a|an|the) (overview|breakdown|summary)/i,
    /certainly!? here/i,
    /in (summary|conclusion),/i,
    /^great question[!.,]/i,
    /\b(let me|i['']ll) (walk you through|break this down)\b/i,
  ];
  if (aiPhrases.some((re) => re.test(t))) {
    return { flagged: true, reason: "ai-phrase" };
  }

  // Structured markdown that humans rarely type in a chat answer
  const bulletLines = t.split("\n").filter((l) => /^\s*([-*•]|\d+\.)\s/.test(l)).length;
  if (bulletLines >= 4) return { flagged: true, reason: "markdown-list" };

  // Typing speed sanity: > 1500 chars/minute = ~250 wpm sustained (impossible).
  if (typingMs > 0) {
    const charsPerMin = (t.length / typingMs) * 60_000;
    if (charsPerMin > 1500 && t.length > 200) {
      return { flagged: true, reason: "too-fast" };
    }
  }

  return { flagged: false, reason: null };
}
