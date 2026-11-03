# Phase 1 — Discovery & Scoping

## Product Requirements Document (PRD)

### App Name & Description
**Interview Prompter** — A real-time interview teleprompter web application
that listens to interviewer questions via live speech-to-text, contextualizes
them against the user's uploaded CV/resume, and generates AI-powered answer
suggestions displayed in a discreet, scrolling teleprompter overlay. Designed
for video call interviews (Zoom, Google Meet, Teams) where the tool runs in a
separate browser tab.

### Target Audience
- Job seekers preparing for and conducting video call interviews
- Career changers who need help articulating transferable skills
- Non-native speakers who want real-time phrasing assistance
- Anyone who wants structured, CV-aligned talking points during interviews

### Core Features (MVP Scope)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **CV Upload & Parse** | Drag-drop PDF or DOCX. Server extracts text, chunks into sections (experience, skills, education, projects). Stored in-session only. |
| 2 | **Live Transcription** | Browser Web Speech API captures microphone audio and transcribes in real-time. Displays running transcript. |
| 3 | **Question Detection** | Detects question boundaries using pause detection (silence > 1.5s) + heuristics (question words, rising intonation markers). Highlights detected questions. |
| 4 | **AI Answer Generation** | Sends detected question + relevant CV sections to LLM. Streams response in real-time. Uses RAG-lite approach: selects most relevant CV chunks per question. |
| 5 | **Teleprompter Display** | Large-text scrolling display with: typewriter streaming effect, adjustable font size (16–48px), adjustable opacity (30–100%), dark/light theme, pause/resume scroll. |
| 6 | **Provider Switching** | Settings panel to select AI provider (Gemini/OpenAI/Claude) and enter API keys. Keys stored in browser localStorage only. |
| 7 | **Compact Overlay Mode** | Minimal floating panel mode — small footprint, positioned near top of screen to minimize eye movement away from webcam. |
| 8 | **Session History** | Running log of all Q&A pairs during the session. Exportable as markdown/text after interview for review. |

### Out of Scope (v1)
- Screen sharing / video capture of interviewer
- Audio recording or playback
- User accounts / authentication
- Persistent storage / database
- Mobile-specific layouts (responsive but not optimized)
- Custom prompt engineering UI

---

## Tech Stack Proposal

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + TypeScript + Vite | Fast HMR, type safety, rich ecosystem |
| **Styling** | Tailwind CSS | Rapid UI, utility-first, good for overlay/opacity controls |
| **Speech-to-Text** | Web Speech API (`webkitSpeechRecognition`) | Free, browser-native, no API costs, low latency. Fallback: manual text input |
| **Backend** | Node.js + Express + TypeScript | Lightweight, excellent streaming support, same language as frontend |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai`), OpenAI SDK, Anthropic SDK | Official SDKs, streaming support, easy provider abstraction |
| **CV Parsing** | `pdf-parse` (PDF), `mammoth` (DOCX) | Proven libraries for text extraction |
| **Real-time Streaming** | Server-Sent Events (SSE) | Simple one-way stream from server to client for LLM responses |
| **State Management** | React Context + useReducer | Sufficient for MVP complexity, no external dependency |
| **Build/Dev** | Vite (frontend), tsx/nodemon (backend) | Fast dev experience |
| **Testing** | Vitest (unit), Playwright (E2E) | Modern, fast, Vite-native |

### Architecture Diagram

```
Browser Tab                          Server (localhost:3001)
┌────────────────────────┐          ┌──────────────────────┐
│                        │          │                      │
│  Microphone            │          │  POST /api/cv/upload │
│    ↓                   │          │    → pdf-parse /     │
│  Web Speech API        │          │      mammoth         │
│    ↓                   │          │    → chunk & store   │
│  Transcript Panel      │          │      in session      │
│    ↓                   │          │                      │
│  Question Detector     │          │  POST /api/ask       │
│    ↓                   │          │    → select relevant │
│  POST question ────────┼─────────→│      CV chunks       │
│                        │          │    → build prompt     │
│  SSE stream ←──────────┼──────────│    → call LLM       │
│    ↓                   │          │    → stream SSE      │
│  Teleprompter Display  │          │                      │
│    (overlay mode)      │          │  GET /api/providers  │
│                        │          │    → list available  │
└────────────────────────┘          └──────────────────────┘
```

---

## Clarifying Questions (Resolved)

| # | Question | Resolution |
|---|----------|------------|
| 1 | How should the tool capture questions? | Live microphone → speech-to-text (Web Speech API) |
| 2 | What platform? | Web app (browser-based) |
| 3 | Primary use case? | Video call interviews (tool in separate tab) |
| 4 | AI provider support? | Gemini primary + switchable to OpenAI/Claude |
| 5 | Data persistence? | Session-only, no database for MVP |

---

## Open Questions — Resolved

1. **API Keys**: User has Gemini API key ready.
2. **Language**: English only for MVP.
3. **Answer Style**: Configurable (first-person spoken / bullet-point notes).
4. **Project Name**: `interview_prompter` — confirmed.
5. **Deployment**: Local-first development. User will deploy to Netlify + GitHub when ready.
