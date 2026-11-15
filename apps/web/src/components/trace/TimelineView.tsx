'use client';

import React, { useState } from 'react';
import { TimelineItem } from './TimelineItem';
import { Filter, Search, ArrowDown, Sparkles } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-arena-card/60 p-2.5 rounded-xl border border-arena-border">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'llm', label: 'LLM Requests' },
            { id: 'tools', label: 'Tool Calls' },
            { id: 'retries', label: 'Retries & Errors' },
            { id: 'decisions', label: 'Decisions' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-arena-border/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input & Jump to Latest */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filter trace events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-arena-bg border border-arena-border text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {onJumpToLatest && (
            <button
              onClick={onJumpToLatest}
              className="px-2.5 py-1 rounded-lg bg-arena-bg border border-arena-border text-gray-300 hover:text-white text-xs font-mono flex items-center space-x-1 shrink-0"
              title="Jump to latest event"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Latest</span>
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-arena-card/30 rounded-xl border border-arena-border">
            <Sparkles className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">No events match filter</p>
            <p className="text-xs text-gray-500 mt-1">Events will appear live as the agent executes.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <TimelineItem
              key={event.event_id || `${event.run_id}-${event.sequence}`}
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

