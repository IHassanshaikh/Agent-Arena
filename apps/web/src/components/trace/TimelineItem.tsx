'use client';

import React from 'react';
import {
  Zap,
  Wrench,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  HelpCircle,
  FileText
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
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          title: `Model Call: ${event.payload?.provider || ''} ${event.payload?.model || ''}`
        };
      case 'llm.completed':
        return {
          icon: Zap,
          label: 'LLM RESPONSE',
          color: 'text-purple-400 bg-purple-500/15 border-purple-500/40',
          title: `${event.payload?.model || 'LLM'} returned ${event.payload?.output_tokens || 0} tokens`
        };
      case 'llm.failed':
        return {
          icon: AlertOctagon,
          label: 'LLM FAILED',
          color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
          title: `LLM Call Failed: ${event.payload?.error_code || 'Error'}`
        };
      case 'tool.started':
        return {
          icon: Wrench,
          label: 'TOOL INVOKE',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          title: `Tool: ${event.payload?.tool_name || 'unknown'}`
        };
      case 'tool.completed':
        return {
          icon: Wrench,
          label: 'TOOL RESULT',
          color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
          title: `Tool ${event.payload?.tool_name || ''} completed`
        };
      case 'tool.failed':
        return {
          icon: AlertOctagon,
          label: 'TOOL FAILED',
          color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
          title: `Tool Failed: ${event.payload?.tool_name || ''} - ${event.payload?.error_code || 'Error'}`
        };
      case 'retry.scheduled':
        return {
          icon: RotateCcw,
          label: 'RETRY SCHEDULED',
          color: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
          title: `Retry Attempt #${event.payload?.attempt || 2}`
        };
      case 'decision.summary':
        return {
          icon: Sparkles,
          label: 'DECISION RATIONALE',
          color: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
          title: `Action: ${event.payload?.selected_action || 'Step'}`
        };
      case 'run.started':
        return {
          icon: Play,
          label: 'RUN STARTED',
          color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
          title: 'Execution started'
        };
      case 'run.completed':
        return {
          icon: CheckCircle2,
          label: 'RUN COMPLETED',
          color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
          title: 'Execution succeeded'
        };
      case 'run.failed':
        return {
          icon: AlertOctagon,
          label: 'RUN FAILED',
          color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
          title: 'Execution terminated with error'
        };
      default:
        return {
          icon: FileText,
          label: event.event_type.toUpperCase(),
          color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
          title: event.event_type
        };
    }
  };

  const badge = getBadgeConfig();
  const Icon = badge.icon;

  const renderSummaryText = () => {
    const p = event.payload || {};
    if (event.event_type === 'decision.summary') {
      return p.summary || 'Decision rationale emitted';
    }
    if (event.event_type === 'tool.completed') {
      return p.result_summary || 'Tool returned safely';
    }
    if (event.event_type === 'tool.failed') {
      return p.safe_error_message || p.error_code || 'Tool execution encountered an error';
    }
    if (event.event_type === 'retry.scheduled') {
      return `${p.reason} (Backoff: ${p.backoff_ms || 0}ms)`;
    }
    if (event.event_type === 'llm.completed') {
      return p.response_summary || `Generated ${p.output_tokens || 0} tokens (${p.latency_ms || 0}ms)`;
    }
    if (event.event_type === 'run.completed') {
      return p.outcome || 'Task resolved successfully';
    }
    if (event.event_type === 'run.failed') {
      return p.safe_error_message || 'Task failed';
    }
    if (p.safe_arguments) {
      return JSON.stringify(p.safe_arguments);
    }
    return '';
  };

  return (
    <div
      onClick={() => onSelect(event)}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10'
          : 'bg-arena-card border-arena-border hover:border-gray-600 hover:bg-arena-card/90'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          {/* Sequence badge */}
          <span className="font-mono text-[11px] text-gray-500 px-1.5 py-0.5 rounded bg-arena-bg border border-arena-border/60 shrink-0 mt-0.5">
            #{event.sequence}
          </span>

          {/* Type Badge */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span
                className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${badge.color}`}
              >
                <Icon className="h-3 w-3" />
                <span>{badge.label}</span>
              </span>

              {event.span_id && (
                <span className="text-[11px] font-mono text-gray-500">
                  [{event.span_id}]
                </span>
              )}
            </div>

            <div className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">
              {badge.title}
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 font-mono">
              {renderSummaryText()}
            </p>
          </div>
        </div>

        {/* Right side duration & time */}
        <div className="text-right shrink-0 space-y-1 font-mono text-xs">
          {event.duration_ms ? (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-arena-bg border border-arena-border text-gray-300">
              <Clock className="h-3 w-3 text-blue-400" />
              <span>{formatDuration(event.duration_ms)}</span>
            </span>
          ) : (
            <span className="text-gray-600 text-[11px]">
              {new Date(event.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function Play(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

