'use client';

import React from 'react';
import {
  Coins,
  Cpu,
  Clock,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Sparkles,
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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {/* 1. Total Tokens */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>TOKENS</span>
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{formatTokens(m.total_tokens)}</div>
        <div className="text-[10px] text-gray-500 font-mono truncate">
          {formatTokens(m.total_input_tokens)} in / {formatTokens(m.total_output_tokens)} out
        </div>
      </div>

      {/* 2. Estimated Cost */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>EST. COST</span>
          <Coins className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{formatCost(m.estimated_cost_usd)}</div>
        <div className="text-[10px] text-amber-500/80 font-mono">v2026.11.1</div>
      </div>

      {/* 3. Wall Time */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>DURATION</span>
          <Clock className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{formatDuration(m.duration_ms)}</div>
        <div className="text-[10px] text-gray-500 font-mono">wall-clock time</div>
      </div>

      {/* 4. Tool Time */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>TOOL TIME</span>
          <Wrench className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{formatDuration(m.tool_time_ms)}</div>
        <div className="text-[10px] text-gray-500 font-mono">active tool spans</div>
      </div>

      {/* 5. LLM Calls */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>MODEL CALLS</span>
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{m.model_calls}</div>
        <div className="text-[10px] text-gray-500 font-mono">gateway requests</div>
      </div>

      {/* 6. Tool Calls */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>TOOL CALLS</span>
          <Wrench className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">{m.tool_calls}</div>
        <div className="text-[10px] text-gray-500 font-mono">invocations</div>
      </div>

      {/* 7. Retries */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>RETRIES</span>
          <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">
          <span className={m.retries > 0 ? 'text-amber-400' : 'text-white'}>{m.retries}</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">resilience actions</div>
      </div>

      {/* 8. Failures */}
      <div className="p-3 rounded-lg bg-arena-card border border-arena-border">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
          <span>FAILURES</span>
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
        </div>
        <div className="text-base font-bold text-white mt-1 font-mono">
          <span className={m.failures > 0 ? 'text-rose-400' : 'text-white'}>{m.failures}</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">intercepted errors</div>
      </div>
    </div>
  );
};

