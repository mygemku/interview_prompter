import { useApp } from '../../context/AppContext';

export function SessionHistory() {
  const { state } = useApp();

  const exportSession = () => {
    const lines = state.qaPairs.map(
      (qa, i) => `## Q${i + 1}: ${qa.question}\n\n${qa.answer}\n\n---\n`
    );
    const content = `# Interview Session — ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state.qaPairs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        No Q&A pairs yet. Start listening and ask questions.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">
          Session History ({state.qaPairs.length} Q&A)
        </h3>
        <button
          onClick={exportSession}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          📥 Export
        </button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {state.qaPairs.map((qa, i) => (
          <div key={qa.id} className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-blue-400 font-medium mb-1">Q{i + 1}: {qa.question}</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-3">{qa.answer}</p>
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              <span>{qa.provider}</span>
              <span>·</span>
              <span>{qa.answerStyle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
