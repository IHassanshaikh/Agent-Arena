'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Play,
  RotateCcw,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  ChevronDown,
  X,
  Check,
  Copy,
  Trash2,
  Download,
  Eye,
  GitCompare,
  Database,
  Terminal,
  Shield,
  Layers,
  Clock,
  Zap,
  Wrench,
  AlertOctagon,
  CheckCircle2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { fetchRuns, fetchRunEvents, launchBenchmark, deleteRun, exportRun, seedDemoRuns } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatDuration, formatTimeAgo, formatTokens, formatCost } from '@/lib/formatters';
import { WorkflowTopology } from '@/components/flow/WorkflowTopology';
import { ArtifactPreview } from '@/components/trace/ArtifactPreview';
import { Logo } from '@/components/brand/Logo';

export default function TraceStudioPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Layout view controls
  const [activeTab, setActiveTab] = useState<'topology' | 'waterfall' | 'preview'>('topology');
  const [rightTab, setRightTab] = useState<'timeline' | 'inspector'>('timeline');
  const [splitView, setSplitView] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Modals & Menus
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRunSelector, setShowRunSelector] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showRunConfig, setShowRunConfig] = useState(false);

  // Execution options
  const [agentType, setAgentType] = useState<'alpha' | 'beta'>('alpha');
  const [seededFailure, setSeededFailure] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Canvas zoom action dispatcher
  const [zoomAction, setZoomAction] = useState<{ type: 'in' | 'out' | 'fit' | 'reset'; timestamp: number } | null>(null);

  // Prompt input state
  const [promptInput, setPromptInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [filterStepText, setFilterStepText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const highestSeqRef = useRef<number>(0);

  // 1. Fetch runs list
  const loadRuns = async () => {
    try {
      const res = await fetchRuns();
      const list = res.runs || [];
      setRuns(list);
      if (!selectedRunId && list.length > 0) {
        setSelectedRunId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load runs:', e);
    }
  };

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 3000);
    return () => clearInterval(interval);
  }, [selectedRunId]);

  // 2. Fetch events for active run
  useEffect(() => {
    if (!selectedRunId) return;
    fetchRunEvents(selectedRunId)
      .then((res) => {
        const evts = res.events || [];
        setEvents(evts);
        if (evts.length > 0) {
          highestSeqRef.current = Math.max(...evts.map((e: any) => e.sequence));
          setSelectedEvent(evts[evts.length - 1]);
        }
      })
      .catch(console.error);
  }, [selectedRunId]);

  // 3. Socket.IO live stream
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setSocketConnected(socket.connected);

    if (selectedRunId) {
      socket.emit('run:join', { runId: selectedRunId });
    }

    const handleTraceEvent = (newEvent: any) => {
      if (newEvent.run_id !== selectedRunId) return;
      setEvents((prev) => {
        if (prev.some((e) => e.event_id === newEvent.event_id)) return prev;
        const updated = [...prev, newEvent].sort((a, b) => a.sequence - b.sequence);
        highestSeqRef.current = Math.max(highestSeqRef.current, newEvent.sequence);
        return updated;
      });
      setSelectedEvent(newEvent);
    };

    const handleMetricsUpdate = (data: any) => {
      if (data.runId !== selectedRunId) return;
      setRuns((prev) =>
        prev.map((r) => (r.id === data.runId ? { ...r, metrics: data.metrics, status: data.status } : r))
      );
    };

    socket.on('trace:event', handleTraceEvent);
    socket.on('metrics:update', handleMetricsUpdate);

    return () => {
      if (selectedRunId) {
        socket.emit('run:leave', { runId: selectedRunId });
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('trace:event', handleTraceEvent);
      socket.off('metrics:update', handleMetricsUpdate);
    };
  }, [selectedRunId]);

  // Execute dynamic user prompt
  const handleRunPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isExecuting) return;

    setIsExecuting(true);
    const userPrompt = promptInput.trim();
    setPromptInput('');

    try {
      const res = await launchBenchmark({
        agent_id: agentType === 'alpha' ? 'agent-alpha' : 'agent-beta',
        prompt: userPrompt,
        seeded_failure: seededFailure
      });
      setSelectedRunId(res.run_id);
      setActiveTab('topology');
      await loadRuns();
    } catch (err) {
      console.error('Run launch failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoRuns();
      await loadRuns();
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    try {
      await deleteRun(runId);
      const remaining = runs.filter((r) => r.id !== runId);
      setRuns(remaining);
      if (selectedRunId === runId && remaining.length > 0) {
        setSelectedRunId(remaining[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    try {
      const data = await exportRun(runId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trace-${runId.slice(0, 8)}.json`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleRuns = runs.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  const filteredEvents = events.filter((evt) => {
    if (!filterStepText) return true;
    const q = filterStepText.toLowerCase();
    const searchable = `${evt.event_type} ${evt.payload?.tool_name || ''} ${evt.payload?.model || ''} ${evt.payload?.summary || ''} ${evt.payload?.result_summary || ''}`;
    return searchable.toLowerCase().includes(q);
  });

  // Calculate span waterfall metrics
  const spanEvents = events.filter(
    (e) => e.span_id || e.duration_ms || e.event_type.endsWith('.started') || e.event_type.endsWith('.completed')
  );
  const startTimes = events.map((e) => new Date(e.occurred_at).getTime());
  const minTime = startTimes.length > 0 ? Math.min(...startTimes) : 0;
  const maxEndTimes = events.map((e) => new Date(e.occurred_at).getTime() + (e.duration_ms || 0));
  const maxTime = maxEndTimes.length > 0 ? Math.max(...maxEndTimes, minTime + 1000) : 1000;
  const totalWindowMs = maxTime - minTime || 1;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#fafafa] select-none overflow-hidden font-sans">
      {/* 1. TOP NAVIGATION & CONTROLS BAR */}
      <header className="h-12 border-b border-[#27272a] bg-[#111114] px-3.5 flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Brand & Nav */}
        <div className="flex items-center space-x-5">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
            <Link
              href="/"
              className="px-2.5 py-1 rounded bg-[#18181b] text-white border border-[#27272a] font-semibold"
            >
              Studio
            </Link>
            <Link
              href="/compare"
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors"
            >
              <GitCompare className="h-3 w-3" />
              <span>Compare</span>
            </Link>
          </nav>

          {/* Real-time Socket Status */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[11px] font-mono text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
            <span className={socketConnected ? 'text-emerald-400' : 'text-zinc-500'}>
              {socketConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Prompt Execution Input */}
        <form onSubmit={handleRunPrompt} className="flex-1 max-w-xl mx-2 relative">
          <Terminal className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Execute task prompt (e.g., 'Build landing page for AI code editor')..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="w-full pl-8 pr-28 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />

          <div className="absolute right-1 top-1 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowRunConfig(!showRunConfig)}
              className="p-1 rounded hover:bg-[#27272a] text-zinc-400 hover:text-white"
              title="Agent & Failure Injection Settings"
            >
              <SlidersHorizontal className="h-3 w-3" />
            </button>

            <button
              type="submit"
              disabled={isExecuting || !promptInput.trim()}
              className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center space-x-1 transition-colors disabled:opacity-40"
            >
              {isExecuting ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Play className="h-2.5 w-2.5 fill-current" />}
              <span>Execute</span>
            </button>
          </div>

          {/* Quick Execution Config Flyout */}
          {showRunConfig && (
            <div className="absolute top-9 right-0 z-50 w-72 p-3 bg-[#111114] border border-[#27272a] rounded-lg shadow-2xl space-y-2.5 font-mono text-xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Agent Configuration</div>
              <div className="space-y-1">
                <label className="text-zinc-300 text-[11px] block">Agent Profile:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAgentType('alpha')}
                    className={`px-2 py-1 rounded border text-left text-[11px] ${
                      agentType === 'alpha'
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                        : 'bg-[#18181b] text-zinc-400 border-[#27272a]'
                    }`}
                  >
                    Alpha (Resilient)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentType('beta')}
                    className={`px-2 py-1 rounded border text-left text-[11px] ${
                      agentType === 'beta'
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                        : 'bg-[#18181b] text-zinc-400 border-[#27272a]'
                    }`}
                  >
                    Beta (Standard)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#27272a] flex items-center justify-between">
                <span className="text-[11px] text-zinc-300">Seed Controlled Tool Failure:</span>
                <input
                  type="checkbox"
                  checked={seededFailure}
                  onChange={(e) => setSeededFailure(e.target.checked)}
                  className="rounded bg-[#18181b] border-[#27272a] text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}
        </form>

        {/* Action & Utility Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            title="Seed demo benchmark traces into database"
          >
            <Database className="h-3 w-3 text-zinc-400" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white transition-colors"
            title="Documentation & Shortcuts"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white transition-colors"
            title="System Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. THREE-PANEL STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: RUNS DRAWER */}
        <div
          className={`border-r border-[#27272a] bg-[#111114] flex flex-col transition-all duration-150 shrink-0 ${
            isLeftCollapsed ? 'w-10' : 'w-64'
          }`}
        >
          {/* Subheader */}
          <div className="h-10 border-b border-[#27272a] px-3 flex items-center justify-between text-xs font-mono text-zinc-400">
            {!isLeftCollapsed && (
              <div className="flex items-center space-x-2 relative">
                <span className="font-semibold text-white text-xs uppercase tracking-wider">Runs</span>
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[10px] text-zinc-300 hover:text-white"
                >
                  <span className="capitalize">{statusFilter}</span>
                  <ChevronDown className="h-2.5 w-2.5 text-zinc-500" />
                </button>

                {showFilterMenu && (
                  <div className="absolute top-7 left-10 z-40 bg-[#111114] border border-[#27272a] rounded-md p-1 shadow-2xl space-y-0.5 w-28">
                    {(['all', 'completed', 'failed', 'running'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] capitalize transition-colors ${
                          statusFilter === st ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'hover:bg-[#18181b] text-zinc-400'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className="p-1 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white ml-auto transition-colors"
              title={isLeftCollapsed ? 'Expand runs panel' : 'Collapse runs panel'}
            >
              {isLeftCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Runs Items List */}
          {!isLeftCollapsed && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {visibleRuns.length === 0 ? (
                <div className="text-center py-10 text-xs font-mono text-zinc-500">
                  No {statusFilter !== 'all' ? statusFilter : ''} runs recorded
                </div>
              ) : (
                visibleRuns.map((r) => {
                  const isSelected = r.id === selectedRunId;
                  const isCompleted = r.status === 'completed';
                  const isFailed = r.status === 'failed';
                  const isRunning = r.status === 'running' || r.status === 'queued';

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRunId(r.id)}
                      className={`group p-2.5 rounded-md cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#18181b] border-blue-500 text-white shadow-sm'
                          : 'border-transparent hover:bg-[#18181b]/60 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs mb-1">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isRunning
                                ? 'bg-blue-500'
                                : isCompleted
                                ? 'bg-emerald-500'
                                : isFailed
                                ? 'bg-rose-500'
                                : 'bg-zinc-500'
                            }`}
                          ></span>
                          <span className="font-semibold text-xs text-zinc-200 truncate">
                            {r.id.slice(0, 8)}
                          </span>
                        </div>

                        {/* Action buttons on hover */}
                        <div className="hidden group-hover:flex items-center space-x-1">
                          <button
                            onClick={(e) => handleExportRun(e, r.id)}
                            className="p-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 hover:text-white"
                            title="Export trace JSON"
                          >
                            <Download className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRun(e, r.id)}
                            className="p-1 rounded bg-[#27272a] hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                            title="Delete run"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-300 font-mono truncate mb-1" title={r.task_label}>
                        {r.task_label}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                        <span>{r.metrics?.event_count || 12} events</span>
                        <span>{formatTimeAgo(r.started_at || r.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Runs Footer */}
          {!isLeftCollapsed && (
            <div className="h-8 border-t border-[#27272a] px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 tabular-nums">
              <span>{visibleRuns.length} total runs</span>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                className="hover:text-zinc-300 transition-colors text-[10px]"
              >
                COLLAPSE «
              </button>
            </div>
          )}
        </div>

        {/* CENTER PANEL: WORKSPACE CANVAS & VIEWS */}
        <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden relative">
          {/* Canvas Subheader with 3 Tabs */}
          <div className="h-10 border-b border-[#27272a] px-3.5 flex items-center justify-between bg-[#111114] z-20">
            <div className="flex items-center space-x-3">
              {/* Segmented Control */}
              <div className="flex items-center p-0.5 rounded-md bg-[#18181b] border border-[#27272a] text-xs font-mono">
                <button
                  onClick={() => setActiveTab('topology')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                    activeTab === 'topology'
                      ? 'bg-[#27272a] text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Topology Graph
                </button>
                <button
                  onClick={() => setActiveTab('waterfall')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                    activeTab === 'waterfall'
                      ? 'bg-[#27272a] text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Span Waterfall
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-[#27272a] text-emerald-400 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-3 w-3 text-emerald-400" />
                  <span>Live Result</span>
                </button>
              </div>

              {/* Split View Toggle */}
              {activeTab === 'topology' && (
                <button
                  onClick={() => setSplitView(!splitView)}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
                    splitView
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                      : 'border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Split View: Graph + Output Preview"
                >
                  <span>◫ Split</span>
                </button>
              )}

              {/* Active Run Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRunSelector(!showRunSelector)}
                  className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[11px] font-mono text-zinc-200 hover:border-[#3f3f46]"
                >
                  <span className="font-semibold truncate max-w-[120px]">
                    {selectedRun ? `${selectedRun.id.slice(0, 8)}` : 'Select Run'}
                  </span>
                  <ChevronDown className="h-2.5 w-2.5 text-zinc-500" />
                </button>

                {showRunSelector && (
                  <div className="absolute top-7 left-0 z-40 bg-[#111114] border border-[#27272a] rounded-md p-1 shadow-2xl space-y-0.5 w-60 max-h-64 overflow-y-auto">
                    {runs.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRunId(r.id);
                          setShowRunSelector(false);
                        }}
                        className={`w-full text-left p-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors ${
                          r.id === selectedRunId ? 'bg-[#18181b] text-blue-400 font-semibold' : 'hover:bg-[#18181b] text-zinc-400'
                        }`}
                      >
                        <span className="truncate">{r.id.slice(0, 8)} - {r.task_label?.slice(0, 18)}</span>
                        {r.id === selectedRunId && <Check className="h-3 w-3 shrink-0 ml-1 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Run Stats Strip & Zoom Controls */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              {selectedRun && (
                <div className="hidden xl:flex items-center space-x-2 text-[11px] text-zinc-400 tabular-nums">
                  <span className="text-zinc-500">Duration:</span>
                  <span className="text-zinc-200 font-semibold">{formatDuration(selectedRun.metrics?.duration_ms)}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-500">Tokens:</span>
                  <span className="text-zinc-200 font-semibold">{formatTokens(selectedRun.metrics?.total_tokens)}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-500">Cost:</span>
                  <span className="text-zinc-200 font-semibold">{formatCost(selectedRun.metrics?.estimated_cost_usd)}</span>
                </div>
              )}

              {activeTab === 'topology' && (
                <div className="flex items-center space-x-0.5 text-zinc-400">
                  <button
                    onClick={() => setZoomAction({ type: 'reset', timestamp: Date.now() })}
                    className="p-1 rounded hover:bg-[#18181b] hover:text-white"
                    title="Reset View"
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomAction({ type: 'in', timestamp: Date.now() })}
                    className="p-1 rounded hover:bg-[#18181b] hover:text-white"
                    title="Zoom In"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomAction({ type: 'out', timestamp: Date.now() })}
                    className="p-1 rounded hover:bg-[#18181b] hover:text-white"
                    title="Zoom Out"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomAction({ type: 'fit', timestamp: Date.now() })}
                    className="p-1 rounded hover:bg-[#18181b] hover:text-white"
                    title="Fit View"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'topology' ? (
              splitView ? (
                <div className="w-full h-full flex flex-row overflow-hidden">
                  <div className="w-1/2 h-full border-r border-[#27272a] relative">
                    <WorkflowTopology
                      events={events}
                      selectedEvent={selectedEvent}
                      zoomAction={zoomAction}
                      onSelectNode={(nodeId) => {
                        if (nodeId === 'node-artifact') {
                          setActiveTab('preview');
                        }
                      }}
                      onViewArtifact={() => setActiveTab('preview')}
                    />
                  </div>
                  <div className="w-1/2 h-full overflow-hidden bg-[#09090b]">
                    <ArtifactPreview runId={selectedRunId} />
                  </div>
                </div>
              ) : (
                <WorkflowTopology
                  events={events}
                  selectedEvent={selectedEvent}
                  zoomAction={zoomAction}
                  onSelectNode={(nodeId) => {
                    if (nodeId === 'node-artifact') {
                      setActiveTab('preview');
                    }
                  }}
                  onViewArtifact={() => setActiveTab('preview')}
                />
              )
            ) : activeTab === 'preview' ? (
              <ArtifactPreview runId={selectedRunId} />
            ) : (
              /* High-Density Latency Waterfall (Gantt) */
              <div className="w-full h-full overflow-y-auto p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-2 text-zinc-400">
                  <span className="font-semibold text-white">Execution Spans & Latency Bottlenecks</span>
                  <span>Trace Window: {formatDuration(totalWindowMs)}</span>
                </div>

                {/* Ruler */}
                <div className="relative h-4 text-[10px] text-zinc-500 border-b border-[#27272a]/60">
                  <span className="absolute left-0">0ms</span>
                  <span className="absolute left-1/4">{formatDuration(totalWindowMs * 0.25)}</span>
                  <span className="absolute left-1/2">{formatDuration(totalWindowMs * 0.5)}</span>
                  <span className="absolute left-3/4">{formatDuration(totalWindowMs * 0.75)}</span>
                  <span className="absolute right-0">{formatDuration(totalWindowMs)}</span>
                </div>

                {/* Spans */}
                <div className="space-y-1.5 pt-1">
                  {spanEvents.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">No span operations recorded</div>
                  ) : (
                    spanEvents.map((evt) => {
                      const evtTime = new Date(evt.occurred_at).getTime();
                      const offsetPercent = Math.max(0, Math.min(100, ((evtTime - minTime) / totalWindowMs) * 100));
                      const duration = evt.duration_ms || 120;
                      const durationPercent = Math.max(2, Math.min(100 - offsetPercent, (duration / totalWindowMs) * 100));

                      const isLLM = evt.event_type.startsWith('llm.');
                      const isTool = evt.event_type.startsWith('tool.');
                      const isRetry = evt.event_type === 'retry.scheduled';
                      const isError = evt.status === 'error';

                      let barBg = 'bg-blue-600';
                      if (isLLM) barBg = 'bg-indigo-500';
                      else if (isTool) barBg = isError ? 'bg-rose-500' : 'bg-sky-500';
                      else if (isRetry) barBg = 'bg-amber-500';

                      return (
                        <div
                          key={evt.event_id}
                          onClick={() => {
                            setSelectedEvent(evt);
                            setRightTab('inspector');
                          }}
                          className={`p-2 rounded border cursor-pointer transition-all ${
                            selectedEvent?.event_id === evt.event_id
                              ? 'bg-[#18181b] border-blue-500'
                              : 'bg-[#111114] border-[#27272a] hover:border-[#3f3f46]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-zinc-500">#{evt.sequence}</span>
                              <span className="font-semibold text-zinc-200">
                                {evt.payload?.tool_name || evt.payload?.model || evt.event_type}
                              </span>
                              {evt.span_id && <span className="text-zinc-500 text-[10px]">[{evt.span_id}]</span>}
                            </div>
                            <span className="text-zinc-400 tabular-nums">{formatDuration(evt.duration_ms)}</span>
                          </div>

                          <div className="w-full bg-[#18181b] h-2 rounded overflow-hidden relative">
                            <div
                              className={`h-full rounded ${barBg}`}
                              style={{
                                marginLeft: `${offsetPercent}%`,
                                width: `${durationPercent}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: TIMELINE & EVENT INSPECTOR */}
        <div
          className={`border-l border-[#27272a] bg-[#111114] flex flex-col transition-all duration-150 shrink-0 ${
            isRightCollapsed ? 'w-10' : 'w-80'
          }`}
        >
          {/* Subheader */}
          <div className="h-10 border-b border-[#27272a] px-3 flex items-center justify-between text-xs font-mono text-zinc-400">
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="p-1 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white mr-auto transition-colors"
              title={isRightCollapsed ? 'Expand inspector' : 'Collapse inspector'}
            >
              {isRightCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {!isRightCollapsed && (
              <div className="flex items-center p-0.5 rounded bg-[#18181b] border border-[#27272a]">
                <button
                  onClick={() => setRightTab('timeline')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    rightTab === 'timeline' ? 'bg-[#27272a] text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setRightTab('inspector')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    rightTab === 'inspector' ? 'bg-[#27272a] text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Inspector
                </button>
              </div>
            )}
          </div>

          {!isRightCollapsed && (
            <>
              {rightTab === 'timeline' ? (
                <>
                  {/* Step Search Filter */}
                  <div className="p-2 border-b border-[#27272a]">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Filter event stream..."
                        value={filterStepText}
                        onChange={(e) => setFilterStepText(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 rounded bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Chronological Step Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-10 text-xs text-zinc-500">
                        No events recorded
                      </div>
                    ) : (
                      filteredEvents.map((evt) => {
                        const isExpanded = expandedEventId === evt.event_id;
                        const isLLM = evt.event_type.startsWith('llm.');
                        const isTool = evt.event_type.startsWith('tool.');
                        const isRetry = evt.event_type === 'retry.scheduled';
                        const isError = evt.status === 'error';

                        const tagLabel = isLLM ? 'LLM' : isTool ? 'TOOL' : isRetry ? 'RETRY' : 'RUN';
                        const tagColor = isLLM
                          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                          : isTool
                          ? isError
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            : 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                          : isRetry
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-zinc-400 bg-[#18181b] border-[#27272a]';

                        const name =
                          evt.payload?.tool_name || evt.payload?.model?.replace('models/', '') || evt.event_type;

                        return (
                          <div
                            key={evt.event_id}
                            onClick={() => setSelectedEvent(evt)}
                            className={`p-2 rounded border transition-all text-xs cursor-pointer ${
                              evt.event_id === selectedEvent?.event_id
                                ? 'border-blue-500 bg-[#18181b]'
                                : 'border-[#27272a] bg-[#111114] hover:border-[#3f3f46]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="flex items-center space-x-1.5 truncate">
                                <span className={`px-1 py-0.2 rounded text-[9px] border font-semibold ${tagColor}`}>
                                  {tagLabel}
                                </span>
                                <span className="text-zinc-400 font-semibold text-xs truncate">{name}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedEventId(isExpanded ? null : evt.event_id);
                                }}
                                className="text-[10px] text-zinc-400 hover:text-white underline font-mono"
                              >
                                {isExpanded ? 'Hide' : 'Payload'}
                              </button>
                            </div>

                            <div className="text-[11px] text-zinc-400 line-clamp-2">
                              {evt.payload?.response_summary ||
                                evt.payload?.result_summary ||
                                evt.payload?.summary ||
                                evt.payload?.task_label ||
                                JSON.stringify(evt.payload?.safe_arguments || '')}
                            </div>

                            {(evt.duration_ms || isLLM) && (
                              <div className="flex items-center space-x-1.5 mt-1.5 pt-1 border-t border-[#1e1e22] text-[10px] tabular-nums">
                                {evt.duration_ms && (
                                  <span className="text-zinc-400">
                                    {formatDuration(evt.duration_ms)}
                                  </span>
                                )}
                                {isLLM && evt.payload?.input_tokens && (
                                  <span className="text-indigo-400">
                                    ↑{evt.payload.input_tokens} tok / ↓{evt.payload.output_tokens || 0} tok
                                  </span>
                                )}
                              </div>
                            )}

                            {isExpanded && (
                              <div className="mt-2 pt-1.5 border-t border-[#27272a] space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                  <span>Sanitized Payload</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(JSON.stringify(evt.payload, null, 2), evt.event_id);
                                    }}
                                    className="text-blue-400 hover:text-white"
                                  >
                                    {copiedId === evt.event_id ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <pre className="p-2 rounded bg-[#09090b] border border-[#27272a] text-[10px] text-zinc-300 overflow-x-auto max-h-40">
                                  {JSON.stringify(evt.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                /* Inspector View */
                <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
                  {selectedEvent ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                        <div>
                          <div className="text-[10px] text-zinc-500">SEQUENCE #{selectedEvent.sequence}</div>
                          <div className="font-semibold text-zinc-100">{selectedEvent.event_type}</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(selectedEvent, null, 2), selectedEvent.event_id)}
                          className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-white text-[10px]"
                        >
                          {copiedId === selectedEvent.event_id ? 'Copied' : 'Copy JSON'}
                        </button>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-1 border-b border-[#1e1e22]">
                          <span className="text-zinc-500">Status</span>
                          <span className={selectedEvent.status === 'error' ? 'text-rose-400' : 'text-emerald-400'}>
                            {selectedEvent.status}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1e1e22]">
                          <span className="text-zinc-500">Source</span>
                          <span className="text-zinc-300">{selectedEvent.source || 'agent'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1e1e22]">
                          <span className="text-zinc-500">Duration</span>
                          <span className="text-zinc-300">{formatDuration(selectedEvent.duration_ms)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1e1e22]">
                          <span className="text-zinc-500">Redaction</span>
                          <span className="text-emerald-400">Enforced (Zero-Leaks)</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Payload</div>
                        <pre className="p-2.5 rounded bg-[#09090b] border border-[#27272a] text-[10px] text-zinc-300 overflow-x-auto max-h-72">
                          {JSON.stringify(selectedEvent.payload, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-500">Select an event from the timeline or canvas</div>
                  )}
                </div>
              )}

              {/* Panel Footer */}
              <div className="h-8 border-t border-[#27272a] px-3 flex items-center justify-end text-[10px] font-mono text-zinc-500">
                <button onClick={() => setIsRightCollapsed(true)} className="hover:text-zinc-300 transition-colors">
                  COLLAPSE »
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-[#27272a] rounded-lg p-5 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-white">System Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">Model Inference</label>
                <div className="p-2 rounded bg-[#18181b] border border-[#27272a] text-zinc-200 flex justify-between">
                  <span>Google Gemini 2.5 Flash</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">API Base URL</label>
                <div className="p-2 rounded bg-[#18181b] border border-[#27272a] text-zinc-200">
                  http://localhost:4000
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">Database Engine</label>
                <div className="p-2 rounded bg-[#18181b] border border-[#27272a] text-zinc-200 flex justify-between">
                  <span>PostgreSQL (PGlite Embedded)</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">Redaction Guard</label>
                <div className="p-2 rounded bg-[#18181b] border border-[#27272a] text-zinc-400">
                  Recursive redaction of keys, authorization headers, and credentials.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-[#27272a] rounded-lg p-5 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-white">Platform Guidance</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded bg-[#18181b] border border-[#27272a] space-y-0.5">
                <div className="text-zinc-200 font-semibold">1. Autonomous Task Execution</div>
                <div className="text-zinc-400 text-[11px]">
                  Type a prompt into the top command bar and press Enter to start the ReAct agent runner.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#18181b] border border-[#27272a] space-y-0.5">
                <div className="text-zinc-200 font-semibold">2. Resilience & Failure Injection</div>
                <div className="text-zinc-400 text-[11px]">
                  With &apos;Seed Controlled Tool Failure&apos; enabled, the agent intercepts failures, triggers backoff retries, and verifies recovery.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#18181b] border border-[#27272a] space-y-0.5">
                <div className="text-zinc-200 font-semibold">3. Live Result Preview</div>
                <div className="text-zinc-400 text-[11px]">
                  Click the &apos;Live Result&apos; tab or double-click the Output node to inspect the final generated HTML or code.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
