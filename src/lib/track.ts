import { trackEvent } from "./analytics.functions";

/** Fire-and-forget event tracker; never throws. */
export async function track(event_name: string, metadata?: Record<string, unknown>) {
  try {
    await trackEvent({ data: { event_name, metadata: metadata as Record<string, unknown> } });
  } catch {
    // swallow — analytics must never break the UX
  }
}
