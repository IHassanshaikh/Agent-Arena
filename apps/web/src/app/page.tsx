'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Play,
  RotateCcw,
  Sun,
  Moon,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  Menu,
  ChevronDown,
  X,
  Check,
  Copy,
  Trash2,
  Download,
  Eye,
  FileCode,
  Globe
} from 'lucide-react';
import { fetchRuns, fetchRunEvents, launchBenchmark, deleteRun, exportRun } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatDuration, formatTimeAgo, formatTokens } from '@/lib/formatters';
import { WorkflowTopology } from '@/components/flow/WorkflowTopology';
import { ArtifactPreview } from '@/components/trace/ArtifactPreview';

export default function TraceStudioPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Layout view controls: topology, trace, or preview
  const [activeTab, setActiveTab] = useState<'topology' | 'trace' | 'preview'>('topology');
  const [splitView, setSplitView] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Modals & Menus
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRunSelector, setShowRunSelector] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Canvas zoom action dispatcher
  const [zoomAction, setZoomAction] = useState<{ type: 'in' | 'out' | 'fit' | 'reset'; timestamp: number } | null>(null);

  // Theme brightness state: true pitch-black vs dark slate
  const [themeMode, setThemeMode] = useState<'black' | 'slate'>('black');

  // Prompt input state
  const [promptInput, setPromptInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [filterStepText, setFilterStepText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    fetchRunEvents(selectedRunId).then((res) => {
      const evts = res.events || [];
      setEvents(evts);
      if (evts.length > 0) {
        highestSeqRef.current = Math.max(...evts.map((e: any) => e.sequence));
        setSelectedEvent(evts[evts.length - 1]);
      }
    }).catch(console.error);
  }, [selectedRunId]);

  // 3. Socket.IO live stream
  useEffect(() => {
    if (!selectedRunId) return;
    const socket = getSocket();

    socket.emit('run:join', { runId: selectedRunId });

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
      socket.emit('run:leave', { runId: selectedRunId });
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
        agent_id: 'gemini-agent',
        prompt: userPrompt,
        seeded_failure: false
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

  const bgDeep = themeMode === 'black' ? 'bg-[#000000]' : 'bg-[#090d16]';
  const borderHairline = 'border-[#18181b]';

  return (
    <div className={`flex flex-col h-screen w-screen ${bgDeep} text-[#e4e4e7] select-none overflow-hidden font-sans`}>
      {/* 1. TOP BAR */}
      <header className={`h-14 border-b ${borderHairline} ${bgDeep} px-4 flex items-center justify-between gap-4 shrink-0 z-30`}>
        <div className="flex items-center space-x-6">
          {/* Logo mark */}
          <div className="flex items-center space-x-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]"></span>
            <span className="font-semibold text-sm tracking-tight text-white font-mono">tracesage</span>
          </div>

          {/* Telemetry Status Strip */}
          <div className="flex items-center space-x-2 text-xs font-mono text-[#a1a1aa] tabular-nums">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0e0e11] border border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"></span>
              <span>0 ev/s</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0e0e11] border border-white/5">
              <span className={`h-1.5 w-1.5 rounded-full ${isExecuting ? 'bg-[#38bdf8]' : 'bg-[#71717a]'}`}></span>
              <span>{isExecuting ? '1 running' : '0 running'}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0e0e11] border border-white/5 text-[#22c55e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"></span>
              <span>connected</span>
            </div>
          </div>
        </div>

        {/* Prompt Runner Input */}
        <form onSubmit={handleRunPrompt} className="flex-1 max-w-lg mx-4 relative">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#71717a]" />
          <input
            type="text"
            placeholder="Search runs or enter prompt to test..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="w-full pl-9 pr-20 py-1.5 rounded-lg bg-[#0e0e12] border border-white/10 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
          />
          <button
            type="submit"
            disabled={isExecuting || !promptInput.trim()}
            className="absolute right-1 top-1 px-2.5 py-1 rounded-md bg-[#18181b] hover:bg-[#27272a] border border-white/10 text-white font-mono text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40"
          >
            {isExecuting ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            <span>Run</span>
          </button>
        </form>

        {/* Utility Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setThemeMode(themeMode === 'black' ? 'slate' : 'black')}
            className="p-2 rounded-lg hover:bg-[#18181b] text-[#a1a1aa] hover:text-white transition-colors"
            title="Toggle theme background"
          >
            {themeMode === 'black' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-lg hover:bg-[#18181b] text-[#a1a1aa] hover:text-white transition-colors"
            title="Shortcuts and help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg hover:bg-[#18181b] text-[#a1a1aa] hover:text-white transition-colors"
            title="System Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. THREE-PANEL STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: RUNS LIST */}
        <div
          className={`border-r ${borderHairline} ${bgDeep} flex flex-col transition-all duration-150 shrink-0 ${
            isLeftCollapsed ? 'w-12' : 'w-[260px]'
          }`}
        >
          {/* Runs Subheader */}
          <div className={`h-11 border-b ${borderHairline} px-3 flex items-center justify-between text-xs font-mono text-[#a1a1aa]`}>
            {!isLeftCollapsed && (
              <div className="flex items-center space-x-2 relative">
                <span className="font-bold text-white text-xs uppercase tracking-wider">Runs</span>
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#0e0e12] border border-[rgba(255,255,255,0.08)] text-[11px] text-[#a1a1aa] hover:text-white"
                >
                  <span className="capitalize">{statusFilter}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showFilterMenu && (
                  <div className="absolute top-8 left-8 z-40 bg-[#0e0e12] border border-[#27272a] rounded-xl p-1 shadow-2xl space-y-0.5 w-32">
                    {(['all', 'completed', 'failed', 'running'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                          statusFilter === st ? 'bg-[#18181b] text-[#38bdf8] font-bold' : 'hover:bg-[#18181b] text-[#a1a1aa]'
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
              className="p-1 rounded-md hover:bg-[#18181b] text-[#71717a] hover:text-white ml-auto transition-colors"
              title={isLeftCollapsed ? 'Expand runs' : 'Collapse runs'}
            >
              {isLeftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Runs Items */}
          {!isLeftCollapsed && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {visibleRuns.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-[#71717a]">
                  No {statusFilter !== 'all' ? statusFilter : ''} runs found
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
                      className={`group p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#121217] border-[#3b82f6] text-white shadow-lg'
                          : 'border-transparent hover:bg-[#0e0e12] text-[#a1a1aa]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs mb-1">
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isRunning
                                ? 'bg-[#38bdf8] animate-ping'
                                : isCompleted
                                ? 'bg-[#22c55e]'
                                : isFailed
                                ? 'bg-[#ef4444]'
                                : 'bg-[#71717a]'
                            }`}
                          ></span>
                          <span className="font-bold text-xs text-white truncate">
                            {r.id.slice(0, 8)}...
                          </span>
                        </div>

                        {/* Action buttons on hover */}
                        <div className="hidden group-hover:flex items-center space-x-1">
                          <button
                            onClick={(e) => handleExportRun(e, r.id)}
                            className="p-1 rounded-md bg-[#1c1c22] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                            title="Export JSON"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRun(e, r.id)}
                            className="p-1 rounded-md bg-[#1c1c22] hover:bg-[#3f1013] text-[#71717a] hover:text-[#ef4444]"
                            title="Delete run"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-[#d4d4d8] font-mono truncate mb-1" title={r.task_label}>
                        {r.task_label}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a] tabular-nums">
                        <span>{r.metrics?.event_count || 12} steps</span>
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
            <div className={`h-10 border-t ${borderHairline} px-3 flex items-center justify-between text-xs font-mono text-[#71717a] tabular-nums`}>
              <span>{visibleRuns.length} runs</span>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                className="hover:text-white transition-colors text-[11px]"
              >
                COLLAPSE «
              </button>
            </div>
          )}
        </div>

        {/* CENTER PANEL: WORKFLOW CANVAS & RESULT PREVIEW */}
        <div className={`flex-1 flex flex-col ${bgDeep} overflow-hidden relative`}>
          {/* Canvas Subheader with 3 Tabs */}
          <div className={`h-11 border-b ${borderHairline} px-4 flex items-center justify-between ${bgDeep} z-20`}>
            <div className="flex items-center space-x-3">
              {/* Segmented Control: Topology | Timeline | Result */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#0e0e12] border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('topology')}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${
                    activeTab === 'topology'
                      ? 'bg-[#18181b] text-white font-medium border border-white/10'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  Topology
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${
                    activeTab === 'trace'
                      ? 'bg-[#18181b] text-white font-medium border border-white/10'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-[#0f241a] text-[#22c55e] font-medium border border-[#22c55e]/30'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 text-[#22c55e]" />
                  <span>Result</span>
                </button>
              </div>

              {/* Split View Toggle */}
              {activeTab === 'topology' && (
                <button
                  onClick={() => setSplitView(!splitView)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
                    splitView
                      ? 'bg-[#18181b] border-[#38bdf8] text-[#38bdf8] font-medium'
                      : 'border-white/10 bg-[#0e0e12] text-[#a1a1aa] hover:text-white'
                  }`}
                  title="Toggle Split View: Flow + Live Result"
                >
                  <span>◫ Split</span>
                </button>
              )}

              {/* Run Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRunSelector(!showRunSelector)}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#0e0e12] border border-white/10 text-xs font-mono text-white hover:border-white/20"
                >
                  <span className="font-medium truncate max-w-[140px]">
                    {selectedRun ? `${selectedRun.id.slice(0, 8)}...` : 'Select Run'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
                </button>

                {showRunSelector && (
                  <div className="absolute top-9 left-0 z-40 bg-[#0e0e12] border border-[#27272a] rounded-xl p-1.5 shadow-2xl space-y-0.5 w-64 max-h-72 overflow-y-auto">
                    {runs.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRunId(r.id);
                          setShowRunSelector(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                          r.id === selectedRunId ? 'bg-[#18181b] text-[#38bdf8] font-medium' : 'hover:bg-[#18181b] text-[#a1a1aa]'
                        }`}
                      >
                        <span className="truncate">{r.id.slice(0, 8)} - {r.task_label.slice(0, 16)}</span>
                        {r.id === selectedRunId && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Zoom & Layout Controls */}
            {activeTab === 'topology' && (
              <div className="flex items-center space-x-1 text-[#a1a1aa]">
                <button
                  onClick={() => setZoomAction({ type: 'reset', timestamp: Date.now() })}
                  className="p-1.5 rounded-lg hover:bg-[#18181b] hover:text-white transition-colors"
                  title="Reset View"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoomAction({ type: 'in', timestamp: Date.now() })}
                  className="p-1.5 rounded-lg hover:bg-[#18181b] hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoomAction({ type: 'out', timestamp: Date.now() })}
                  className="p-1.5 rounded-lg hover:bg-[#18181b] hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoomAction({ type: 'fit', timestamp: Date.now() })}
                  className="p-1.5 rounded-lg hover:bg-[#18181b] hover:text-white transition-colors"
                  title="Fit View"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Main Canvas Body */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'topology' ? (
              splitView ? (
                <div className="w-full h-full flex flex-row overflow-hidden">
                  <div className="w-1/2 h-full border-r border-[#18181b] relative">
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
                  <div className="w-1/2 h-full overflow-hidden bg-black">
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
              /* Waterfall Gantt Trace View */
              <div className="w-full h-full overflow-y-auto p-6 space-y-2.5 font-mono">
                <div className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Execution spans
                </div>
                {events.map((evt) => {
                  const isLLM = evt.event_type.startsWith('llm.');
                  const isTool = evt.event_type.startsWith('tool.');
                  const dur = evt.duration_ms || (isLLM ? 1800 : 40);
                  const widthPercent = Math.min(100, Math.max(6, (dur / 2500) * 100));

                  return (
                    <div key={evt.event_id} className="p-3 rounded-xl bg-[#0e0e12] border border-[rgba(255,255,255,0.06)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLLM ? 'bg-[#0c1f36] text-[#38bdf8]' : isTool ? 'bg-[#261a0d] text-[#f59e0b]' : 'bg-[#18181b] text-[#a1a1aa]'
                          }`}>
                            {evt.event_type}
                          </span>
                          <span className="font-bold text-white">
                            {evt.payload?.tool_name || evt.payload?.model || evt.span_id || 'root'}
                          </span>
                        </div>
                        <span className="text-[#a1a1aa] text-xs tabular-nums">{formatDuration(dur)}</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#18181b] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLLM ? 'bg-[#38bdf8]' : isTool ? 'bg-[#f59e0b]' : 'bg-[#a1a1aa]'}`}
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: TIMELINE */}
        <div
          className={`border-l ${borderHairline} ${bgDeep} flex flex-col transition-all duration-150 shrink-0 ${
            isRightCollapsed ? 'w-12' : 'w-[350px]'
          }`}
        >
          {/* Timeline Subheader */}
          <div className={`h-11 border-b ${borderHairline} px-3 flex items-center justify-between text-xs font-mono text-[#a1a1aa]`}>
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="p-1 rounded-md hover:bg-[#18181b] text-[#71717a] hover:text-white mr-auto transition-colors"
              title={isRightCollapsed ? 'Expand timeline' : 'Collapse timeline'}
            >
              {isRightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {!isRightCollapsed && (
              <div className="flex items-center space-x-2 truncate max-w-[260px]">
                <span className="font-bold text-white text-xs uppercase tracking-wider">Timeline</span>
                <span className="text-xs text-[#71717a] font-mono truncate">
                  ({selectedRunId ? selectedRunId.slice(0, 8) : 'select run'})
                </span>
              </div>
            )}
          </div>

          {!isRightCollapsed && (
            <>
              {/* Step Search Filter */}
              <div className={`p-2.5 border-b ${borderHairline}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" />
                  <input
                    type="text"
                    placeholder="Filter steps... (tool, agent, text, type)"
                    value={filterStepText}
                    onChange={(e) => setFilterStepText(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-1.5 rounded-lg bg-[#0e0e12] border border-[rgba(255,255,255,0.08)] text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] font-mono"
                  />
                </div>
              </div>

              {/* Chronological Step Cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#71717a] font-mono">
                    No steps recorded for this run
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const isExpanded = expandedEventId === evt.event_id;
                    const isLLM = evt.event_type.startsWith('llm.');
                    const isTool = evt.event_type.startsWith('tool.');
                    const isRetry = evt.event_type === 'retry.scheduled';
                    const tagLabel = isLLM ? 'LLM' : isTool ? 'TOOL' : isRetry ? 'RETRY' : 'CHAIN';
                    const tagColor = isLLM
                      ? 'text-[#38bdf8] bg-[#0c1f36] border-[#38bdf8]/30'
                      : isTool
                      ? 'text-[#f59e0b] bg-[#261a0d] border-[#f59e0b]/30'
                      : isRetry
                      ? 'text-[#ef4444] bg-[#2a0e10] border-[#ef4444]/30'
                      : 'text-[#a1a1aa] bg-[#18181b] border-[rgba(255,255,255,0.06)]';

                    const name = evt.payload?.tool_name || evt.payload?.model?.replace('models/', '') || evt.event_type;

                    return (
                      <div
                        key={evt.event_id}
                        className={`p-3 rounded-xl border transition-all text-xs ${
                          evt.event_id === selectedEvent?.event_id
                            ? 'border-[#38bdf8] bg-[#121217]'
                            : 'border-[rgba(255,255,255,0.06)] bg-[#0e0e12] hover:border-[rgba(255,255,255,0.14)]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <div className="flex items-center space-x-2 truncate">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${tagColor}`}>
                              {tagLabel}
                            </span>
                            <span className="text-[#71717a] text-[11px] tabular-nums">
                              {new Date(evt.occurred_at).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <span className="text-white truncate font-bold text-xs">{name}</span>
                          </div>

                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.event_id)}
                            className="px-2 py-0.5 rounded bg-[#1c1c22] hover:bg-[#27272a] text-xs text-[#a1a1aa] hover:text-white transition-colors font-medium"
                          >
                            {isExpanded ? 'Close' : 'Open'}
                          </button>
                        </div>

                        <div className="text-xs text-[#d4d4d8] line-clamp-2">
                          {evt.payload?.response_summary ||
                            evt.payload?.result_summary ||
                            evt.payload?.summary ||
                            evt.payload?.task_label ||
                            JSON.stringify(evt.payload?.safe_arguments || '')}
                        </div>

                        {(evt.duration_ms || isLLM) && (
                          <div className="flex items-center space-x-2 mt-2 pt-1.5 border-t border-[rgba(255,255,255,0.04)] text-xs tabular-nums">
                            {evt.duration_ms && (
                              <span className="px-2 py-0.5 rounded bg-[#18181b] text-white font-semibold">
                                {formatDuration(evt.duration_ms)}
                              </span>
                            )}
                            {isLLM && evt.payload?.input_tokens && (
                              <span className="px-2 py-0.5 rounded bg-[#072412] border border-[rgba(34,197,94,0.3)] text-[#22c55e] font-bold">
                                ↑{evt.payload.input_tokens} ↓{evt.payload.output_tokens || 0}
                              </span>
                            )}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.08)] space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                              <span>Safe Payload</span>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(evt.payload, null, 2), evt.event_id)}
                                className="flex items-center space-x-1 text-[#38bdf8] hover:text-white text-[11px]"
                              >
                                {copiedId === evt.event_id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                <span>{copiedId === evt.event_id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-black border border-[rgba(255,255,255,0.08)] text-xs text-[#d4d4d8] overflow-x-auto max-h-48 font-mono">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Timeline Footer */}
              <div className={`h-10 border-t ${borderHairline} px-3 flex items-center justify-end text-xs font-mono text-[#71717a]`}>
                <button
                  onClick={() => setIsRightCollapsed(true)}
                  className="hover:text-white transition-colors"
                >
                  COLLAPSE »
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e12] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-[#38bdf8]" />
                <h3 className="text-sm font-bold text-white">System Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg hover:bg-[#18181b] text-[#71717a] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-bold">Connected Model & Provider</label>
                <div className="p-2.5 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] text-white flex items-center justify-between">
                  <span>Google Gemini 2.5 Flash</span>
                  <span className="text-[#22c55e] font-bold">Active</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-bold">Gateway URL</label>
                <div className="p-2.5 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] text-white">
                  http://localhost:4000
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-bold">Storage Engine</label>
                <div className="p-2.5 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] text-white flex items-center justify-between">
                  <span>Embedded PostgreSQL (PGlite)</span>
                  <span className="text-[#22c55e] font-bold">Healthy</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-bold">Redaction Policy</label>
                <div className="p-2.5 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] text-[#a1a1aa]">
                  Strict Multi-Pass Redaction (Protects API Keys & Bearer Tokens)
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HELP & SHORTCUTS MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e12] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-[#38bdf8]" />
                <h3 className="text-sm font-bold text-white">Shortcuts & Guidance</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-[#18181b] text-[#71717a] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] space-y-1">
                <div className="text-white font-bold">Running an Agent Flow</div>
                <div className="text-[#a1a1aa]">
                  Type any task in the top input and press <strong className="text-[#38bdf8]">Enter</strong> or click <strong className="text-[#38bdf8]">Run</strong>.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] space-y-1">
                <div className="text-white font-bold">Viewing Live Results</div>
                <div className="text-[#a1a1aa]">
                  Click the <strong className="text-[#22c55e]">Result Preview</strong> tab or click the <strong className="text-[#22c55e]">Artifact</strong> node in the canvas to preview the generated HTML page live.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#18181b] border border-[rgba(255,255,255,0.06)] space-y-1">
                <div className="text-white font-bold">Timeline Inspection</div>
                <div className="text-[#a1a1aa]">
                  Click <strong className="text-white">[Open]</strong> on any step card in the right timeline to inspect safe parameters and token counts.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-colors"
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
