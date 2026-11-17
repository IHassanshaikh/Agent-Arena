'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Terminal,
  Cpu,
  Zap,
  Wrench,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  Clock,
  Coins
} from 'lucide-react';

// 1. Task Prompt Input Node (Trigger)
export const TaskPromptNode = ({ data }: { data: any }) => {
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#3b82f6] !w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5"
      />
      <div
        className={`w-64 rounded-lg border bg-[#111114] p-3 shadow-md transition-all select-none ${
          data.active
            ? 'border-blue-500 ring-1 ring-blue-500/50 bg-[#141724]'
            : 'border-[#27272a] hover:border-[#3f3f46]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded bg-blue-500/10 text-blue-400">
              <Terminal className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Trigger
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#18181b] text-zinc-400 border border-[#27272a]">
            INPUT
          </span>
        </div>

        <div className="text-xs font-medium text-zinc-100 line-clamp-2 leading-snug" title={data.label}>
          {data.label || 'User Task Request'}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#1e1e22] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>SOURCE: CLI / WEB</span>
          <span className="text-zinc-400 font-semibold">INITIAL</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#3b82f6] !w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5"
      />
    </div>
  );
};

// 2. Agent Planner Node (Reasoning Engine)
export const AgentPlannerNode = ({ data }: { data: any }) => {
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#10b981] !w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5"
      />
      <div
        className={`w-64 rounded-lg border bg-[#111114] p-3 shadow-md transition-all select-none ${
          data.active
            ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-[#121c17]'
            : 'border-[#27272a] hover:border-[#3f3f46]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <Cpu className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Agent Planner
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            AUTONOMOUS
          </span>
        </div>

        <div className="text-xs font-semibold text-zinc-100 truncate" title={data.label}>
          {data.label || 'ReAct Engine'}
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
          {data.sublabel || 'Task decomposition & plan'}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#1e1e22] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>POLICY: RESILIENT</span>
          <span className="text-emerald-400 font-semibold">PLAN ACTIVE</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#10b981] !w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5"
      />
    </div>
  );
};

// 3. Model Gateway Node (LLM Inference)
export const ModelGatewayNode = ({ data }: { data: any }) => {
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#6366f1] !w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5"
      />
      <div
        className={`w-64 rounded-lg border bg-[#111114] p-3 shadow-md transition-all select-none ${
          data.active
            ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-[#161524]'
            : 'border-[#27272a] hover:border-[#3f3f46]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">
              <Zap className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Model Gateway
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            LLM
          </span>
        </div>

        <div className="text-xs font-semibold text-zinc-100 truncate" title={data.label}>
          {data.label || 'gemini-2.5-flash'}
        </div>
        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
          {data.sublabel || 'Token stream'}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#1e1e22] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>STREAM: ACTIVE</span>
          <span className="text-indigo-400 font-semibold">200 OK</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#6366f1] !w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5"
      />
    </div>
  );
};

// 4. Tool Execution Node (Execution Span)
export const ToolExecutionNode = ({ data }: { data: any }) => {
  const isFailed = data.status === 'error';

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5 ${
          isFailed ? '!bg-rose-500' : '!bg-[#0284c7]'
        }`}
      />
      <div
        className={`w-64 rounded-lg border bg-[#111114] p-3 shadow-md transition-all select-none ${
          isFailed
            ? 'border-rose-500/80 bg-[#1c1214]'
            : data.active
            ? 'border-sky-500 ring-1 ring-sky-500/50 bg-[#121924]'
            : 'border-[#27272a] hover:border-[#3f3f46]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className={`p-1 rounded ${isFailed ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
              {isFailed ? <AlertTriangle className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
            </span>
            <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${isFailed ? 'text-rose-400' : 'text-sky-400'}`}>
              Tool Execution
            </span>
          </div>
          <span
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
              isFailed
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a]'
            }`}
          >
            {isFailed ? 'FAILED' : 'SPAN'}
          </span>
        </div>

        <div className="text-xs font-mono font-semibold text-zinc-100 truncate" title={data.label}>
          {data.label}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#1e1e22] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span className="flex items-center space-x-1">
            <Clock className="h-2.5 w-2.5" />
            <span>{data.duration ? `${data.duration}ms` : '45ms'}</span>
          </span>
          <span className={isFailed ? 'text-rose-400 font-semibold' : 'text-zinc-400 font-semibold'}>
            {isFailed ? 'INTERCEPTED' : 'SUCCESS'}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5 ${
          isFailed ? '!bg-rose-500' : '!bg-[#0284c7]'
        }`}
      />
    </div>
  );
};

// 5. Retry Recovery Node (Resilience Mechanism)
export const RetryRecoveryNode = ({ data }: { data: any }) => {
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#f59e0b] !w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5"
      />
      <div className="w-64 rounded-lg border border-amber-500/50 bg-[#18140c] p-3 shadow-md select-none">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400">
              <RotateCcw className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Resilience
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            RETRY
          </span>
        </div>

        <div className="text-xs font-semibold text-zinc-100">
          Automatic Retry #{data.attempt || 2}
        </div>
        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
          Exponential backoff: {data.backoff || 300}ms
        </div>

        <div className="mt-2.5 pt-2 border-t border-amber-500/10 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>BACKOFF OK</span>
          <span className="text-amber-400 font-semibold">RECOVERED</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#f59e0b] !w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5"
      />
    </div>
  );
};

// 6. Artifact Output Node (Result)
export const ArtifactOutputNode = ({ data }: { data: any }) => {
  return (
    <div className="relative group cursor-pointer" onClick={data.onClick}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#10b981] !w-2.5 !h-2.5 !border !border-[#27272a] !-left-1.5"
      />
      <div className="w-64 rounded-lg border border-emerald-500/60 bg-[#0e1a14] hover:bg-[#12221b] p-3 shadow-md transition-all select-none">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <FileCheck2 className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Artifact Output
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            VIEW RESULT ↗
          </span>
        </div>

        <div className="text-xs font-mono font-semibold text-zinc-100 truncate" title={data.label}>
          {data.label || 'output.html'}
        </div>
        <div className="text-[11px] text-emerald-400/90 mt-0.5">
          Verified & saved to storage
        </div>

        <div className="mt-2.5 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>INTEGRITY: 100%</span>
          <span className="text-emerald-400 font-semibold">SUCCESS</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#10b981] !w-2.5 !h-2.5 !border !border-[#27272a] !-right-1.5"
      />
    </div>
  );
};
