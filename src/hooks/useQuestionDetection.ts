import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { isLikelyQuestion, extractKeywords } from '../lib/question-heuristics';
import { selectRelevantSections } from '../lib/prompt-builder';
import { streamAnswer } from '../lib/llm-client';

/**
 * Watches finalized transcript segments.
 * When silence exceeds threshold after a question-like segment, triggers LLM.
 */
export function useQuestionDetection() {
  const { state, dispatch } = useApp();
  const lastProcessedRef = useRef<string | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processQuestion = useCallback(
    (questionText: string) => {
      if (!state.cv || !questionText.trim()) return;

      const { settings, cv } = state;
      const providerConfig = settings.providers[settings.activeProvider];
      if (!providerConfig.apiKey) return;

      const keywords = extractKeywords(questionText);
      const relevant = selectRelevantSections(cv.sections, keywords);
      const qaId = `qa-${Date.now()}`;

      dispatch({
        type: 'ADD_QA',
        payload: {
          id: qaId,
          question: questionText,
          detectedAt: Date.now(),
          answer: '',
          isStreaming: true,
          provider: settings.activeProvider,
          answerStyle: settings.answerStyle,
          relevantSections: relevant.map((s) => s.id),
        },
      });

      // Cancel previous stream
      abortRef.current?.abort();

      abortRef.current = streamAnswer({
        question: questionText,
        cvSections: relevant,
        provider: providerConfig.provider,
        apiKey: providerConfig.apiKey,
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
    [state, dispatch],
  );

  useEffect(() => {
    const finalSegments = state.transcript.filter((s) => s.isFinal);
    if (finalSegments.length === 0) return;

    const latest = finalSegments[finalSegments.length - 1];
    if (latest.id === lastProcessedRef.current) return;

    if (isLikelyQuestion(latest.text)) {
      // Wait for silence threshold before processing
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        lastProcessedRef.current = latest.id;
        processQuestion(latest.text);
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
