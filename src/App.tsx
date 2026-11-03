import { useState, useEffect } from 'react';
import { useQuestionDetection } from './hooks/useQuestionDetection';
import { CvUploader } from './components/cv/CvUploader';
import { CvPreview } from './components/cv/CvPreview';
import { MicControls } from './components/transcription/MicControls';
import { TranscriptPanel } from './components/transcription/TranscriptPanel';
import { TeleprompterDisplay } from './components/prompter/TeleprompterDisplay';
import { PrompterControls } from './components/prompter/PrompterControls';
import { OverlayMode } from './components/prompter/OverlayMode';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { SessionHistory } from './components/session/SessionHistory';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { useApp } from './context/AppContext';

type MobileTab = 'prompter' | 'cv' | 'transcript' | 'history';

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('prompter');
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('server_keys_cache') || '{}');
    } catch {
      return {};
    }
  });
  const [checkingServerKeys, setCheckingServerKeys] = useState(() => {
    try {
      return !localStorage.getItem('server_keys_cache');
    } catch {
      return true;
    }
  });
  const { state, dispatch } = useApp();

  const { askQuestion } = useQuestionDetection({
    onQuestionTriggered: () => {
      setMobileTab('prompter');
      setShowHistory(false);
    },
  });

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          const map: Record<string, boolean> = {};
          data.providers.forEach((p: { id: string; hasServerKey?: boolean }) => {
            map[p.id] = Boolean(p.hasServerKey);
          });
          setServerKeys(map);
          try {
            localStorage.setItem('server_keys_cache', JSON.stringify(map));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setCheckingServerKeys(false);
      });
  }, []);

  const hasApiKey =
    Boolean(state.settings.providers[state.settings.activeProvider]?.apiKey) ||
    Boolean(serverKeys[state.settings.activeProvider]);

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] text-gray-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-gray-800/80 bg-gray-900/70 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-1.5 truncate">
            <span className="text-blue-400 text-base sm:text-lg">🎯</span>
            <span className="truncate">Interview Prompter</span>
          </h1>
          <Badge
            variant={hasApiKey ? 'green' : (checkingServerKeys ? 'blue' : 'yellow')}
            className="hidden sm:inline-flex"
          >
            {hasApiKey ? state.settings.activeProvider : (checkingServerKeys ? 'Checking...' : 'Key Needed')}
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <MicControls />

          {/* Desktop-only header buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsOverlayOpen(!isOverlayOpen)}
              title="Toggle compact floating prompter"
            >
              🗔 Overlay
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowHistory(!showHistory)}
            >
              📋 History {state.qaPairs.length > 0 && `(${state.qaPairs.length})`}
            </Button>
            {state.sessionStartedAt && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => dispatch({ type: 'CLEAR_SESSION' })}
              >
                Clear
              </Button>
            )}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️<span className="hidden sm:inline ml-1">Settings</span>
          </Button>
        </div>
      </header>

      {/* Mobile-only Navigation Bar */}
      <nav className="md:hidden flex border-b border-gray-800 bg-gray-950/80 shrink-0 text-xs">
        <button
          onClick={() => setMobileTab('prompter')}
          className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
            mobileTab === 'prompter'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🎯 Prompter
        </button>
        <button
          onClick={() => setMobileTab('cv')}
          className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
            mobileTab === 'cv'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📄 CV {state.cv && '✓'}
        </button>
        <button
          onClick={() => setMobileTab('transcript')}
          className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
            mobileTab === 'transcript'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💬 Audio
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
            mobileTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📋 {state.qaPairs.length > 0 ? `(${state.qaPairs.length})` : 'History'}
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Sidebar (CV) */}
        <aside className="hidden md:flex w-80 border-r border-gray-800/80 bg-gray-900/30 flex-col overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-gray-800/80 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resume / CV</h2>
            {state.cv && (
              <span className="text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <CvUploader />
            <CvPreview />
          </div>
        </aside>

        {/* Center Main: Prompter / History (Desktop) or Selected Tab (Mobile) */}
        <main className="flex-1 flex flex-col p-2 sm:p-4 min-w-0 bg-[#0c0d12] overflow-hidden">
          {/* Mobile Tab Views */}
          <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
            {mobileTab === 'prompter' && (
              <>
                <TeleprompterDisplay />
                <PrompterControls />
              </>
            )}

            {mobileTab === 'cv' && (
              <div className="flex-1 overflow-y-auto">
                <CvUploader />
                <CvPreview />
              </div>
            )}

            {mobileTab === 'transcript' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TranscriptPanel onAskQuestion={askQuestion} />
              </div>
            )}

            {mobileTab === 'history' && (
              <div className="flex-1 overflow-y-auto">
                <SessionHistory />
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex flex-1 flex-col min-h-0">
            {showHistory ? (
              <SessionHistory />
            ) : (
              <>
                <TeleprompterDisplay />
                <PrompterControls />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Desktop Bottom Transcript Bar */}
      <div className="hidden md:block border-t border-gray-800/80 shrink-0">
        <div className="px-4 py-1.5 border-b border-gray-800/60 bg-gray-900/50 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span>Interview Audio & Transcript</span>
            {state.isListening && <span className="text-green-400 text-[11px] animate-pulse">● Live</span>}
          </h2>
          <span className="text-[11px] text-gray-500">Auto-detects questions after 1.5s pause</span>
        </div>
        <TranscriptPanel onAskQuestion={askQuestion} />
      </div>

      {/* Modals & Overlays */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          serverKeys={serverKeys}
        />
      )}
      {isOverlayOpen && <OverlayMode onClose={() => setIsOverlayOpen(false)} />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
