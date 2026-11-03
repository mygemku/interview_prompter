import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export function MicControls() {
  const { isSupported, isListening, micError, startListening, stopListening } = useSpeechRecognition();

  if (!isSupported) {
    return (
      <div className="text-amber-400 text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-xs text-center">
        ⚠️ Speech API not supported. Open in Chrome (Android/PC) or Safari (iPhone).
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all cursor-pointer
          ${isListening
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
      >
        <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
        <span>{isListening ? 'Stop Listening' : 'Start Listening'}</span>
      </button>

      {micError && (
        <div className="fixed top-14 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-red-950/90 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl shadow-2xl z-50 flex items-start gap-2">
          <span>⚠️</span>
          <span className="flex-1">{micError}</span>
        </div>
      )}
    </div>
  );
}
