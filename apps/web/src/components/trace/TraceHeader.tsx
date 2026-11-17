'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
  GitCompare
} from 'lucide-react';

interface TraceHeaderProps {
  run: any;
  isReplayMode: boolean;
  onToggleReplay: () => void;
}

export const TraceHeader: React.FC<TraceHeaderProps> = ({ run, isReplayMode, onToggleReplay }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(run.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = run.status === 'running';
  const isCompleted = run.status === 'completed';
  const isFailed = run.status === 'failed';

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/runs/${run.id}/export`;

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-lg p-4 space-y-3 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white flex items-center space-x-1 text-zinc-400">
              <ArrowLeft className="h-3 w-3" />
              <span>Studio</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">Run ID:</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center space-x-1 text-zinc-200 hover:text-white bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a] text-[11px]"
              title="Copy Run ID"
            >
              <span>{run.id}</span>
              {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 text-zinc-500" />}
            </button>
          </div>

          <h1 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
            <span>{run.task_label || 'Execution Run'}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
              isRunning
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isFailed
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRunning ? 'bg-blue-400' : isCompleted ? 'bg-emerald-400' : isFailed ? 'bg-rose-400' : 'bg-zinc-400'
              }`}
            ></span>
            <span>{run.status}</span>
          </span>

          {/* Replay Switch */}
          <button
            onClick={onToggleReplay}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 border transition-all ${
              isReplayMode
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-[#18181b] text-zinc-300 border-[#27272a] hover:border-zinc-500'
            }`}
          >
            <RotateCcw className="h-3 w-3 text-indigo-400" />
            <span>{isReplayMode ? 'Exit Replay' : 'Replay Trace'}</span>
          </button>

          {/* Export */}
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 bg-[#18181b] text-zinc-300 border border-[#27272a] hover:border-zinc-500 hover:text-white"
          >
            <Download className="h-3 w-3 text-zinc-400" />
            <span>Export</span>
          </a>

          <Link
            href={`/compare?left=${run.id}`}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 bg-[#18181b] text-zinc-300 border border-[#27272a] hover:border-zinc-500 hover:text-white"
          >
            <GitCompare className="h-3 w-3 text-zinc-400" />
            <span>Compare</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
