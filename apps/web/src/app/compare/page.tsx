'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Coins,
  Cpu,
  Clock,
  RotateCcw,
  Trophy,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { fetchRuns, compareRuns } from '@/lib/api';
import { formatCost, formatDuration, formatTokens } from '@/lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Logo } from '@/components/brand/Logo';

function CompareContent() {
  const searchParams = useSearchParams();
  const initialLeft = searchParams.get('left') || '';
  const initialRight = searchParams.get('right') || '';

  const [runsList, setRunsList] = useState<any[]>([]);
  const [leftId, setLeftId] = useState<string>(initialLeft);
  const [rightId, setRightId] = useState<string>(initialRight);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns().then((res) => {
      const runs = res.runs || [];
      setRunsList(runs);
      if (!leftId && runs.length > 0) setLeftId(runs[0].id);
      if (!rightId && runs.length > 1) setRightId(runs[1].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (leftId && rightId && leftId !== rightId) {
      setLoading(true);
      setError(null);
      compareRuns(leftId, rightId)
        .then((res) => setComparisonData(res))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [leftId, rightId]);

  const leftRun = comparisonData?.left?.run;
  const rightRun = comparisonData?.right?.run;
  const comp = comparisonData?.comparison;

  const chartData = leftRun && rightRun ? [
    {
      metric: 'Tokens (k)',
      [leftRun.agent_id || 'Agent A']: Number(((leftRun.metrics?.total_tokens || 0) / 1000).toFixed(1)),
      [rightRun.agent_id || 'Agent B']: Number(((rightRun.metrics?.total_tokens || 0) / 1000).toFixed(1))
    },
    {
      metric: 'Cost (¢)',
      [leftRun.agent_id || 'Agent A']: Number(((leftRun.metrics?.estimated_cost_usd || 0) * 100).toFixed(2)),
      [rightRun.agent_id || 'Agent B']: Number(((rightRun.metrics?.estimated_cost_usd || 0) * 100).toFixed(2))
    },
    {
      metric: 'Duration (s)',
      [leftRun.agent_id || 'Agent A']: Number(((leftRun.metrics?.duration_ms || 0) / 1000).toFixed(1)),
      [rightRun.agent_id || 'Agent B']: Number(((rightRun.metrics?.duration_ms || 0) / 1000).toFixed(1))
    }
  ] : [];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-12 border-b border-[#27272a] bg-[#111114] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center space-x-2 font-mono text-xs">
            <GitCompare className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold text-white">Run Comparison</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-7xl w-full mx-auto">
        {/* Run Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111114] p-3.5 rounded-lg border border-[#27272a]">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-blue-400 mb-1.5 uppercase tracking-wider">
              Run A (Baseline / Reference)
            </label>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full p-2 rounded bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {runsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.agent_id} — {r.task_label?.slice(0, 36)} ({r.status}) [{r.id.slice(0, 8)}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold text-indigo-400 mb-1.5 uppercase tracking-wider">
              Run B (Alternative / Candidate)
            </label>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full p-2 rounded bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {runsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.agent_id} — {r.task_label?.slice(0, 36)} ({r.status}) [{r.id.slice(0, 8)}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-400 flex items-center justify-center space-x-2 font-mono text-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <span>Computing comparative metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-[#111114] border border-rose-500/40 text-center text-rose-400 text-xs font-mono">
            {error}
          </div>
        ) : !comparisonData ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs">
            Select two distinct runs above to view comparative analysis.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Outcome Summary Card */}
            <div className="p-4 rounded-lg bg-[#111114] border border-[#27272a] flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-amber-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">EVALUATION SUMMARY</div>
                  <div className="text-sm font-semibold text-white">
                    {comp.winner === 'left' ? `${leftRun.agent_id} outperformed in execution` : `${rightRun.agent_id} outperformed in execution`}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs tabular-nums">
                <div>
                  <span className="text-zinc-500">Token Delta: </span>
                  <span className={comp.token_delta <= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {comp.token_delta > 0 ? '+' : ''}{formatTokens(comp.token_delta)} ({comp.token_delta_percent.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-zinc-700">•</span>
                <div>
                  <span className="text-zinc-500">Cost Delta: </span>
                  <span className={comp.cost_delta <= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {comp.cost_delta > 0 ? '+' : ''}{formatCost(comp.cost_delta)}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Comparison Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#111114] border border-[#27272a] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">STATUS</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-semibold">{leftRun.status}</span>
                  <span className="text-zinc-600">vs</span>
                  <span className="text-indigo-400 font-semibold">{rightRun.status}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#111114] border border-[#27272a] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">TOTAL TOKENS</div>
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="text-blue-400 font-semibold">{formatTokens(leftRun.metrics?.total_tokens)}</span>
                  <span className="text-zinc-600">vs</span>
                  <span className="text-indigo-400 font-semibold">{formatTokens(rightRun.metrics?.total_tokens)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#111114] border border-[#27272a] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ESTIMATED COST</div>
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="text-blue-400 font-semibold">{formatCost(leftRun.metrics?.estimated_cost_usd)}</span>
                  <span className="text-zinc-600">vs</span>
                  <span className="text-indigo-400 font-semibold">{formatCost(rightRun.metrics?.estimated_cost_usd)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#111114] border border-[#27272a] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">RETRIES / RECOVERIES</div>
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="text-blue-400 font-semibold">{leftRun.metrics?.retries || 0} retries</span>
                  <span className="text-zinc-600">vs</span>
                  <span className="text-indigo-400 font-semibold">{rightRun.metrics?.retries || 0} retries</span>
                </div>
              </div>
            </div>

            {/* Comparative Bar Chart */}
            <div className="p-4 rounded-lg bg-[#111114] border border-[#27272a] space-y-2">
              <div className="text-xs font-mono font-semibold text-zinc-300">
                Resource Consumption Breakdown
              </div>
              <div className="h-56 w-full font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="metric" stroke="#71717a" textAnchor="middle" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '6px' }}
                    />
                    <Legend />
                    <Bar dataKey={leftRun.agent_id || 'Agent A'} fill="#2563eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={rightRun.agent_id || 'Agent B'} fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side by side event lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Left Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5">
                  <div className="font-semibold text-blue-400">
                    <span>{leftRun.agent_id} ({comparisonData.left.events.length} events)</span>
                  </div>
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {comparisonData.left.events.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-[#111114] border border-[#27272a] text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                        <span>#{evt.sequence} • {evt.event_type}</span>
                        <span>{formatDuration(evt.duration_ms)}</span>
                      </div>
                      <div className="text-zinc-300 truncate">
                        {evt.payload?.summary || evt.payload?.result_summary || evt.payload?.tool_name || evt.payload?.model || evt.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5">
                  <div className="font-semibold text-indigo-400">
                    <span>{rightRun.agent_id} ({comparisonData.right.events.length} events)</span>
                  </div>
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {comparisonData.right.events.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-[#111114] border border-[#27272a] text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                        <span>#{evt.sequence} • {evt.event_type}</span>
                        <span>{formatDuration(evt.duration_ms)}</span>
                      </div>
                      <div className="text-zinc-300 truncate">
                        {evt.payload?.summary || evt.payload?.result_summary || evt.payload?.tool_name || evt.payload?.model || evt.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RunComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24 text-zinc-400 flex items-center justify-center space-x-2 font-mono text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <span>Loading comparison workspace...</span>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
