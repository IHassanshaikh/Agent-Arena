'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fetchRun, fetchRunEvents } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { TraceHeader } from '@/components/trace/TraceHeader';
import { MetricsStrip } from '@/components/trace/MetricsStrip';
import { TimelineView } from '@/components/trace/TimelineView';
import { WaterfallView } from '@/components/trace/WaterfallView';
import { AnalyticsView } from '@/components/trace/AnalyticsView';
import { EventInspector } from '@/components/trace/EventInspector';
import { ReplayControls } from '@/components/trace/ReplayControls';
import { Layers, GitCommit, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';

export default function LiveTraceWorkspace() {
  const params = useParams();
  const runId = params.runId as string;

  const [run, setRun] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'waterfall' | 'analytics'>('timeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replay mode state
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  const highestSequenceRef = useRef<number>(0);

  // 1. Initial Load & Catch-up
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        const runData = await fetchRun(runId);
        if (!isMounted) return;
        setRun(runData);

        const eventsData = await fetchRunEvents(runId);
        if (!isMounted) return;

        const loadedEvents = eventsData.events || [];
        setEvents(loadedEvents);
        if (loadedEvents.length > 0) {
          highestSequenceRef.current = Math.max(...loadedEvents.map((e: any) => e.sequence));
          setSelectedEvent(loadedEvents[loadedEvents.length - 1]);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load run trace');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [runId]);

  // 2. Real-time Socket.IO Connection & Catch-up
  useEffect(() => {
    if (!runId) return;

    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('run:join', { runId });
      // Catch up any events missed during disconnect
      if (highestSequenceRef.current > 0) {
        fetchRunEvents(runId, highestSequenceRef.current).then((res) => {
          if (res?.events?.length > 0) {
            setEvents((prev) => {
              const existingIds = new Set(prev.map((e) => e.event_id));
              const newItems = res.events.filter((e: any) => !existingIds.has(e.event_id));
              if (newItems.length === 0) return prev;
              const merged = [...prev, ...newItems].sort((a, b) => a.sequence - b.sequence);
              highestSequenceRef.current = Math.max(...merged.map((e) => e.sequence));
              return merged;
            });
          }
        }).catch(console.error);
      }
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    // Event Ingestion Listener
    const handleTraceEvent = (newEvent: any) => {
      if (newEvent.run_id !== runId) return;

      setEvents((prev) => {
        if (prev.some((e) => e.event_id === newEvent.event_id)) {
          return prev;
        }
        const updated = [...prev, newEvent].sort((a, b) => a.sequence - b.sequence);
        highestSequenceRef.current = Math.max(highestSequenceRef.current, newEvent.sequence);
        return updated;
      });

      // Update run status if terminal event
      if (newEvent.event_type === 'run.completed') {
        setRun((prev: any) => prev ? { ...prev, status: 'completed' } : prev);
      } else if (newEvent.event_type === 'run.failed') {
        setRun((prev: any) => prev ? { ...prev, status: 'failed' } : prev);
      }
    };

    // Metrics Update Listener
    const handleMetricsUpdate = (data: { runId: string; metrics: any; status: string }) => {
      if (data.runId !== runId) return;
      setRun((prev: any) => prev ? { ...prev, metrics: data.metrics, status: data.status } : prev);
    };

    socket.on('trace:event', handleTraceEvent);
    socket.on('metrics:update', handleMetricsUpdate);

    return () => {
      socket.emit('run:leave', { runId });
      socket.off('connect', joinRoom);
      socket.off('trace:event', handleTraceEvent);
      socket.off('metrics:update', handleMetricsUpdate);
    };
  }, [runId]);

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center py-24 space-x-3 text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="font-mono text-sm">Initializing trace stream recorder...</span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-8 rounded-xl bg-arena-card border border-rose-500/30 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Execution Trace Not Found</h2>
        <p className="text-sm text-gray-400 mt-1 mb-4">{error || `Run ${runId} does not exist.`}</p>
        <a href="/" className="px-4 py-2 bg-arena-bg border border-arena-border rounded-lg text-sm text-gray-200">
          Back to Runs Overview
        </a>
      </div>
    );
  }

  // Active events depending on replay mode
  const displayedEvents = isReplayMode
    ? events.slice(0, replayIndex + 1)
    : events;

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <TraceHeader
        run={run}
        isReplayMode={isReplayMode}
        onToggleReplay={() => {
          if (!isReplayMode) {
            setReplayIndex(events.length - 1);
          }
          setIsReplayMode(!isReplayMode);
        }}
      />

      {/* 2. Metrics Strip */}
      <MetricsStrip metrics={run.metrics} />

      {/* 3. Replay Controls (if active) */}
      {isReplayMode && (
        <ReplayControls
          events={events}
          currentIndex={replayIndex}
          onIndexChange={(idx) => {
            setReplayIndex(idx);
            setSelectedEvent(events[idx]);
          }}
          onClose={() => setIsReplayMode(false)}
        />
      )}

      {/* 4. Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Timeline / Waterfall */}
        <div className={selectedEvent ? 'lg:col-span-7 xl:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* View Tab Selector */}
          <div className="flex items-center space-x-2 border-b border-arena-border pb-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>CHRONOLOGICAL TIMELINE ({displayedEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('waterfall')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'waterfall'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GitCommit className="h-4 w-4" />
              <span>SPAN WATERFALL</span>
            </button>
          </div>

          {activeTab === 'timeline' ? (
            <TimelineView
              events={displayedEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onJumpToLatest={() => {
                if (displayedEvents.length > 0) {
                  setSelectedEvent(displayedEvents[displayedEvents.length - 1]);
                }
              }}
            />
          ) : (
            <WaterfallView
              events={displayedEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
            />
          )}
        </div>

        {/* Right Column: Event Inspector */}
        {selectedEvent && (
          <div className="lg:col-span-5 xl:col-span-4">
            <EventInspector
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

