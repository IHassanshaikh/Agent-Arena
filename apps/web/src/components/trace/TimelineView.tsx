'use client';

import React, { useState } from 'react';
import { TimelineItem } from './TimelineItem';
import { Search, ArrowDown } from 'lucide-react';

interface TimelineViewProps {
  events: any[];
  selectedEvent: any;
  onSelectEvent: (event: any) => void;
  onJumpToLatest?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onJumpToLatest
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((e) => {
    if (categoryFilter === 'llm' && !e.event_type.startsWith('llm.')) return false;
    if (categoryFilter === 'tools' && !e.event_type.startsWith('tool.')) return false;
    if (categoryFilter === 'retries' && e.event_type !== 'retry.scheduled' && e.status !== 'error') return false;
    if (categoryFilter === 'decisions' && e.event_type !== 'decision.summary') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const stringified = JSON.stringify(e).toLowerCase();
      return stringified.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#111114] p-2 rounded-lg border border-[#27272a]">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'llm', label: 'LLM' },
            { id: 'tools', label: 'Tools' },
            { id: 'retries', label: 'Retries' },
            { id: 'decisions', label: 'Decisions' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input & Jump to Latest */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2 top-2 h-3 w-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter trace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {onJumpToLatest && (
            <button
              onClick={onJumpToLatest}
              className="px-2 py-1 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-white text-xs flex items-center space-x-1 shrink-0"
              title="Jump to latest event"
            >
              <ArrowDown className="h-3 w-3" />
              <span>Latest</span>
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-1.5">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-[#111114] rounded-lg border border-[#27272a] text-zinc-500">
            No events match filter
          </div>
        ) : (
          filteredEvents.map((event) => (
            <TimelineItem
              key={event.event_id}
              event={event}
              isSelected={selectedEvent?.event_id === event.event_id}
              onSelect={onSelectEvent}
            />
          ))
        )}
      </div>
    </div>
  );
};
