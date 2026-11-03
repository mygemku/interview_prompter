# Phase 2 — Architecture & Data Modeling

## Deployment Model

**Netlify** — static frontend (React/Vite) + Netlify Functions (serverless backend).
No persistent server. API keys stored client-side (localStorage). CV parsing
and LLM calls happen in serverless functions.

---

## Project Structure

```
interview_prompter/
├── docs/                          # Phase docs, BRIEF, CHANGELOG
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/                    # Static assets (icons, images)
│   ├── components/
│   │   ├── cv/
│   │   │   ├── CvUploader.tsx         # Drag-drop upload component
│   │   │   └── CvPreview.tsx          # Parsed CV sections display
│   │   ├── transcription/
│   │   │   ├── TranscriptPanel.tsx     # Live transcript display
│   │   │   ├── QuestionDetector.tsx    # Question boundary detection
│   │   │   └── MicControls.tsx        # Mic start/stop, status
│   │   ├── prompter/
│   │   │   ├── TeleprompterDisplay.tsx # Main answer display
│   │   │   ├── OverlayMode.tsx        # Compact floating panel
│   │   │   └── PrompterControls.tsx   # Font, opacity, speed
│   │   ├── settings/
│   │   │   ├── ProviderSettings.tsx   # AI provider selection + keys
│   │   │   └── AnswerStyleSettings.tsx # First-person / bullet / etc.
│   │   ├── session/
│   │   │   └── SessionHistory.tsx     # Q&A log + export
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Slider.tsx
│   │       ├── Modal.tsx
│   │       └── Badge.tsx
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts    # Web Speech API wrapper
│   │   ├── useQuestionDetection.ts    # Pause + heuristic detection
│   │   ├── useLlmStream.ts           # SSE consumer for LLM responses
│   │   └── useCvContext.ts            # CV state management
│   ├── lib/
│   │   ├── cv-parser.ts              # Client-side: send file to function
│   │   ├── llm-client.ts             # Call Netlify function with question
│   │   ├── prompt-builder.ts         # Build system/user prompts
│   │   └── question-heuristics.ts    # Question detection logic
│   ├── context/
│   │   ├── AppContext.tsx            # Global state provider
│   │   └── types.ts                  # Shared TypeScript types
│   ├── App.tsx                       # Main app layout + routing
│   ├── main.tsx                      # React entry point
│   └── index.css                     # Tailwind imports + custom styles
├── netlify/
│   └── functions/
│       ├── cv-parse.ts               # Parse uploaded PDF/DOCX → text chunks
│       ├── ask.ts                    # LLM query: question + CV context → streamed answer
│       └── providers.ts             # List available AI providers
├── .env.example                      # GEMINI_API_KEY, OPENAI_API_KEY, etc.
├── .gitignore
├── index.html
├── netlify.toml                      # Netlify config (build, functions dir)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Data Model (In-Memory / Session State)

No database. All state lives in React Context + serverless function request bodies.

### TypeScript Types

```typescript
// === CV Data ===
interface CvSection {
  id: string;
  type: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'other';
  title: string;
  content: string;
  keywords: string[];  // extracted for relevance matching
}

interface CvData {
  fileName: string;
  uploadedAt: string;       // ISO timestamp
  rawText: string;          // full extracted text
  sections: CvSection[];    // chunked sections
}

// === Transcription ===
interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;        // ms since session start
  isFinal: boolean;         // Web Speech API final vs interim
  isQuestion: boolean;      // detected as question
  confidence: number;       // 0-1 speech recognition confidence
}

// === Q&A ===
interface QAPair {
  id: string;
  question: string;
  detectedAt: number;       // timestamp
  answer: string;           // accumulated streamed answer
  isStreaming: boolean;
  provider: LlmProvider;
  answerStyle: AnswerStyle;
  relevantSections: string[]; // CvSection IDs used
}

// === Settings ===
type LlmProvider = 'gemini' | 'openai' | 'claude';
type AnswerStyle = 'first-person' | 'bullet-points' | 'concise-notes';

interface ProviderConfig {
  provider: LlmProvider;
  apiKey: string;           // stored in localStorage
  model: string;            // e.g. 'gemini-2.0-flash', 'gpt-4o-mini'
}

interface AppSettings {
  activeProvider: LlmProvider;
  providers: Record<LlmProvider, ProviderConfig>;
  answerStyle: AnswerStyle;
  prompterFontSize: number;   // 16-48
  prompterOpacity: number;    // 0.3-1.0
  prompterTheme: 'dark' | 'light';
  overlayMode: boolean;
  silenceThresholdMs: number; // default 1500
}

