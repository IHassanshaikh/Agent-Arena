'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Gauge
} from 'lucide-react';

interface ReplayControlsProps {
  events: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  events,
  currentIndex,
  onIndexChange,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalEvents = events.length;

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.round(1000 / speed));
      timerRef.current = setInterval(() => {
        onIndexChange(Math.min(totalEvents - 1, currentIndex + 1));
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex, speed, totalEvents, onIndexChange]);

  // Auto-pause at end
  useEffect(() => {
    if (currentIndex >= totalEvents - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, totalEvents, isPlaying]);

  const togglePlay = () => {
    if (currentIndex >= totalEvents - 1) {
      onIndexChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    onIndexChange(Math.max(0, currentIndex - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    onIndexChange(Math.min(totalEvents - 1, currentIndex + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    onIndexChange(0);
  };

  return (
    <div className="bg-arena-card border border-purple-500/40 rounded-xl p-4 shadow-xl space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span className="font-bold text-purple-300 uppercase tracking-wider">Historical Execution Replay</span>
        </div>
        <div className="font-mono text-gray-400">
          Step <strong className="text-white">{currentIndex + 1}</strong> of <strong className="text-white">{totalEvents}</strong> events
        </div>
      </div>

      {/* Scrubber slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, totalEvents - 1)}
        value={currentIndex}
        onChange={(e) => {
          setIsPlaying(false);
          onIndexChange(parseInt(e.target.value, 10));
        }}
        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-arena-border rounded-lg"
      />

      {/* Buttons bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-arena-bg border border-arena-border text-gray-400 hover:text-white"
            title="Reset to beginning"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleStepBack}
            disabled={currentIndex <= 0}
            className="p-1.5 rounded-lg bg-arena-bg border border-arena-border text-gray-400 hover:text-white disabled:opacity-30"
            title="Step backward"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-500/20"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentIndex >= totalEvents - 1}
            className="p-1.5 rounded-lg bg-arena-bg border border-arena-border text-gray-400 hover:text-white disabled:opacity-30"
            title="Step forward"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Speed toggles */}
        <div className="flex items-center space-x-1">
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                speed === s
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-arena-border/40'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

