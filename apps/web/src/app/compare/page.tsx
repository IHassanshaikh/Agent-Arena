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
  Sparkles,
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

  // Chart data
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
            <Link href="/" className="hover:text-blue-400 flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Runs Overview</span>
            </Link>
            <span>/</span>
            <span className="text-gray-300">Run Comparison</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <GitCompare className="h-6 w-6 text-blue-400" />
            <span>Side-by-Side Agent Comparison</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Evaluate differences in task success, token consumption, cost, and failure resilience.
          </p>
        </div>
      </div>

      {/* Run Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-arena-card p-4 rounded-xl border border-arena-border">
        <div>
          <label className="block text-xs font-mono font-semibold text-blue-400 mb-1.5 uppercase">
            Run A (Baseline / Reference)
          </label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full p-2 rounded-lg bg-arena-bg border border-arena-border text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
          >
            {runsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.agent_id} — {r.task_label?.slice(0, 40)} ({r.status}) [{r.id.slice(0, 8)}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-purple-400 mb-1.5 uppercase">
            Run B (Alternative / Candidate)
          </label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full p-2 rounded-lg bg-arena-bg border border-arena-border text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
          >
            {runsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.agent_id} — {r.task_label?.slice(0, 40)} ({r.status}) [{r.id.slice(0, 8)}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span>Computing comparative trace metrics...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-arena-card border border-rose-500/30 text-center text-rose-400 text-sm">
          {error}
        </div>
      ) : !comparisonData ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Select two distinct runs above to view comparative analysis.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Winner & Outcome Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-arena-card border border-arena-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-gray-400 uppercase">Benchmark Outcome Evaluation</div>
                <div className="text-base font-bold text-white">
                  {comp.winner === 'left' ? `${leftRun.agent_id} demonstrated superior execution` : `${rightRun.agent_id} demonstrated superior execution`}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-gray-400">Token Delta: </span>
                <span className={comp.token_delta < 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {comp.token_delta > 0 ? '+' : ''}{formatTokens(comp.token_delta)} ({comp.token_delta_percent.toFixed(1)}%)
                </span>
              </div>
              <span>•</span>
              <div>
                <span className="text-gray-400">Cost Delta: </span>
                <span className={comp.cost_delta < 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {comp.cost_delta > 0 ? '+' : ''}{formatCost(comp.cost_delta)}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Diff Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Success */}
            <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-2">
              <div className="text-xs font-mono text-gray-400">TASK SUCCESS</div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1.5 text-blue-400 font-bold">
                  {leftRun.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                  <span>{leftRun.status}</span>
                </span>
                <span className="text-gray-500">vs</span>
                <span className="flex items-center space-x-1.5 text-purple-400 font-bold">
                  {rightRun.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                  <span>{rightRun.status}</span>
                </span>
              </div>
            </div>

            {/* Total Tokens */}
            <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-2">
              <div className="text-xs font-mono text-gray-400">TOTAL TOKENS</div>
              <div className="flex items-center justify-between text-sm font-mono font-bold">
                <span className="text-blue-400">{formatTokens(leftRun.metrics?.total_tokens)}</span>
                <span className="text-gray-500">vs</span>
                <span className="text-purple-400">{formatTokens(rightRun.metrics?.total_tokens)}</span>
              </div>
            </div>

            {/* Cost */}
            <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-2">
              <div className="text-xs font-mono text-gray-400">ESTIMATED COST</div>
              <div className="flex items-center justify-between text-sm font-mono font-bold">
                <span className="text-blue-400">{formatCost(leftRun.metrics?.estimated_cost_usd)}</span>
                <span className="text-gray-500">vs</span>
                <span className="text-purple-400">{formatCost(rightRun.metrics?.estimated_cost_usd)}</span>
              </div>
            </div>

            {/* Retries & Recovery */}
            <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-2">
              <div className="text-xs font-mono text-gray-400">RETRIES / RECOVERIES</div>
              <div className="flex items-center justify-between text-sm font-mono font-bold">
                <span className="text-blue-400">{leftRun.metrics?.retries || 0} retries</span>
                <span className="text-gray-500">vs</span>
                <span className="text-purple-400">{rightRun.metrics?.retries || 0} retries</span>
              </div>
            </div>
          </div>

          {/* Comparative Chart */}
          <div className="p-5 rounded-xl bg-arena-card border border-arena-border space-y-3">
            <div className="text-xs font-mono font-semibold text-gray-300">
              Comparative Consumption Breakdown
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="metric" stroke="#6b7280" textAnchor="middle" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111622', borderColor: '#1e2638', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey={leftRun.agent_id || 'Agent A'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={rightRun.agent_id || 'Agent B'} fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Synchronized Timeline Diff Streams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-arena-border pb-2">
                <div className="font-bold text-sm text-blue-400 flex items-center space-x-1.5">
                  <span>{leftRun.agent_id} Trace</span>
                  <span className="text-xs font-mono text-gray-500">({comparisonData.left.events.length} events)</span>
                </div>
                <Link
                  href={`/runs/${leftRun.id}`}
                  className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>Inspect Run</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {comparisonData.left.events.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-arena-card border border-arena-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-gray-400">#{evt.sequence} • {evt.event_type}</span>
                      <span className="text-gray-500">{formatDuration(evt.duration_ms)}</span>
                    </div>
                    <div className="text-gray-300 font-mono text-[11px] truncate">
                      {evt.payload?.summary || evt.payload?.result_summary || evt.payload?.tool_name || evt.payload?.model || evt.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-arena-border pb-2">
                <div className="font-bold text-sm text-purple-400 flex items-center space-x-1.5">
                  <span>{rightRun.agent_id} Trace</span>
                  <span className="text-xs font-mono text-gray-500">({comparisonData.right.events.length} events)</span>
                </div>
                <Link
                  href={`/runs/${rightRun.id}`}
                  className="text-xs text-purple-400 hover:underline flex items-center space-x-1"
                >
                  <span>Inspect Run</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {comparisonData.right.events.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-arena-card border border-arena-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-gray-400">#{evt.sequence} • {evt.event_type}</span>
                      <span className="text-gray-500">{formatDuration(evt.duration_ms)}</span>
                    </div>
                    <div className="text-gray-300 font-mono text-[11px] truncate">
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
  );
}

export default function RunComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24 text-gray-400 flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="font-mono text-sm">Loading comparison workspace...</span>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}


