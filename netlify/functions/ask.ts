import type { Context } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

interface AskRequest {
  question: string;
  cvSections?: { type: string; title: string; content: string }[];
  provider: 'gemini' | 'openai' | 'claude';
  apiKey?: string;
  model: string;
  answerStyle: 'first-person' | 'bullet-points' | 'concise-notes';
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  'first-person': 'Answer in first person as if the candidate is speaking naturally. Use "I" statements. Keep answers 2-4 sentences.',
  'bullet-points': 'Provide 3-5 concise bullet points the candidate can use as talking points.',
  'concise-notes': 'Give a brief, structured outline with key points and specific details to mention.',
};

function buildSystemPrompt(answerStyle: string, cvSections?: AskRequest['cvSections']): string {
  const hasCv = cvSections && cvSections.length > 0;
  const cvText = hasCv
    ? cvSections.map((s) => `[${s.type.toUpperCase()}: ${s.title}]\n${s.content}`).join('\n\n')
    : 'No candidate CV uploaded yet. Answer based on general industry best practices, modern software engineering concepts, and the STAR framework (Situation, Task, Action, Result).';

  return `You are an interview answer assistant. The candidate has provided their CV/resume below (if uploaded).
Your role is to help them answer interview questions effectively and concisely.

ANSWER STYLE: ${STYLE_INSTRUCTIONS[answerStyle] || STYLE_INSTRUCTIONS['first-person']}

RULES:
- When CV info is present, prioritize facts and achievements from the CV. Do not fabricate experiences.
- When no CV is present, provide confident, structured talking points using standard industry best practices.
- Sound natural and confident, not robotic.
- Highlight specific metrics, technologies, and achievements.
- Be concise — this will be read as a teleprompter during a live interview.

CANDIDATE CONTEXT:
---
${cvText}
---`;
}

function sseMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function streamGemini(body: AskRequest, apiKey: string): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const systemPrompt = buildSystemPrompt(body.answerStyle, body.cvSections);

  const selectedModel = body.model || 'gemini-3.5-flash-lite';
  const candidateModels = [
    selectedModel,
    'gemini-3.5-flash-lite',
  ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream({
        systemInstruction: systemPrompt,
        contents: [{ role: 'user', parts: [{ text: body.question }] }],
      });

      return new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(sseMessage({ chunk: text })));
              }
            }
            controller.enqueue(encoder.encode(sseMessage({ done: true })));
          } catch (err) {
            controller.enqueue(encoder.encode(sseMessage({ error: String(err) })));
          }
          controller.close();
        },
      });
    } catch (err) {
      console.warn(`Gemini model ${modelName} failed.`, err);
      lastError = err;
    }
  }

  throw lastError;
}

async function streamOpenAI(body: AskRequest, apiKey: string): Promise<ReadableStream> {
  const openai = new OpenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(body.answerStyle, body.cvSections);

  const stream = await openai.chat.completions.create({
    model: body.model,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: body.question },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(sseMessage({ chunk: text })));
          }
        }
        controller.enqueue(encoder.encode(sseMessage({ done: true })));
      } catch (err) {
        controller.enqueue(encoder.encode(sseMessage({ error: String(err) })));
      }
      controller.close();
    },
  });
}

async function streamClaude(body: AskRequest, apiKey: string): Promise<ReadableStream> {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(body.answerStyle, body.cvSections);

  const stream = anthropic.messages.stream({
    model: body.model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: body.question }],
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(sseMessage({ chunk: event.delta.text })));
          }
        }
        controller.enqueue(encoder.encode(sseMessage({ done: true })));
      } catch (err) {
        controller.enqueue(encoder.encode(sseMessage({ error: String(err) })));
      }
      controller.close();
    },
  });
}

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json() as AskRequest;

    if (!body.question || !body.provider) {
      return new Response('Missing required fields: question and provider', { status: 400 });
    }

    const serverKey =
      body.provider === 'gemini'
        ? process.env.GEMINI_API_KEY
        : body.provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : body.provider === 'claude'
        ? process.env.ANTHROPIC_API_KEY
        : undefined;

    const effectiveApiKey = body.apiKey?.trim() || serverKey?.trim();

    if (!effectiveApiKey) {
      return new Response(
        `Missing API key for ${body.provider}. Please configure ${body.provider.toUpperCase()}_API_KEY on Netlify or enter your key in Settings.`,
        { status: 400 }
      );
    }

    let stream: ReadableStream;
    switch (body.provider) {
      case 'gemini':
        stream = await streamGemini(body, effectiveApiKey);
        break;
      case 'openai':
        stream = await streamOpenAI(body, effectiveApiKey);
        break;
      case 'claude':
        stream = await streamClaude(body, effectiveApiKey);
        break;
      default:
        return new Response(`Unknown provider: ${body.provider}`, { status: 400 });
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Ask error:', err);
    // Return error as SSE so the client can display it in the teleprompter
    const encoder = new TextEncoder();
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseMessage({ error: errorMsg })));
        controller.enqueue(encoder.encode(sseMessage({ done: true })));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
