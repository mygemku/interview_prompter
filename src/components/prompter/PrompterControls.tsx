import { useApp } from '../../context/AppContext';

export function PrompterControls() {
  const { state, dispatch } = useApp();
  const { prompterFontSize, prompterOpacity, prompterTheme, prompterSpeed } = state.settings;
  const isPlaying = state.isAutoScrolling;
  const hasContent = state.qaPairs.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2 text-xs text-gray-400">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>Font</span>
          <input
            type="range"
            min={16}
            max={48}
            value={prompterFontSize}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { prompterFontSize: Number(e.target.value) } })
            }
            className="w-16 sm:w-20 accent-blue-500"
          />
          <span className="w-7 text-right">{prompterFontSize}px</span>
        </label>

        <label className="hidden sm:flex items-center gap-1.5">
          <span>Opacity</span>
          <input
            type="range"
            min={30}
            max={100}
            value={Math.round(prompterOpacity * 100)}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { prompterOpacity: Number(e.target.value) / 100 } })
            }
            className="w-16 sm:w-20 accent-blue-500"
          />
          <span className="w-7 text-right">{Math.round(prompterOpacity * 100)}%</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_SCROLL' })}
          disabled={!hasContent}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50'
          }`}
          title="Toggle auto-scroll (Space)"
        >
          {isPlaying ? '⏹️ Stop' : '▶️ Play'}
        </button>

        <label className="hidden sm:flex items-center gap-1.5">
          <span>Speed</span>
          <input
            type="range"
            min={15}
            max={80}
            step={5}
            value={prompterSpeed || 35}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { prompterSpeed: Number(e.target.value) } })
            }
            className="w-16 accent-blue-500"
          />
          <span className="w-10 text-right">{prompterSpeed || 35}px/s</span>
        </label>
      </div>

      <button
        onClick={() =>
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { prompterTheme: prompterTheme === 'dark' ? 'light' : 'dark' },
          })
        }
        className="hover:text-white transition-colors cursor-pointer"
      >
        {prompterTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  );
}
