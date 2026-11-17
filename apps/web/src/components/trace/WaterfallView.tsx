'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface WaterfallViewProps {
  events: any[];
  selectedEvent: any;
  onSelectEvent: (event: any) => void;
}

export const WaterfallView: React.FC<WaterfallViewProps> = ({ events, selectedEvent, onSelectEvent }) => {
  const spanEvents = events.filter(
    (e) => e.span_id || e.duration_ms || e.event_type.endsWith('.started') || e.event_type.endsWith('.completed')
  );

  if (spanEvents.length === 0) {
    return (
      <div className="text-center py-16 bg-[#111114] rounded-lg border border-[#27272a] font-mono text-xs">
        <Clock className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
        <p className="font-semibold text-zinc-300">No span operations recorded</p>
        <p className="text-zinc-500 mt-1">Spans visualize when tool and model operations execute.</p>
      </div>
    );
  }

  const startTimes = events.map((e) => new Date(e.occurred_at).getTime());
  const minTime = Math.min(...startTimes);
  const maxEndTimes = events.map((e) => new Date(e.occurred_at).getTime() + (e.duration_ms || 0));
  const maxTime = Math.max(...maxEndTimes, minTime + 1000);
  const totalWindowMs = maxTime - minTime || 1;

  return (
    <div className="bg-[#111114] rounded-lg border border-[#27272a] p-3.5 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between text-zinc-400 border-b border-[#27272a] pb-2.5">
        <span className="font-semibold text-white">Span Hierarchy & Latency Waterfall</span>
        <span className="text-[11px] tabular-nums">Total Window: {formatDuration(totalWindowMs)}</span>
      </div>

      {/* Axis ruler */}
      <div className="relative h-4 text-[10px] text-zinc-500 border-b border-[#27272a]/60 tabular-nums">
        <span className="absolute left-0">0ms</span>
        <span className="absolute left-1/4">{formatDuration(totalWindowMs * 0.25)}</span>
        <span className="absolute left-1/2">{formatDuration(totalWindowMs * 0.5)}</span>
        <span className="absolute left-3/4">{formatDuration(totalWindowMs * 0.75)}</span>
        <span className="absolute right-0">{formatDuration(totalWindowMs)}</span>
      </div>

      {/* Spans Gantt list */}
      <div className="space-y-1.5 pt-1">
        {spanEvents.map((evt) => {
          const evtTime = new Date(evt.occurred_at).getTime();
          const offsetPercent = Math.max(0, Math.min(100, ((evtTime - minTime) / totalWindowMs) * 100));
          const duration = evt.duration_ms || 120;
          const durationPercent = Math.max(2, Math.min(100 - offsetPercent, (duration / totalWindowMs) * 100));

          const isSelected = selectedEvent?.event_id === evt.event_id;

          let barColor = 'bg-blue-600';
          if (evt.event_type.startsWith('llm.')) barColor = 'bg-indigo-500';
          else if (evt.event_type.startsWith('tool.')) barColor = evt.status === 'error' ? 'bg-rose-500' : 'bg-sky-500';
          else if (evt.event_type === 'retry.scheduled') barColor = 'bg-amber-500';

          return (
            <div
              key={evt.event_id}
              onClick={() => onSelectEvent(evt)}
              className={`p-2 rounded border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#18181b] border-blue-500 shadow-sm'
                  : 'bg-[#141418] border-[#27272a] hover:border-[#3f3f46]'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <div className="flex items-center space-x-2 truncate max-w-sm">
                  <span className="text-zinc-500">#{evt.sequence}</span>
                  <span className="font-semibold text-zinc-200">
                    {evt.payload?.tool_name || evt.payload?.model || evt.event_type}
                  </span>
                  {evt.span_id && <span className="text-zinc-500 text-[10px]">[{evt.span_id}]</span>}
                </div>
                <div className="text-zinc-400 text-[10px] tabular-nums">
                  {formatDuration(evt.duration_ms)}
                </div>
              </div>

              {/* Gantt Bar Track */}
              <div className="w-full bg-[#18181b] h-2 rounded overflow-hidden relative">
                <div
                  className={`h-full rounded transition-all ${barColor}`}
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
