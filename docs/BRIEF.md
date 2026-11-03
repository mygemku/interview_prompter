# Interview Prompter — brief

Real-time interview teleprompter web app. Captures interviewer questions via
live speech-to-text, matches against uploaded CV, generates AI-powered answer
suggestions (Gemini primary, OpenAI/Claude optional), and displays them in a
discreet teleprompter overlay. Built with React + Node.js, optimized for
video-call interviews.

## Key decisions
- Web app (browser-based), runs in separate tab during video calls
- Web Speech API for transcription (free, zero-latency)
- Multi-provider AI: Gemini primary, switchable to OpenAI/Claude
- CV upload (PDF/DOCX), parsed server-side, stored in-session only
- Streaming answers via SSE with teleprompter-style display
- No persistent database for MVP — session-based state

## Status
Complete (Phases 1 through 7 executed and verified).
Ready for GitHub and Netlify deployment.
See `CHANGELOG.md` for history.
