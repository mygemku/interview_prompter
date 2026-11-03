/**
 * Local dev server that mimics Netlify Functions.
 * Runs the same function handlers via Express.
 * Usage: npx tsx server.dev.ts
 */
import express from 'express';
import multer from 'multer';

// Import function handlers
import cvParseHandler from './netlify/functions/cv-parse.js';
import askHandler from './netlify/functions/ask.js';
import providersHandler from './netlify/functions/providers.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Adapt Netlify function handlers to Express
app.post('/api/cv-parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).send('No file uploaded');
      return;
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const request = new Request('http://localhost/api/cv-parse', {
      method: 'POST',
      body: formData,
    });

    const response = await cvParseHandler(request, {} as any);
    const body = await response.json();
    res.status(response.status).json(body);
  } catch (err) {
    console.error('cv-parse error:', err);
    res.status(500).send(String(err));
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const request = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const response = await askHandler(request, {} as any);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      res.status(500).send('No stream');
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    console.error('ask error:', err);
    res.status(500).send(String(err));
  }
});

app.get('/api/providers', async (_req, res) => {
  const response = await providersHandler();
  const body = await response.json();
  res.json(body);
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 API dev server running at http://0.0.0.0:${PORT}`);
  console.log(`  Routes:`);
  console.log(`    POST /api/cv-parse   — Upload and parse CV`);
  console.log(`    POST /api/ask        — Stream LLM answer`);
  console.log(`    GET  /api/providers  — List AI providers\n`);
});
