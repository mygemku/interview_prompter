import { useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition() {
  const { state, dispatch } = useApp();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const segmentIdRef = useRef(0);
  const sessionStartRef = useRef(0);

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    sessionStartRef.current = Date.now();
    const currentSegments = new Map<number, string>();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.[0]) continue;
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;

        if (!currentSegments.has(i)) {
          const id = `seg-${segmentIdRef.current++}`;
          currentSegments.set(i, id);
          dispatch({
            type: 'ADD_TRANSCRIPT',
            payload: {
              id,
              text: transcript,
              timestamp: Date.now() - sessionStartRef.current,
              isFinal,
              isQuestion: false,
              confidence: result[0].confidence ?? 0,
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_TRANSCRIPT',
            payload: { id: currentSegments.get(i)!, text: transcript, isFinal },
          });
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        dispatch({ type: 'SET_LISTENING', payload: false });
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (state.isListening) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    dispatch({ type: 'SET_LISTENING', payload: true });
    if (!state.sessionStartedAt) {
      dispatch({ type: 'START_SESSION' });
    }
  }, [isSupported, dispatch, state.isListening, state.sessionStartedAt]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    dispatch({ type: 'SET_LISTENING', payload: false });
  }, [dispatch]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening: state.isListening, startListening, stopListening };
}
