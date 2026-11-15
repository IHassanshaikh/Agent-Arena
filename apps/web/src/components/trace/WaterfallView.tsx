'use client';

import React from 'react';
import { Clock, Zap, Wrench, RotateCcw, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface WaterfallViewProps {
  events: any[];
  selectedEvent: any;
  onSelectEvent: (event: any) => void;
}

export const WaterfallView: React.FC<WaterfallViewProps> = ({ events, selectedEvent, onSelectEvent }) => {
  // Filter events with duration or spans
  const spanEvents = events.filter((e) => e.span_id || e.duration_ms || e.event_type.endsWith('.started') || e.event_type.endsWith('.completed'));

  if (spanEvents.length === 0) {
    return (
      <div className="text-center py-16 bg-arena-card/30 rounded-xl border border-arena-border">
        <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-300">No span operations recorded</p>
        <p className="text-xs text-gray-500 mt-1">Spans will visualize once tool and model requests complete.</p>
      </div>
    );
  }

  // Calculate run time boundaries
  const startTimes = events.map((e) => new Date(e.occurred_at).getTime());
  const minTime = Math.min(...startTimes);
  const maxEndTimes = events.map((e) => new Date(e.occurred_at).getTime() + (e.duration_ms || 0));
  const maxTime = Math.max(...maxEndTimes, minTime + 1000);
  const totalWindowMs = maxTime - minTime || 1;

  return (
    <div className="bg-arena-card rounded-xl border border-arena-border p-4 space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-arena-border pb-3">
        <div className="font-semibold text-gray-200">Span Hierarchy & Latency Waterfall</div>
        <div className="font-mono">Total Trace Window: {formatDuration(totalWindowMs)}</div>
      </div>

      {/* Axis ruler */}
      <div className="relative h-6 text-[10px] font-mono text-gray-500 border-b border-arena-border/50">
        <div className="absolute left-0">0ms</div>
        <div className="absolute left-1/4">{formatDuration(totalWindowMs * 0.25)}</div>
        <div className="absolute left-1/2">{formatDuration(totalWindowMs * 0.5)}</div>
        <div className="absolute left-3/4">{formatDuration(totalWindowMs * 0.75)}</div>
        <div className="absolute right-0">{formatDuration(totalWindowMs)}</div>
      </div>

      {/* Spans Gantt list */}
      <div className="space-y-2 pt-1">
        {spanEvents.map((evt) => {
          const evtTime = new Date(evt.occurred_at).getTime();
          const offsetPercent = Math.max(0, Math.min(100, ((evtTime - minTime) / totalWindowMs) * 100));
          const duration = evt.duration_ms || 150;
          const durationPercent = Math.max(2, Math.min(100 - offsetPercent, (duration / totalWindowMs) * 100));

          const isSelected = selectedEvent?.event_id === evt.event_id;

          let barColor = 'bg-blue-500/70';
          if (evt.event_type.startsWith('llm.')) barColor = 'bg-purple-500/80';
          if (evt.event_type.startsWith('tool.')) barColor = evt.status === 'error' ? 'bg-rose-500/80' : 'bg-cyan-500/80';
          if (evt.event_type === 'retry.scheduled') barColor = 'bg-amber-500/80';

          return (
            <div
              key={evt.event_id}
              onClick={() => onSelectEvent(evt)}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500'
                  : 'bg-arena-bg/60 border-arena-border/70 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                <div className="flex items-center space-x-2 truncate max-w-sm">
                  <span className="text-gray-500">#{evt.sequence}</span>
                  <span className="font-semibold text-gray-200">
                    {evt.payload?.tool_name || evt.payload?.model || evt.event_type}
                  </span>
                  {evt.span_id && <span className="text-gray-500 text-[10px]">[{evt.span_id}]</span>}
                  {evt.parent_span_id && <span className="text-gray-600 text-[10px]">parent: {evt.parent_span_id}</span>}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {formatDuration(evt.duration_ms)}
                </div>
              </div>

              {/* Gantt Bar Track */}
              <div className="w-full bg-arena-border/40 h-3 rounded-full relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{
                    marginLeft: `${offsetPercent}%`,
                    width: `${durationPercent}%`
                  }}
                  title={`${evt.event_type} (${formatDuration(evt.duration_ms)})`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

