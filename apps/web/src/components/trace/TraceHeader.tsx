'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
  Cpu,
  Clock,
  GitCompare
} from 'lucide-react';
import { formatTimeAgo, formatDuration } from '@/lib/formatters';

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
    <div className="bg-arena-card border border-arena-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Link href="/" className="hover:text-blue-400 flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Runs Overview</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-gray-500">Run ID:</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center space-x-1 text-gray-300 hover:text-white font-mono bg-arena-bg px-2 py-0.5 rounded border border-arena-border text-[11px]"
              title="Click to copy run ID"
            >
              <span>{run.id}</span>
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-gray-500" />}
            </button>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{run.task_label || 'Agent Execution Run'}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              isRunning
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : isCompleted
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isFailed
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
            }`}
          >
            {isRunning && <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>}
            <span>{run.status}</span>
          </span>

          {/* Replay Switch */}
          <button
            onClick={onToggleReplay}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
              isReplayMode
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'bg-arena-bg text-gray-300 border-arena-border hover:border-gray-500'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 text-purple-400" />
            <span>{isReplayMode ? 'Exit Replay' : 'Replay Trace'}</span>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1.5">
            <a
              href={exportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-arena-bg border border-arena-border text-gray-300 hover:text-white hover:border-gray-500 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Download standard JSON trace"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </a>

            <a
              href={`${exportUrl}?format=otlp`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-arena-bg border border-arena-border text-purple-300 hover:text-white hover:border-purple-500/50 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Download OpenTelemetry (OTLP) compliant trace"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              <span>Export OTLP</span>
            </a>
          </div>
        </div>
      </div>

      {/* Sub-info banner */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-3 border-t border-arena-border/60 font-mono">
        <div className="flex items-center space-x-1.5">
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
          <span>Agent: <strong className="text-gray-200">{run.agent_id || 'reference-agent'}</strong></span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span>Started: <strong className="text-gray-200">{formatTimeAgo(run.started_at || run.created_at)}</strong></span>
        </div>
        <span>•</span>
        <div>
          Elapsed: <strong className="text-gray-200">{formatDuration(run.metrics?.duration_ms)}</strong>
        </div>
        {run.benchmark_id && (
          <>
            <span>•</span>
            <div>Benchmark: <span className="text-gray-300">{run.benchmark_id}</span></div>
          </>
        )}
      </div>
    </div>
  );
};

