# Interview Prompter — changelog

Companion: `BRIEF.md` (what/why/status). One line per event, newest last.
- **2026-11-03** — Project created. Phase 1 started.
- **2026-11-03** — Phase 1 approved. English-only, configurable answer style, local-first + Netlify deploy later.
- **2026-11-03** — Phase 2 written. Netlify Functions backend, React+Vite frontend, SSE streaming, no DB.
- **2026-11-03** — Phase 2 approved. Starting Phase 3 setup.
- **2026-11-03** — Phase 3 complete. Scaffolding, all deps, full source structure, TypeScript clean, build passes, UI verified in browser.
- **2026-11-03** — Phase 3 approved. Starting Phase 4 backend implementation & testing.
- **2026-11-03** — Phase 4 complete. Netlify Functions implemented, Express dev adapter created, all routes tested (providers, ask with Gemini error handling, cv-parse).
- **2026-11-03** — Phase 4 approved. Starting Phase 5 frontend implementation & verification.
- **2026-11-03** — Phase 5 complete. Added OverlayMode, UI components, manual question input, sample CV, sample questions. Full E2E flow verified in browser.
- **2026-11-03** — Phase 5 approved. Starting Phase 6 testing & refinement.
- **2026-11-03** — Phase 6 complete. 17 unit tests passed with Vitest (heuristics, prompt builder, providers, components). TypeScript clean, oxlint clean, 0 high/critical security audit vulnerabilities.
- **2026-11-03** — Phase 6 approved. Starting Phase 7 deployment preparation.
- **2026-11-03** — Phase 7 complete. Dockerfile, docker-compose, GitHub Actions CI workflow, full README.md, and Netlify config finalized. Project ready for deployment.
- **2026-11-03** — Added mobile-first responsive layout (mobile tabs: Prompter, CV, Audio, History), host exposure (`0.0.0.0`) for phone use. All tests and build pass.
- **2026-11-03** — Migrated Gemini model from deprecated `gemini-2.0-flash` to `gemini-3.8-flash` (plus added 2.5-pro, 2.5-flash, 1.5-flash). Added auto-migration for existing localStorage settings.
- **2026-11-03** — Added auto-fallback model chain for Gemini: if primary model hits 503 (high demand) or 429, automatically attempts `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.5-pro`.
- **2026-11-03** — Switched Gemini model to `gemini-3.5-flash-lite` per user preference. Removed 2.5 and 1.5 models from fallback list.
- **2026-11-03** — Fixed Netlify server env key detection, continuous speech recognition loop, conversational speech heuristics, and mobile auto-switch to prompter tab.
