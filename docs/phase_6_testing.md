# Phase 6 — Testing & Refinement

## Test Suite Execution

Vitest v5.1.0 configured with `jsdom` and `@testing-library/react`.

```
npm test

 Test Files  4 passed (4)
      Tests  17 passed (17)
   Start at  10:47:41
   Duration  3.67s
```

### Test Breakdown

| File | Tests | Coverage Area | Status |
|------|-------|---------------|--------|
| `src/test/question-heuristics.test.ts` | 6 | Question mark detection, question word detection, statements rejection, keyword extraction | ✓ Pass |
| `src/test/prompt-builder.test.ts` | 6 | Prompt formatting per style, RAG-lite section ranking by keyword, fallback handling | ✓ Pass |
| `src/test/api-routes.test.ts` | 1 | Serverless function handler for providers endpoint, default models | ✓ Pass |
| `src/test/components.test.tsx` | 4 | Button rendering, variants, disabled states, Badge rendering | ✓ Pass |

---

## Code Quality & Linting

### Oxlint
```
npx oxlint
1 warning: Fast refresh component export in AppContext.tsx (non-critical)
0 errors
```

### TypeScript Strictness
```
npx tsc -b --noEmit
0 errors across all 34 source and function files
```

### Production Build
```
npm run build
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-CgMxJ1D-.css   28.62 kB │ gzip:  5.75 kB
dist/assets/index-B3gd6ywt.js   249.62 kB │ gzip: 77.35 kB
✓ built in 363ms
```

---

## Security Audit

- **Audit Command**: `npm audit --audit-level=high`
- **Result**: **0 High, 0 Critical** vulnerabilities in runtime code.
- **Notes**: 17 moderate alerts detected strictly inside `netlify-cli` build tooling (dev-only; not included in production bundle).
- **Client-side API Key Security**:
  - Keys stored exclusively in client-side `localStorage`
  - Transmitted directly over TLS to serverless functions in the request body
  - Never logged to console, never written to disk or database server-side
- **Input Validation**:
  - `/api/cv-parse` rejects non-PDF/non-DOCX file formats
  - `/api/ask` validates presence of question, apiKey, and provider before initiating stream
