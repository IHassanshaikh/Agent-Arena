'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchRun, fetchRunEvents } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { TraceHeader } from '@/components/trace/TraceHeader';
import { MetricsStrip } from '@/components/trace/MetricsStrip';
import { TimelineView } from '@/components/trace/TimelineView';
import { WaterfallView } from '@/components/trace/WaterfallView';
import { EventInspector } from '@/components/trace/EventInspector';
import { ReplayControls } from '@/components/trace/ReplayControls';
import { Layers, GitCommit, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function LiveTraceWorkspace() {
  const params = useParams();
  const runId = params.runId as string;

  const [run, setRun] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'waterfall'>('timeline');
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

      if (newEvent.event_type === 'run.completed') {
        setRun((prev: any) => prev ? { ...prev, status: 'completed' } : prev);
      } else if (newEvent.event_type === 'run.failed') {
        setRun((prev: any) => prev ? { ...prev, status: 'failed' } : prev);
      }
    };

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-zinc-400 font-mono text-xs">
        <RefreshCw className="h-5 w-5 animate-spin mb-2 text-blue-500" />
        <span>Loading execution trace...</span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] p-4 font-mono text-xs">
        <div className="p-6 rounded-lg bg-[#111114] border border-[#27272a] text-center max-w-sm">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-white">Execution Trace Not Found</h2>
          <p className="text-zinc-500 mt-1 mb-4">{error || `Run ${runId} was not found.`}</p>
          <Link href="/" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold">
            Return to Studio
          </Link>
        </div>
      </div>
    );
  }

  const displayedEvents = isReplayMode ? events.slice(0, replayIndex + 1) : events;

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="h-12 border-b border-[#27272a] bg-[#111114] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-xs font-semibold text-zinc-300">
            Run: {run.id.slice(0, 8)}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-5 space-y-4 max-w-7xl w-full mx-auto">
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

        <MetricsStrip metrics={run.metrics} />

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className={selectedEvent ? 'lg:col-span-7 xl:col-span-8 space-y-3' : 'lg:col-span-12 space-y-3'}>
            <div className="flex items-center space-x-1 p-0.5 rounded bg-[#111114] border border-[#27272a] text-xs font-mono w-fit">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-[#18181b] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Timeline ({displayedEvents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('waterfall')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                  activeTab === 'waterfall'
                    ? 'bg-[#18181b] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitCommit className="h-3 w-3" />
                <span>Span Waterfall</span>
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
    </div>
  );
}
