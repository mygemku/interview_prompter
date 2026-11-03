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
  const pendingSegIdsRef = useRef<string[]>([]);
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
        pendingQuestionRef.current = seg.text;
        pendingSegIdsRef.current = [seg.id];
      } else if (pendingQuestionRef.current) {
        const combined = `${pendingQuestionRef.current} ${seg.text}`;
        if (isLikelyQuestion(combined)) {
          pendingQuestionRef.current = combined;
          pendingSegIdsRef.current.push(seg.id);
        }
      }
    }

    // Reset silence timer whenever new final segments arrive
    if (pendingQuestionRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const question = pendingQuestionRef.current;
        const segIds = [...pendingSegIdsRef.current];
        pendingQuestionRef.current = null;
        pendingSegIdsRef.current = [];
        silenceTimerRef.current = null;
        if (question) {
          for (const id of segIds) {
            dispatch({ type: 'MARK_QUESTION', payload: { id } });
          }
          processQuestion(question);
        }
      }, state.settings.silenceThresholdMs);
    }

    // No cleanup here — interim transcript updates must not cancel the
    // silence timer. Timer is managed explicitly above and on unmount.
  }, [state.transcript, state.settings.silenceThresholdMs, processQuestion]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return { askQuestion: processQuestion };
}
