# Phase 4 — Backend Implementation & Verification

## Architecture Note

The project uses Netlify Functions (serverless) as the production backend,
with a lightweight Express adapter (`server.dev.ts`) for local development
due to Netlify CLI v27 + Node 24 compatibility.

Both local dev and production Netlify use the exact same function handler files
in `netlify/functions/`.

---

## Endpoints Implemented

### 1. `POST /api/cv-parse` (`netlify/functions/cv-parse.ts`)
- **Input**: `multipart/form-data` with `file` (PDF or DOCX)
- **Processing**:
  - PDF: parsed via `pdf-parse` v2 (`PDFParse` class)
  - DOCX: parsed via `mammoth.extractRawText`
  - Heuristic chunking: splits by section headers (caps, short lines, colons)
  - Section type classification (summary, experience, education, skills, projects, certifications)
  - Keyword extraction per section (stop words removed, top 20 keywords)
- **Output**: JSON with `fileName`, `uploadedAt`, `rawText`, `sections[]`

### 2. `POST /api/ask` (`netlify/functions/ask.ts`)
- **Input**: JSON with `question`, `cvSections[]`, `provider`, `apiKey`, `model`, `answerStyle`
- **Processing**:
  - Builds system prompt with CV context and answer style instructions
  - Routes to selected provider SDK:
    - `gemini`: `@google/generative-ai` `generateContentStream`
    - `openai`: `openai.chat.completions.create` with `stream: true`
    - `claude`: `@anthropic-ai/sdk` `messages.stream`
  - Encodes response as Server-Sent Events (`text/event-stream`)
  - Chunks: `data: {"chunk": "..."}\n\n`
  - Completion: `data: {"done": true}\n\n`
  - Error: `data: {"error": "..."}\n\n`
- **Output**: SSE stream

### 3. `GET /api/providers` (`netlify/functions/providers.ts`)
- **Input**: None
- **Output**: JSON list of supported providers, default models, and available model options

---

## Local Dev Server (`server.dev.ts`)

Adapts the Netlify Function handlers to Express routes:
- `POST /api/cv-parse` via `multer` memory storage → `Request` object
- `POST /api/ask` via JSON parser → `Request` object → SSE response
- `GET /api/providers` → direct handler call

Runs on `http://localhost:3001`. Vite proxies `/api/*` to it.

---

## Verification Results

### Route Tests

| Route | Method | Test Input | Expected | Result |
|-------|--------|------------|----------|--------|
| `/api/providers` | GET | None | 200 + provider list | ✓ Pass (Gemini, OpenAI, Claude) |
| `/api/ask` | POST | Invalid Gemini API key | SSE stream with error | ✓ Pass (400 API_KEY_INVALID handled gracefully) |
| `/api/ask` | POST | Missing fields | 400 Bad Request | ✓ Pass (Missing required fields) |
| `/api/cv-parse` | POST | Module import & types | Clean import | ✓ Pass (PDFParse class loaded) |

### Test Log (Gemini Invalid Key Test)
```
POST /api/ask
Body: { "question": "What is React?", "provider": "gemini", "apiKey": "invalid_key_test", ... }
Response: Error: [GoogleGenerativeAI Error]: [400 Bad Request] API key not valid.
Status: Handled via SSE error stream, server remained stable.
```

### TypeScript Validation
```
> npx tsc -b --noEmit
(exit code 0, 0 errors across frontend + functions + server.dev.ts)
```
