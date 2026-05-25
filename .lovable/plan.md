
# Phased rollout plan

You picked: apply-refactor → admin → referrals → calendar → live AI video, in that order, with a 15–25 min proctored Kai interview. I'll ship in 5 phases, each independently usable. You approve, I start with Phase 1 and check in between phases.

---

## Phase 1 — Apply flow refactor (ship first)

**Goal:** Engineer fills profile once. Applying to a job posting is one click.

- Remove Step 4 (scheduling) from `/apply`. Wizard becomes: Profile → Resume → Kai interview → Done.
- Add `/jobs` (list of open `hire_requests`) and `/jobs/$id` (job detail + one-click Apply).
- "Apply" creates an `applications` row using the engineer's already-stored profile/resume/Kai score — no re-entry.
- Block apply until profile is complete & Kai interview passed; show a clear CTA to finish onboarding.
- Engineer dashboard: "My applications" list with status.

---

## Phase 2 — Admin dashboard upgrades

- Bulk approve/reject for engineers (vetting status) and applications.
- Search box (name, email, skills) + filters (vetting status, Kai score range, availability, location).
- Sortable columns; pagination.
- Same treatment for hire_requests (status filter, search by company/role).
- CSV export of current filter.

---

## Phase 3 — Referral program (code + reward tracking)

- New tables: `referral_codes` (one per user), `referrals` (referrer, referred user, status, reward_amount, reward_status).
- Auto-generate a code on signup; shareable link `/?ref=CODE`.
- On signup, attribute via cookie/localStorage → write a `pending` referral.
- Conversion triggers:
  - Engineer referred → marks `converted` when referred engineer becomes `vetted`.
  - Founder referred → marks `converted` when referred founder posts first hire_request.
- Admin view: referrals table, mark reward as `paid`.
- Emails: "You were referred", "Your referral converted", "Reward marked paid".
- No automated payouts (manual by admin) — you can add Stripe payouts later.

---

## Phase 4 — Per-interviewer Google Calendar OAuth + auto-schedule

**Requires:** You create OAuth credentials in Google Cloud Console (Calendar API + scope `https://www.googleapis.com/auth/calendar`). I'll give you the exact redirect URL to paste.

- Add `interviewer_google_tokens` table (user_id, access_token, refresh_token, expiry, scope).
- `/settings/calendar` page: "Connect Google Calendar" button → OAuth flow → store tokens.
- Server fn `findAvailableSlots(interviewerIds, durationMin, withinDays)`:
  - Calls `freebusy.query` on each interviewer's calendar.
  - Returns next N free 25-min slots in business hours.
- When Kai marks a candidate "passed", auto-pick first slot, create the event on interviewer's calendar (with Google Meet link), insert into `engineers.main_interview_*`, send emails to both sides.
- Token refresh handled server-side.

**Secrets needed:** `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.

---

## Phase 5 — Live AI video interview with proctoring (biggest piece)

**Reality check:** This is 1–2 weeks on its own and requires 3 paid services. I'll build it as its own milestone with its own checkpoint.

### Architecture

```text
┌─ Candidate browser ──────────────────────────┐
│  • LiveKit React SDK (WebRTC room)           │
│  • getUserMedia: camera + mic + screen       │
│  • MediaRecorder → upload chunks to Storage  │
│  • Proctoring: face-detection (MediaPipe),   │
│    tab/window blur events, fullscreen lock,  │
│    copy/paste block, multiple-face warning   │
└──────────────┬───────────────────────────────┘
               │ WebRTC
┌──────────────▼───────────────────────────────┐
│  LiveKit Cloud room (audio+video relay)      │
└──────────────┬───────────────────────────────┘
               │ server agent joins room
┌──────────────▼───────────────────────────────┐
│  Kai agent (TanStack server route, long-run) │
│  • Deepgram streaming STT (candidate audio)  │
│  • Gemini 2.5 Pro: question planning,        │
│    follow-ups, scoring, summary              │
│  • ElevenLabs streaming TTS → published      │
│    back into the room as Kai's voice         │
└──────────────────────────────────────────────┘
```

### Flow

1. Candidate clicks "Start interview" → consent screen (camera, mic, screen share, recording, proctoring).
2. Browser joins LiveKit room; Kai agent joins as a participant.
3. Kai introduces itself via TTS, asks question 1.
4. Deepgram transcribes candidate's answer in real time; Gemini decides follow-up vs next question.
5. Proctoring events streamed to server (`tab_blur`, `face_lost`, `multiple_faces`, `looking_away`, `fullscreen_exit`). Each event logged with timestamp.
6. After 15–25 min or N questions, Kai wraps up. Recording uploaded to Supabase Storage.
7. Background job: full transcript + proctoring report → Gemini scores → writes to `engineers.ai_interview_*` + new `interview_proctoring_report` table.
8. If passed → triggers Phase 4 auto-schedule.

### New tables

- `interview_sessions` (id, engineer_id, room_name, started_at, ended_at, recording_url, status)
- `interview_transcript_chunks` (session_id, speaker, text, ts)
- `interview_proctoring_events` (session_id, event_type, severity, ts, metadata)
- `interview_scores` (session_id, dimension, score, rationale)

### Secrets needed

- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY` (or use Gemini's native audio for cost)

### Cost realism

- LiveKit Cloud: ~$0.004/participant-min → ~$0.20/interview
- Deepgram Nova-2: ~$0.0043/min → ~$0.11/interview
- ElevenLabs: ~$0.30/1k chars → ~$0.50/interview
- Gemini 2.5 Pro: ~$0.20/interview
- **~$1/interview** in API costs. Plan accordingly.

### What I'll cut from "full proctoring" to keep scope sane

- Browser-side face detection (MediaPipe Tasks) — yes
- Tab blur / fullscreen exit / paste block — yes
- Screen recording stored — yes
- ID verification (driver's license OCR) — **out of scope**, add later
- Live human reviewer takeover — **out of scope**
- Network-level VPN/proxy detection — **out of scope**

---

## What I need from you to start

Approve this plan, then I'll begin Phase 1 immediately. Phases 4 and 5 will pause for secrets — I'll tell you exactly what to paste when we get there.

**Confirm:** Should I start Phase 1 now and run straight through Phase 3 before pausing, then pause for the Google OAuth + LiveKit/Deepgram/ElevenLabs secrets before Phases 4–5?
