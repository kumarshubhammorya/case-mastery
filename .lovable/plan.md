
# CaseCoach — MBA Case Study Practice App (Lean MVP)

A focused web app that helps MBA students solve business cases faster by combining structured frameworks with an AI coach that asks Socratic questions, gives hints, and reviews their thinking.

## Core Concept

Pick a case → choose a framework → work through it step-by-step with an AI coach in a side panel that nudges you with questions, never just hands you the answer. Save sessions to revisit later.

## MVP Scope (kept lean)

### 1. Authentication
- Email/password + Google sign-in (Lovable Cloud)
- Minimal `profiles` table (name, school, target industry — optional)
- Protected app routes via `_authenticated` layout

### 2. Case Sources (all three, unified UI)
- **Library**: ~10–15 seeded cases across types (Profitability, Market Entry, M&A, Pricing, Market Sizing) and industries
- **Upload**: paste text or upload a PDF; AI extracts prompt, data, exhibits
- **Generate**: pick type + industry + difficulty → AI creates a fresh case

### 3. Guided Frameworks
A small library of canonical frameworks (Profitability tree, Porter's 5 Forces, 4Ps, 4Cs, Market Entry, M&A checklist). When a student opens a case, they pick a framework and the app renders it as an interactive structured workspace (collapsible nodes / sections they fill in).

### 4. AI Case Coach (the core differentiator)
A persistent chat panel alongside the framework workspace:
- Knows the current case + current framework + what the student has written so far
- **Socratic by default**: asks probing questions instead of revealing answers
- "Give me a hint" / "Check my structure" / "What am I missing?" quick actions
- End-of-case **debrief**: scores structure, hypothesis quality, quant rigor, communication; gives concrete improvements

### 5. Session History
- Every case attempt saved (case + framework state + chat + debrief)
- Simple list view: "Your practice sessions"

## Out of Scope (intentionally — keeps MVP lean)
- Timed mock interviews / formal scoring leaderboards
- Voice/video practice
- Peer/community features
- Payments
- Mobile-native app

## App Structure

```text
/                       Landing (value prop + CTA to sign up)
/login                  Auth
/signup                 Auth
/_authenticated/
  /dashboard            Recent sessions + "Start new case" actions
  /cases                Library browser (filter by type/industry/difficulty)
  /cases/new            Choose source: Library / Upload / Generate
  /cases/$caseId        Case detail + "Start session"
  /sessions/$sessionId  The workspace: case panel | framework workspace | AI coach chat
  /sessions             History list
  /profile              Basic profile
```

## Workspace Layout (`/sessions/$sessionId`)

```text
┌─────────────────────────────────────────────────────────────┐
│  Header: case title · framework selector · timer · Finish  │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  Case Brief  │  Framework Workspace     │  AI Coach (chat)  │
│  + Exhibits  │  (interactive tree /     │  Socratic Q&A,    │
│  (collapsible│   structured fields)     │  hints, debrief   │
│   panel)     │                          │                   │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

Pressing **Finish** triggers the AI debrief and saves the session.

## Data Model (Lovable Cloud / Postgres)

- `profiles` — id (FK auth.users), name, school, target_industry
- `cases` — id, title, prompt, exhibits (jsonb), type, industry, difficulty, source ('library'|'user'|'ai'), owner_id (nullable for library)
- `frameworks` — id, name, structure (jsonb template of nodes/sections)
- `sessions` — id, user_id, case_id, framework_id, workspace_state (jsonb), status, debrief (jsonb), created_at
- `messages` — id, session_id, role, content, created_at

RLS: users access only their own profiles, sessions, messages, and user-uploaded cases. Library cases are readable by all authenticated users.

## Technical Approach

- **Stack**: TanStack Start (existing), Tailwind, shadcn/ui, Lovable Cloud (auth + Postgres + storage for PDFs)
- **AI**: Lovable AI Gateway via Vercel AI SDK; `google/gemini-3-flash-preview` for chat/coaching; same model for case generation and PDF text extraction
- **Server functions**: `createServerFn` with `requireSupabaseAuth` for all case/session/coach operations; one server route under `/api/` only if a webhook is needed
- **Chat**: AI Elements components (Conversation, Message, PromptInput) with full conversation history sent each turn; messages persisted per session in DB
- **PDF upload**: file → Cloud Storage → server fn extracts text → AI structures into case prompt + exhibits

## Design Direction

Editorial / serious-academic feel — think *HBR* meets a modern productivity tool. Generous type, restrained palette (deep ink + warm paper + one accent), confident headlines. We'll generate 3 design directions before building so you can pick the one that fits.

## Build Sequence

1. Auth + profiles + protected routes + landing page
2. Database schema + seed 10–15 library cases + 5 frameworks
3. `/cases/new` flow (Library / Upload / Generate) with AI case generation server fn
4. Session workspace UI (3-pane) with framework rendering
5. AI Coach chat panel wired to AI Gateway with case+framework+state context
6. End-of-session debrief + session history
7. Polish, empty states, loading states, mobile responsive collapse

After you approve, I'll generate 3 design directions and have you pick one before I start building.
