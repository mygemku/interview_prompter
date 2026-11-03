# Phase 3 — Project Setup & Configuration

## Scaffolding

- Vite 8.3.5 + React 19 + TypeScript 7.0 (scaffolded via `create-vite react-ts`)
- Tailwind CSS 4.3 via `@tailwindcss/vite` plugin
- Project directory: `D:\Project\interview_prompter\`

## Dependencies Installed

### Production
| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `tailwindcss`, `@tailwindcss/vite` | Styling |
| `@google/generative-ai` | Gemini API |
| `openai` | OpenAI API |
| `@anthropic-ai/sdk` | Claude API |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `@netlify/functions` | Serverless function types |

### Dev
| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `vite`, `@vitejs/plugin-react` | Build tool |
| `netlify-cli` | Local dev with functions |
| `oxlint` | Linting |
| `@types/pdf-parse` | PDF parse types |

## Project Structure Created

```
interview_prompter/
├── src/
│   ├── context/          # AppContext + types
│   ├── hooks/            # useSpeechRecognition, useQuestionDetection
│   ├── lib/              # question-heuristics, prompt-builder, cv-client, llm-client
│   ├── components/
│   │   ├── cv/           # CvUploader, CvPreview
│   │   ├── transcription/# MicControls, TranscriptPanel
│   │   ├── prompter/     # TeleprompterDisplay, PrompterControls
│   │   ├── settings/     # SettingsPanel
│   │   └── session/      # SessionHistory
│   ├── App.tsx           # Main layout
│   ├── main.tsx          # Entry point with AppProvider
│   └── index.css         # Tailwind import + dark scrollbar
├── netlify/functions/    # cv-parse, ask, providers
├── netlify.toml          # Build + function config + /api/* redirect
├── vite.config.ts        # React + Tailwind + dev proxy to Netlify functions
└── .env.example
```

## Configuration

- **Vite**: proxy `/api/*` → `localhost:8888/.netlify/functions/` for local dev
- **Netlify**: esbuild bundler for functions, `/api/*` redirect for production
- **TypeScript**: `tsconfig.node.json` includes `netlify/` directory
- **Dev commands**: `npm run dev` (Vite only), `npm run dev:netlify` (full stack)

## Verification

### TypeScript
```
> npx tsc -b --noEmit
(exit code 0, no errors)
```

### Production Build
```
> npm run build
vite v8.3.5 building client environment for production...
✓ 31 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-BcYWxo8w.css   20.51 kB │ gzip:  4.75 kB
dist/assets/index-BFq7p000.js   240.71 kB │ gzip: 74.81 kB
✓ built in 373ms
```

### Dev Server
```
> npm run dev
VITE v8.3.5 ready in 746 ms
Local: http://localhost:5173/
HTTP 200 OK on smoke test
```

### Browser Verification
- App renders with dark theme
- Header: mic controls, history button, settings button, "Set API key" warning
- Left panel: CV upload drop zone
- Center: "Ready to prompt" placeholder with teleprompter controls
- Bottom: live transcript area
- Settings modal: 3 AI providers with API key inputs + model selectors
- All interactive elements responsive
