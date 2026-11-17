'use client';

import React from 'react';
import {
  Coins,
  Cpu,
  Clock,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Zap
} from 'lucide-react';
import { formatCost, formatDuration, formatTokens } from '@/lib/formatters';

interface MetricsStripProps {
  metrics?: any;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics }) => {
  const m = metrics || {
    total_tokens: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    estimated_cost_usd: 0,
    duration_ms: 0,
    tool_time_ms: 0,
    model_calls: 0,
    tool_calls: 0,
    retries: 0,
    failures: 0
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
      {/* 1. Total Tokens */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>TOKENS</span>
          <Cpu className="h-3 w-3 text-indigo-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{formatTokens(m.total_tokens)}</div>
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
          {formatTokens(m.total_input_tokens)} in / {formatTokens(m.total_output_tokens)} out
        </div>
      </div>

      {/* 2. Estimated Cost */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>EST. COST</span>
          <Coins className="h-3 w-3 text-amber-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{formatCost(m.estimated_cost_usd)}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">standard tier</div>
      </div>

      {/* 3. Wall Time */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>WALL TIME</span>
          <Clock className="h-3 w-3 text-blue-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{formatDuration(m.duration_ms)}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">total execution</div>
      </div>

      {/* 4. Tool Time */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>TOOL TIME</span>
          <Wrench className="h-3 w-3 text-sky-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{formatDuration(m.tool_time_ms)}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">active tool spans</div>
      </div>

      {/* 5. LLM Calls */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>MODEL CALLS</span>
          <Zap className="h-3 w-3 text-indigo-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{m.model_calls}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">gateway requests</div>
      </div>

      {/* 6. Tool Calls */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>TOOL CALLS</span>
          <Wrench className="h-3 w-3 text-sky-400" />
        </div>
        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{m.tool_calls}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">invocations</div>
      </div>

      {/* 7. Retries */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>RETRIES</span>
          <RotateCcw className="h-3 w-3 text-amber-400" />
        </div>
        <div className="text-sm font-semibold mt-1 tabular-nums">
          <span className={m.retries > 0 ? 'text-amber-400' : 'text-white'}>{m.retries}</span>
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5">resilience actions</div>
      </div>

      {/* 8. Failures */}
      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
          <span>FAILURES</span>
          <AlertTriangle className="h-3 w-3 text-rose-400" />
        </div>
        <div className="text-sm font-semibold mt-1 tabular-nums">
          <span className={m.failures > 0 ? 'text-rose-400' : 'text-white'}>{m.failures}</span>
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5">intercepted errors</div>
      </div>
    </div>
  );
};
