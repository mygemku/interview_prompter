import { useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

export function TeleprompterDisplay() {
  const { state, dispatch } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { prompterFontSize, prompterOpacity, prompterTheme, prompterSpeed } = state.settings;
  const isPlaying = state.isAutoScrolling;
  const speed = prompterSpeed || 35;

  const latestQa = state.qaPairs[state.qaPairs.length - 1];

  // Auto-scroll to bottom while LLM is streaming new tokens
  useEffect(() => {
    if (latestQa?.isStreaming) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [latestQa?.answer, latestQa?.isStreaming]);

  // Handle Play/Stop auto-scroll animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime: number | null = null;
    let accumulated = 0;

    // If starting play while already near bottom, jump to top first
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
      // If content cannot be scrolled, do not auto-scroll
      if (scrollHeight <= clientHeight) {
        dispatch({ type: 'SET_AUTO_SCROLL', payload: false });
        return;
      }

      if (lastTime !== null) {
        const delta = (time - lastTime) / 1000;
        accumulated += speed * delta;
        scrollRef.current.scrollTop = accumulated;

        // Stop auto-scroll when reaching the bottom
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

  // Spacebar to toggle Play/Stop, Escape to Stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_AUTO_SCROLL' });
      } else if (e.code === 'Escape' && isPlaying) {
        e.preventDefault();
        dispatch({ type: 'SET_AUTO_SCROLL', payload: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, dispatch]);

  const handleScrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleManualInteraction = () => {
    // If auto-scrolling, pause when user manually scrolls or touches
    if (isPlaying) {
      dispatch({ type: 'SET_AUTO_SCROLL', payload: false });
    }
  };

  const bg = prompterTheme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = prompterTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';

  if (!latestQa) {
    return (
      <div className={`flex-1 flex items-center justify-center ${bg} rounded-xl`} style={{ opacity: prompterOpacity }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-lg">Ready to prompt</p>
          <p className="text-sm mt-1">Upload CV, start listening, and ask away</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col ${bg} rounded-xl overflow-hidden`}
      style={{ opacity: prompterOpacity }}
    >
      {/* Question header */}
      <div className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500/10 border-b border-blue-500/20">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Question</p>
        <p className="text-blue-200 text-sm mt-0.5 sm:mt-1 font-medium">{latestQa.question}</p>
      </div>

      {/* Answer body */}
      <div
        ref={scrollRef}
        onWheel={handleManualInteraction}
        onTouchStart={handleManualInteraction}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4"
      >
        <p
          className={`${text} leading-relaxed whitespace-pre-wrap`}
          style={{ fontSize: `${prompterFontSize}px` }}
        >
          {latestQa.answer}
          {latestQa.isStreaming && <span className="animate-pulse text-blue-400 ml-1">▊</span>}
        </p>
      </div>

      {/* Playback & Status bar */}
      <div className="px-3 sm:px-6 py-2 border-t border-gray-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Play / Stop Button */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_AUTO_SCROLL' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            }`}
            title={isPlaying ? 'Stop auto-scroll (Space)' : 'Play auto-scroll (Space)'}
          >
            {isPlaying ? (
              <>
                <span>⏹️</span>
                <span>Stop Scroll</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Play Scroll</span>
              </>
            )}
          </button>

          {/* Rewind to Top Button */}
          <button
            onClick={handleScrollToTop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer text-xs"
            title="Rewind to top"
          >
            <span>⏮️</span>
            <span className="hidden sm:inline">Top</span>
          </button>

          {/* Speed Indicator / Adjust */}
          <div className="flex items-center gap-1.5 text-gray-400 bg-gray-800/40 px-2 py-1 rounded-lg border border-gray-800">
            <span className="hidden sm:inline">Speed</span>
            <input
              type="range"
              min={15}
              max={80}
              step={5}
              value={speed}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { prompterSpeed: Number(e.target.value) },
                })
              }
              className="w-14 sm:w-16 accent-blue-500 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-gray-300">{speed}px/s</span>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex items-center gap-3 text-gray-500">
          <span className="hidden sm:inline">{latestQa.provider} · {latestQa.answerStyle}</span>
          {latestQa.isStreaming && <span className="text-green-400 font-medium">● Streaming</span>}
          {isPlaying && <span className="text-blue-400 font-medium animate-pulse">● Auto-Scrolling</span>}
        </div>
      </div>
    </div>
  );
}
