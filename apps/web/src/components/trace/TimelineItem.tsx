'use client';

import React from 'react';
import {
  Zap,
  Wrench,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Play
} from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface TimelineItemProps {
  event: any;
  isSelected: boolean;
  onSelect: (event: any) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isSelected, onSelect }) => {
  const getBadgeConfig = () => {
    switch (event.event_type) {
      case 'llm.started':
        return {
          icon: Zap,
          label: 'LLM REQUEST',
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        };
      case 'llm.completed':
        return {
          icon: Zap,
          label: 'LLM RESPONSE',
          color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
        };
      case 'llm.failed':
        return {
          icon: AlertOctagon,
          label: 'LLM FAILED',
          color: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
        };
      case 'tool.started':
        return {
          icon: Wrench,
          label: 'TOOL INVOKE',
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
        };
      case 'tool.completed':
        return {
          icon: Wrench,
          label: 'TOOL RESULT',
          color: 'text-sky-400 bg-sky-500/15 border-sky-500/30'
        };
      case 'tool.failed':
        return {
          icon: AlertOctagon,
          label: 'TOOL FAILED',
          color: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
        };
      case 'retry.scheduled':
        return {
          icon: RotateCcw,
          label: 'RETRY',
          color: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
        };
      case 'decision.summary':
        return {
          icon: Play,
          label: 'DECISION',
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
        };
      case 'run.started':
        return {
          icon: Play,
          label: 'RUN START',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        };
      case 'run.completed':
        return {
          icon: CheckCircle2,
          label: 'RUN FINISHED',
          color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
        };
      case 'run.failed':
        return {
          icon: AlertOctagon,
          label: 'RUN FAILED',
          color: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
        };
      default:
        return {
          icon: Play,
          label: event.event_type.toUpperCase(),
          color: 'text-zinc-400 bg-[#18181b] border-[#27272a]'
        };
    }
  };

  const badge = getBadgeConfig();
  const Icon = badge.icon;
  const p = event.payload || {};
  const isLLM = event.event_type.startsWith('llm.');
  const isTool = event.event_type.startsWith('tool.');
  const isError = event.status === 'error';

  return (
    <div
      onClick={() => onSelect(event)}
      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all font-mono select-none ${
        isSelected
          ? 'bg-[#18181b] border-blue-500 shadow-sm'
          : 'bg-[#111114] border-[#27272a] hover:border-[#3f3f46]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
            <Icon className="h-2.5 w-2.5" />
            <span>{badge.label}</span>
          </span>
          <span className="text-zinc-500 text-[10px]">#{event.sequence}</span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 tabular-nums">
          {event.duration_ms && (
            <span className="text-zinc-300 font-semibold">{formatDuration(event.duration_ms)}</span>
          )}
          <span>{new Date(event.occurred_at).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="text-zinc-200 font-medium text-xs truncate">
        {isLLM && `${p.provider || ''} ${p.model || ''}`}
        {isTool && `${p.tool_name || 'tool'}`}
        {!isLLM && !isTool && (p.selected_action || p.task_label || event.event_type)}
      </div>

      {(p.summary || p.response_summary || p.result_summary) && (
        <div className="text-zinc-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
          {p.summary || p.response_summary || p.result_summary}
        </div>
      )}

      {isLLM && p.input_tokens && (
        <div className="flex items-center space-x-2 text-[10px] text-indigo-400 mt-2 pt-1.5 border-t border-[#1e1e22] tabular-nums">
          <span>Tokens: {p.input_tokens} prompt / {p.output_tokens || 0} completion</span>
        </div>
      )}
    </div>
  );
};
