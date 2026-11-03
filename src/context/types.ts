export type LlmProvider = 'gemini' | 'openai' | 'claude';
export type AnswerStyle = 'first-person' | 'bullet-points' | 'concise-notes';

export interface CvSection {
  id: string;
  type: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'other';
  title: string;
  content: string;
  keywords: string[];
}

export interface CvData {
  fileName: string;
  uploadedAt: string;
  rawText: string;
  sections: CvSection[];
}

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  isQuestion: boolean;
  confidence: number;
}

export interface QAPair {
  id: string;
  question: string;
  detectedAt: number;
  answer: string;
  isStreaming: boolean;
  provider: LlmProvider;
  answerStyle: AnswerStyle;
  relevantSections: string[];
}

export interface ProviderConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  activeProvider: LlmProvider;
  providers: Record<LlmProvider, ProviderConfig>;
  answerStyle: AnswerStyle;
  prompterFontSize: number;
  prompterOpacity: number;
  prompterTheme: 'dark' | 'light';
  prompterSpeed: number;
  overlayMode: boolean;
  silenceThresholdMs: number;
}

export interface AppState {
  cv: CvData | null;
  transcript: TranscriptSegment[];
  qaPairs: QAPair[];
  settings: AppSettings;
  isListening: boolean;
  isAutoScrolling: boolean;
  sessionStartedAt: string | null;
}

export type AppAction =
  | { type: 'SET_CV'; payload: CvData }
  | { type: 'CLEAR_CV' }
  | { type: 'ADD_TRANSCRIPT'; payload: TranscriptSegment }
  | { type: 'UPDATE_TRANSCRIPT'; payload: { id: string; text: string; isFinal: boolean } }
  | { type: 'MARK_QUESTION'; payload: { id: string } }
  | { type: 'ADD_QA'; payload: QAPair }
  | { type: 'UPDATE_QA_ANSWER'; payload: { id: string; chunk: string } }
  | { type: 'FINISH_QA_STREAM'; payload: { id: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_AUTO_SCROLL'; payload: boolean }
  | { type: 'TOGGLE_AUTO_SCROLL' }
  | { type: 'START_SESSION' }
  | { type: 'CLEAR_SESSION' };
