import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export function MicControls() {
  const { isSupported, isListening, startListening, stopListening } = useSpeechRecognition();

  if (!isSupported) {
    return (
      <div className="text-red-400 text-xs px-3 py-1">
        Speech recognition not supported in this browser. Use Chrome.
      </div>
    );
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
        ${isListening
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'
          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
        }`}
    >
      <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
      {isListening ? 'Stop Listening' : 'Start Listening'}
    </button>
  );
}
