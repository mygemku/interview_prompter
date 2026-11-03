import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { LlmProvider, AnswerStyle } from '../../context/types';

export function SettingsPanel({
  onClose,
  serverKeys = {},
}: {
  onClose: () => void;
  serverKeys?: Record<string, boolean>;
}) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'provider' | 'style'>('provider');

  const providers: { id: LlmProvider; name: string; models: string[] }[] = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
    },
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o'] },
    { id: 'claude', name: 'Anthropic Claude', models: ['claude-sonnet-4-20250514', 'claude-haiku-35-20241022'] },
  ];

  const styles: { id: AnswerStyle; name: string; desc: string }[] = [
    { id: 'first-person', name: 'First Person', desc: 'Natural spoken answers using "I" statements' },
    { id: 'bullet-points', name: 'Bullet Points', desc: 'Concise bullet-point talking points' },
    { id: 'concise-notes', name: 'Concise Notes', desc: 'Structured outline with key details' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'provider' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          >
            AI Provider
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'style' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          >
            Answer Style
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'provider' && (
            <>
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    state.settings.activeProvider === p.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { activeProvider: p.id } })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex items-center gap-2">
                      {serverKeys[p.id] && (
                        <span className="text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                          ✓ Netlify Key Active
                        </span>
                      )}
                      {state.settings.activeProvider === p.id && (
                        <span className="text-xs text-blue-400 font-semibold">Active</span>
                      )}
                    </div>
                  </div>

                  <input
                    type="password"
                    placeholder={
                      serverKeys[p.id]
                        ? 'Configured in Netlify env (Optional to override)'
                        : 'API Key (or set in Netlify env)'
                    }
                    value={state.settings.providers[p.id].apiKey}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const updated = { ...state.settings.providers };
                      updated[p.id] = { ...updated[p.id], apiKey: e.target.value };
                      dispatch({ type: 'UPDATE_SETTINGS', payload: { providers: updated } });
                    }}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 mb-2"
                  />

                  <select
                    value={state.settings.providers[p.id].model}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const updated = { ...state.settings.providers };
                      updated[p.id] = { ...updated[p.id], model: e.target.value };
                      dispatch({ type: 'UPDATE_SETTINGS', payload: { providers: updated } });
                    }}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  >
                    {p.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              ))}
            </>
          )}

          {activeTab === 'style' && (
            <>
              {styles.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    state.settings.answerStyle === s.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { answerStyle: s.id } })}
                >
                  <span className="font-medium text-sm">{s.name}</span>
                  <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