// === App State ===
interface AppState {
  cv: CvData | null;
  transcript: TranscriptSegment[];
  qaPairs: QAPair[];
  settings: AppSettings;
  isListening: boolean;
  sessionStartedAt: string | null;
}
```

---

## API Routes (Netlify Functions)

### POST `/.netlify/functions/cv-parse`

Parse uploaded CV file into text sections.

**Request:** `multipart/form-data`
```
file: <PDF or DOCX file>
```

**Response:** `200 OK`
```json
{
  "fileName": "john_doe_cv.pdf",
  "rawText": "Full extracted text...",
  "sections": [
    {
      "id": "exp-1",
      "type": "experience",
      "title": "Senior Developer at Acme Corp",
      "content": "Led team of 5...",
      "keywords": ["React", "Node.js", "team lead"]
    }
  ]
}
```

### POST `/.netlify/functions/ask`

Send question + CV context to LLM, return streaming answer.

**Request:** `application/json`
```json
{
  "question": "Tell me about your experience with React",
  "cvSections": [ { "type": "experience", "content": "..." } ],
  "provider": "gemini",
  "apiKey": "user-provided-key",
  "model": "gemini-2.0-flash",
  "answerStyle": "first-person"
}
```

**Response:** `text/event-stream` (SSE)
```
data: {"chunk": "In my role at "}
data: {"chunk": "Acme Corp, I "}
data: {"chunk": "led the frontend "}
data: {"done": true, "totalTokens": 245}
```

### GET `/.netlify/functions/providers`

List available AI providers and default models.

**Response:** `200 OK`
```json
{
  "providers": [
    { "id": "gemini", "name": "Google Gemini", "defaultModel": "gemini-2.0-flash", "models": ["gemini-2.0-flash", "gemini-2.5-pro"] },
    { "id": "openai", "name": "OpenAI", "defaultModel": "gpt-4o-mini", "models": ["gpt-4o-mini", "gpt-4o"] },
    { "id": "claude", "name": "Anthropic Claude", "defaultModel": "claude-sonnet-4-20250514", "models": ["claude-sonnet-4-20250514", "claude-haiku-35-20241022"] }
  ]
}
```

---

## Prompt Engineering Strategy

### System Prompt Template
```
You are an interview answer assistant. The candidate has provided their CV/resume below.
Your role is to help them answer interview questions using information from their CV.

ANSWER STYLE: {first-person | bullet-points | concise-notes}

RULES:
- Use ONLY information from the CV. Do not fabricate experiences.
- If the CV doesn't contain relevant information, say so honestly and suggest
  how to pivot the answer to related experience.
- Keep answers concise (2-4 sentences for first-person, 3-5 bullets for bullet-points).
- Sound natural and confident, not robotic.
- Highlight specific metrics, technologies, and achievements from the CV.

CANDIDATE'S CV:
---
{relevant_cv_sections}
---
```

### Relevance Matching (RAG-lite)
1. Extract keywords from detected question
2. Score each CV section by keyword overlap + section type relevance
3. Send top 3-5 most relevant sections as context (not full CV — saves tokens)

---

## UI Layout

### Main View (Default)
```
┌─────────────────────────────────────────────────────────┐
│  [🎤 Listening]  [⚙ Settings]  [📋 History]  [◻ Overlay] │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   CV PANEL           │   TELEPROMPTER                   │
│                      │                                  │
│   📄 resume.pdf      │   ┌──────────────────────────┐   │
│   ──────────────     │   │                          │   │
│   ▸ Summary          │   │   In my role at Acme     │   │
│   ▸ Experience       │   │   Corp, I led a team     │   │
│   ▸ Skills           │   │   of five engineers...   │   │
│   ▸ Education        │   │                          │   │
│                      │   │   ▊ (cursor)             │   │
│                      │   └──────────────────────────┘   │
│                      │                                  │
│                      │   Font: [━━━●━━] 28px            │
│                      │   Opacity: [━━━━●] 90%           │
├──────────────────────┴──────────────────────────────────┤
│  TRANSCRIPT                                             │
│  "So tell me about your experience with React..."  [?]  │
│  "And how did you handle team conflicts?"           [?]  │
└─────────────────────────────────────────────────────────┘
```

### Overlay Mode (Compact)
```
┌──────────────────────────────┐
│ ● In my role at Acme Corp,  │
│   I led a team of five      │
│   engineers building the... │
│          [Font ▾] [✕ Close]  │
└──────────────────────────────┘
```
Small, semi-transparent, positioned top-center. Draggable.

---

## Security Considerations

- **API keys never leave client → serverless function path.** No keys stored server-side.
- **localStorage for key persistence** — user accepts browser-local risk.
- **CV data**: processed in serverless function, returned to client, not stored on server.
- **CORS**: Netlify functions same-origin by default — no CORS issues.
- **No auth needed** — single-user tool, all data ephemeral.

---

## Deployment Config

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This gives clean `/api/cv-parse`, `/api/ask`, `/api/providers` URLs.
