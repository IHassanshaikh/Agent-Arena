'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Cpu, Zap, Wrench, RotateCcw, FileCode, CheckCircle2 } from 'lucide-react';

// 1. User Prompt Input Node (Front of workflow)
export const TaskPromptNode = ({ data }: { data: any }) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-left-1"
      />
      <div
        className={`w-28 h-28 rotate-45 flex items-center justify-center border transition-colors ${data.active
            ? 'bg-[#181d2c] border-[#38bdf8]'
            : 'bg-[#0f131d] border-white/10 hover:border-white/20'
          }`}
      >
        <div className="-rotate-45 text-center px-2 select-none">
          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider mb-0.5">
            Prompt
          </div>
          <div
            className="text-xs font-mono font-medium text-white truncate max-w-[85px]"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};

// 2. Agent Reasoning Node (Green Hexagon)
export const AgentPlannerNode = ({ data }: { data: any }) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#22c55e] !w-2 !h-2 !border-0 !-left-1"
      />
      <div
        className="w-28 h-28 flex flex-col items-center justify-center transition-colors select-none"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          backgroundColor: data.active ? '#0d3820' : '#0a2617'
        }}
      >
        <Cpu className="h-4 w-4 text-[#22c55e] mb-1" />
        <div className="text-xs font-mono font-medium text-white text-center px-2 truncate max-w-[80px]" title={data.label}>
          {data.label || 'Agent'}
        </div>
        <div className="text-[10px] font-mono text-[#86efac]/80 mt-0.5">
          {data.sublabel || 'decision'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#22c55e] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};

// 3. Model Gateway Node (Precision Circle)
export const ModelGatewayNode = ({ data }: { data: any }) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-left-1"
      />
      <div
        className={`w-28 h-28 rounded-full border flex flex-col items-center justify-center transition-colors select-none ${data.active
            ? 'bg-[#0f243d] border-[#38bdf8]'
            : 'bg-[#0a1829] border-sky-500/20 hover:border-sky-500/40'
          }`}
      >
        <Zap className="h-4 w-4 text-[#38bdf8] mb-1" />
        <div className="text-xs font-mono font-medium text-white text-center px-2 truncate max-w-[80px]" title={data.label}>
          {data.label || 'gemini-2.5'}
        </div>
        {data.sublabel && (
          <div className="text-[10px] font-mono text-[#93c5fd] mt-0.5 tabular-nums">
            {data.sublabel}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};

// 4. Tool Execution Node (Restrained Instrument Card)
export const ToolExecutionNode = ({ data }: { data: any }) => {
  const isFailed = data.status === 'error';

  return (
    <div className="relative flex items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-left-1"
      />
      <div
        className={`px-3 py-2 rounded-xl border flex items-center space-x-2.5 min-w-[170px] transition-colors select-none ${isFailed
            ? 'bg-[#1c0c0f] border-rose-500/30 text-white'
            : data.active
              ? 'bg-[#181d2c] border-[#38bdf8] text-white'
              : 'bg-[#0f1118] border-white/10 hover:border-white/20 text-[#d4d4d8]'
          }`}
      >
        <div className={`p-1.5 rounded-lg ${isFailed ? 'bg-[#331116] text-[#f43f5e]' : 'bg-[#1c1810] text-[#f59e0b]'}`}>
          <Wrench className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono font-medium truncate text-white" title={data.label}>
            {data.label}
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] flex items-center space-x-1 tabular-nums mt-0.5">
            <span>{data.duration ? `${data.duration}ms` : 'executed'}</span>
            {data.count && <span>• {data.count}×</span>}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#38bdf8] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};

// 5. Retry Recovery Node
export const RetryRecoveryNode = ({ data }: { data: any }) => {
  return (
    <div className="relative flex items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#f59e0b] !w-2 !h-2 !border-0 !-left-1"
      />
      <div className="px-3 py-2 rounded-xl border border-amber-500/20 bg-[#16130b] flex items-center space-x-2.5 min-w-[160px] select-none">
        <RotateCcw className="h-3.5 w-3.5 text-[#f59e0b]" />
        <div>
          <div className="text-xs font-mono font-medium text-white">
            {data.label || 'Retry'}
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] tabular-nums mt-0.5">
            attempt #{data.attempt || 2} ({data.backoff || 300}ms)
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#f59e0b] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};

// 6. Artifact Output Node (Click to preview result)
export const ArtifactOutputNode = ({ data }: { data: any }) => {
  return (
    <div className="relative flex items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#22c55e] !w-2 !h-2 !border-0 !-left-1"
      />
      <div
        onClick={data.onClick}
        className="px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-[#071c11] hover:bg-[#0c2b1a] hover:border-emerald-500 transition-colors flex items-center space-x-2.5 min-w-[170px] cursor-pointer select-none group"
      >
        <div className="p-1.5 rounded-lg bg-[#0e301d] text-[#22c55e]">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono font-medium text-white truncate" title={data.label}>
            {data.label || 'output'}
          </div>
          <div className="text-[10px] font-mono text-[#86efac] flex items-center space-x-1 mt-0.5">
            <span>View result</span>
            <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#22c55e] !w-2 !h-2 !border-0 !-right-1"
      />
    </div>
  );
};
