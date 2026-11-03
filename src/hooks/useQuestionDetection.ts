import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { isLikelyQuestion, extractKeywords } from '../lib/question-heuristics';
import { selectRelevantSections } from '../lib/prompt-builder';
import { streamAnswer } from '../lib/llm-client';

/**
 * Watches finalized transcript segments.
 * Accumulates consecutive segments into a question buffer.
 * Fires LLM when silence exceeds threshold after question-like content.
 */
interface QuestionDetectionOptions {
  onQuestionTriggered?: (question: string) => void;
}

export function useQuestionDetection(options?: QuestionDetectionOptions) {
  const { state, dispatch } = useApp();
  const lastCheckedIndexRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingQuestionRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const optionsRef = useRef(options);

  // Keep refs fresh so timer callbacks don't use stale closures
  stateRef.current = state;
  optionsRef.current = options;

  const processQuestion = useCallback(
    (questionText: string) => {
      const cleanQuestion = questionText.trim();
      if (!cleanQuestion) return;

      const { settings, cv } = stateRef.current;
      const providerConfig = settings.providers[settings.activeProvider];

      const keywords = extractKeywords(cleanQuestion);
      const relevant = cv?.sections ? selectRelevantSections(cv.sections, keywords) : [];
      const qaId = `qa-${Date.now()}`;

      optionsRef.current?.onQuestionTriggered?.(cleanQuestion);

      dispatch({
        type: 'ADD_QA',
        payload: {
          id: qaId,
          question: cleanQuestion,
          detectedAt: Date.now(),
          answer: '',
          isStreaming: true,
          provider: settings.activeProvider,
          answerStyle: settings.answerStyle,
          relevantSections: relevant.map((s) => s.id),
        },
      });

      abortRef.current?.abort();

      abortRef.current = streamAnswer({
        question: cleanQuestion,
        cvSections: relevant,
        provider: providerConfig.provider,
        apiKey: providerConfig.apiKey || '',
        model: providerConfig.model,
        answerStyle: settings.answerStyle,
        onChunk: (chunk) => dispatch({ type: 'UPDATE_QA_ANSWER', payload: { id: qaId, chunk } }),
        onDone: () => dispatch({ type: 'FINISH_QA_STREAM', payload: { id: qaId } }),
        onError: (error) => {
          dispatch({ type: 'UPDATE_QA_ANSWER', payload: { id: qaId, chunk: `\n[Error: ${error}]` } });
          dispatch({ type: 'FINISH_QA_STREAM', payload: { id: qaId } });
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    const finalSegments = state.transcript.filter((s) => s.isFinal);
    if (finalSegments.length === 0) return;

    // Check all new final segments since last check, not just the latest
    const newSegments = finalSegments.slice(lastCheckedIndexRef.current);
    if (newSegments.length === 0) return;
    lastCheckedIndexRef.current = finalSegments.length;

    // Accumulate new text into question buffer
    for (const seg of newSegments) {
      if (isLikelyQuestion(seg.text)) {
        // Each question-like segment becomes the pending question
        // (later segments override earlier ones to capture the full question)
        pendingQuestionRef.current = seg.text;
      } else if (pendingQuestionRef.current) {
        // Non-question segment after a question — the question is complete,
        // but if the combined text reads as a longer question, merge
        const combined = `${pendingQuestionRef.current} ${seg.text}`;
        if (isLikelyQuestion(combined)) {
          pendingQuestionRef.current = combined;
        }
        // Otherwise leave pending as-is; silence timer will fire it
      }
    }

    // Reset silence timer whenever new segments arrive
    if (pendingQuestionRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const question = pendingQuestionRef.current;
        pendingQuestionRef.current = null;
        if (question) {
          processQuestion(question);
        }
      }, state.settings.silenceThresholdMs);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [state.transcript, state.settings.silenceThresholdMs, processQuestion]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { askQuestion: processQuestion };
}
