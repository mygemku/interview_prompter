import { useCallback, useRef, useEffect, useState } from 'react';
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
  const isListeningRef = useRef(false);
  const segmentIdRef = useRef(0);
  const sessionStartRef = useRef(0);
  const [micError, setMicError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setMicError('Web Speech API is not supported in this browser. Please use Chrome on Android/Desktop or Safari on iPhone.');
      return;
    }

    setMicError(null);

    // Explicitly request microphone permission if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: unknown) {
        console.warn('Microphone permission request error:', err);
        setMicError('Microphone permission denied. Click the lock/tune icon in the browser address bar to allow microphone access.');
        isListeningRef.current = false;
        dispatch({ type: 'SET_LISTENING', payload: false });
        return;
      }
    }

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
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission blocked. Please allow microphone in browser address bar.');
        isListeningRef.current = false;
        dispatch({ type: 'SET_LISTENING', payload: false });
      } else if (event.error === 'service-not-allowed') {
        setMicError('Speech recognition service unavailable on this browser or platform.');
        isListeningRef.current = false;
        dispatch({ type: 'SET_LISTENING', payload: false });
      } else if (event.error === 'audio-capture') {
        setMicError('No microphone detected. Connect a mic and refresh.');
        isListeningRef.current = false;
        dispatch({ type: 'SET_LISTENING', payload: false });
      } else if (event.error === 'network') {
        setMicError('Speech recognition network error. Reconnecting...');
      }
    };

    recognition.onend = () => {
      // Chrome automatically ends after brief pauses; auto-restart if listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setTimeout(() => {
            if (isListeningRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 300);
        }
      }
    };

    try {
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      recognition.start();
      dispatch({ type: 'SET_LISTENING', payload: true });
      if (!state.sessionStartedAt) {
        dispatch({ type: 'START_SESSION' });
      }
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setMicError('Failed to start microphone. Please refresh and try again.');
      isListeningRef.current = false;
      dispatch({ type: 'SET_LISTENING', payload: false });
    }
  }, [isSupported, dispatch, state.sessionStartedAt]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    dispatch({ type: 'SET_LISTENING', payload: false });
  }, [dispatch]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  return { isSupported, isListening: state.isListening, micError, startListening, stopListening };
}
