import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

interface TranscriptPanelProps {
  onAskQuestion?: (question: string) => void;
}

export function TranscriptPanel({ onAskQuestion }: TranscriptPanelProps) {
  const { state } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onAskQuestion?.(manualInput.trim());
    setManualInput('');
  };

  const sampleQuestions = [
    'Tell me about your experience with React.',
    'How did you reduce page latency in your past role?',
    'Describe how you handle team technical conflicts.',
  ];

  return (
    <div className="flex flex-col bg-gray-950/60">
      {/* Transcript Log */}
      <div ref={scrollRef} className="overflow-y-auto max-h-36 p-3 space-y-1 min-h-[4rem]">
        {state.transcript.length === 0 ? (
          <div className="text-gray-500 text-xs italic">
            {state.isListening
              ? '🎤 Listening to microphone... speak to transcribe'
              : 'Microphone inactive. Click "Start Listening" or type a question below.'}
          </div>
        ) : (
          state.transcript.map((seg) => (
            <p
              key={seg.id}
              className={`text-xs leading-relaxed ${
                seg.isFinal
                  ? seg.isQuestion
                    ? 'text-yellow-300 font-semibold'
                    : 'text-gray-300'
                  : 'text-gray-500 italic'
              }`}
            >
              <span className="text-gray-600 mr-2">[{Math.round(seg.timestamp / 1000)}s]</span>
              {seg.text}
              {seg.isQuestion && <span className="ml-1 text-yellow-400">❓</span>}
            </p>
          ))
        )}
      </div>

      {/* Manual Input Bar & Sample Prompts */}
      <div className="border-t border-gray-800/80 p-2.5 bg-gray-900/60 flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type an interview question manually or test..."
            className="flex-1 bg-gray-800/90 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <Button type="submit" size="sm" variant="primary" disabled={!manualInput.trim()}>
            Prompt AI
          </Button>
        </form>

        {/* Quick Sample Questions */}
        {state.cv && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-gray-400">
            <span className="text-gray-500 shrink-0">Try:</span>
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAskQuestion?.(q)}
                className="shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2 py-0.5 rounded border border-gray-700/60 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
