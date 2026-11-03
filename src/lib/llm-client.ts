import type { AnswerStyle, CvSection, LlmProvider } from '../context/types';

interface AskParams {
  question: string;
  cvSections: CvSection[];
  provider: LlmProvider;
  apiKey: string;
  model: string;
  answerStyle: AnswerStyle;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function streamAnswer(params: AskParams): AbortController {
  const controller = new AbortController();

  fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: params.question,
      cvSections: params.cvSections,
      provider: params.provider,
      apiKey: params.apiKey,
      model: params.model,
      answerStyle: params.answerStyle,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.text();
        params.onError(err);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        params.onError('No response stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) params.onChunk(data.chunk);
            if (data.done) params.onDone();
            if (data.error) params.onError(data.error);
          } catch { /* skip malformed lines */ }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.chunk) params.onChunk(data.chunk);
          if (data.done) params.onDone();
        } catch { /* skip */ }
      }

      params.onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        params.onError(err.message);
      }
    });

  return controller;
}
