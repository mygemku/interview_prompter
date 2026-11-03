import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

interface OverlayModeProps {
  onClose: () => void;
}

export function OverlayMode({ onClose }: OverlayModeProps) {
  const { state, dispatch } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { prompterFontSize, prompterOpacity, prompterTheme, prompterSpeed } = state.settings;
  const latestQa = state.qaPairs[state.qaPairs.length - 1];
  const isPlaying = state.isAutoScrolling;
  const speed = prompterSpeed || 35;

  useEffect(() => {
    if (latestQa?.isStreaming) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [latestQa?.answer, latestQa?.isStreaming]);

  // Handle Play/Stop auto-scroll in overlay
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime: number | null = null;
    let accumulated = 0;

    if (scrollRef.current && scrollRef.current.clientHeight > 0) {
      const { scrollTop, clientHeight, scrollHeight } = scrollRef.current;
      if (scrollHeight > clientHeight && scrollTop + clientHeight >= scrollHeight - 8) {
        scrollRef.current.scrollTop = 0;
        accumulated = 0;
      } else {
        accumulated = scrollTop;
      }
    }

    const step = (time: number) => {
      if (!scrollRef.current || scrollRef.current.clientHeight === 0) return;

      const { clientHeight, scrollHeight } = scrollRef.current;
      if (scrollHeight <= clientHeight) {
        dispatch({ type: 'SET_AUTO_SCROLL', payload: false });
        return;
      }

      if (lastTime !== null) {
        const delta = (time - lastTime) / 1000;
        accumulated += speed * delta;
        scrollRef.current.scrollTop = accumulated;

        const atBottom =
          scrollRef.current.scrollTop + clientHeight >= scrollHeight - 2;

        if (atBottom) {
          dispatch({ type: 'SET_AUTO_SCROLL', payload: false });
          return;
        }
      }

      lastTime = time;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, speed, dispatch]);

  const bg = prompterTheme === 'dark' ? 'bg-gray-950/95' : 'bg-white/95';
  const text = prompterTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const border = prompterTheme === 'dark' ? 'border-gray-800' : 'border-gray-300';

  return (
    <div className="fixed inset-0 pointer-events-none z-40 p-4 flex justify-center items-start">
      <div
        className={`pointer-events-auto w-full max-w-2xl rounded-2xl border ${border} shadow-2xl backdrop-blur-md overflow-hidden transition-all flex flex-col max-h-[45vh] ${bg}`}
        style={{ opacity: prompterOpacity }}
      >
        {/* Compact Drag/Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/60 bg-gray-900/40 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-blue-400 font-bold">🎯 Overlay</span>
            {latestQa && (
              <span className="text-gray-400 truncate max-w-sm">
                Q: {latestQa.question}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {latestQa && (
              <button
                onClick={() => dispatch({ type: 'TOGGLE_AUTO_SCROLL' })}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50'
                }`}
                title="Toggle auto-scroll (Space)"
              >
                {isPlaying ? '⏹️ Stop' : '▶️ Play'}
              </button>
            )}
            <span className="text-gray-500">{prompterFontSize}px</span>
            <input
              type="range"
              min={16}
              max={44}
              value={prompterFontSize}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { prompterFontSize: Number(e.target.value) },
                })
              }
              className="w-16 accent-blue-500 cursor-pointer"
            />
            <Button size="sm" variant="ghost" onClick={onClose}>
              Exit Overlay
            </Button>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="p-4 overflow-y-auto leading-relaxed flex-1">
          {latestQa ? (
            <p
              className={`${text} font-medium whitespace-pre-wrap`}
              style={{ fontSize: `${prompterFontSize}px` }}
            >
              {latestQa.answer || 'Thinking...'}
              {latestQa.isStreaming && <span className="animate-pulse text-blue-400 ml-1">▊</span>}
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic text-center py-6">
              Listening for questions... answers appear right here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
