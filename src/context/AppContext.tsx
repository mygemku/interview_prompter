import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'gemini',
  providers: {
    gemini: { provider: 'gemini', apiKey: '', model: 'gemini-3.5-flash-lite' },
    openai: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    claude: { provider: 'claude', apiKey: '', model: 'claude-sonnet-4-20250514' },
  },
  answerStyle: 'first-person',
  prompterFontSize: 28,
  prompterOpacity: 0.9,
  prompterTheme: 'dark',
  prompterSpeed: 35,
  overlayMode: false,
  silenceThresholdMs: 1500,
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem('interview-prompter-settings');
    if (stored) {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      if (typeof parsed.prompterSpeed !== 'number') {
        parsed.prompterSpeed = 35;
      }
      // Migrate to user-preferred gemini-3.5-flash-lite
      if (
        parsed.providers?.gemini?.model === 'gemini-2.0-flash' ||
        parsed.providers?.gemini?.model === 'gemini-3.8-flash' ||
        !parsed.providers?.gemini?.model
      ) {
        parsed.providers.gemini.model = 'gemini-3.5-flash-lite';
      }
      return parsed;
    }
  } catch { /* use defaults */ }
  return DEFAULT_SETTINGS;
}

const INITIAL_STATE: AppState = {
  cv: null,
  transcript: [],
  qaPairs: [],
  settings: loadSettings(),
  isListening: false,
  isAutoScrolling: false,
  sessionStartedAt: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CV':
      return { ...state, cv: action.payload };
    case 'CLEAR_CV':
      return { ...state, cv: null };
    case 'ADD_TRANSCRIPT':
      return { ...state, transcript: [...state.transcript, action.payload] };
    case 'UPDATE_TRANSCRIPT':
      return {
        ...state,
        transcript: state.transcript.map((seg) =>
          seg.id === action.payload.id
            ? { ...seg, text: action.payload.text, isFinal: action.payload.isFinal }
            : seg
        ),
      };
    case 'MARK_QUESTION':
      return {
        ...state,
        transcript: state.transcript.map((seg) =>
          seg.id === action.payload.id ? { ...seg, isQuestion: true } : seg
        ),
      };
    case 'ADD_QA':
      return { ...state, qaPairs: [...state.qaPairs, action.payload] };
    case 'UPDATE_QA_ANSWER':
      return {
        ...state,
        qaPairs: state.qaPairs.map((qa) =>
          qa.id === action.payload.id
            ? { ...qa, answer: qa.answer + action.payload.chunk }
            : qa
        ),
      };
    case 'FINISH_QA_STREAM':
      return {
        ...state,
        qaPairs: state.qaPairs.map((qa) =>
          qa.id === action.payload.id ? { ...qa, isStreaming: false } : qa
        ),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_LISTENING':
      return { ...state, isListening: action.payload };
    case 'SET_AUTO_SCROLL':
      return { ...state, isAutoScrolling: action.payload };
    case 'TOGGLE_AUTO_SCROLL':
      return { ...state, isAutoScrolling: !state.isAutoScrolling };
    case 'START_SESSION':
      return { ...state, sessionStartedAt: new Date().toISOString(), transcript: [], qaPairs: [] };
    case 'CLEAR_SESSION':
      return { ...state, transcript: [], qaPairs: [], sessionStartedAt: null, isListening: false, isAutoScrolling: false };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('interview-prompter-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
