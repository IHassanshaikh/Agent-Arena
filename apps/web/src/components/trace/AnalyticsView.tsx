'use client';

import React, { useEffect, useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  RotateCcw,
  Clock,
  Coins,
  Cpu,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { formatDuration, formatCost, formatTokens } from '@/lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AnalyticsViewProps {
  runId: string;
  metrics: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ runId, metrics }) => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiBase}/api/runs/${runId}/summary`)
      .then((res) => res.json())
      .then((data) => setSummaryData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [runId]);

  const toolStats = summaryData?.tool_breakdown || [];
  const eventStats = summaryData?.event_type_breakdown || [];
  const alerts = summaryData?.alerts || [];

  const chartData = toolStats.map((t: any) => ({
    name: t.tool_name || 'unknown',
    durationMs: Math.round(Number(t.total_duration_ms || 0)),
    count: Number(t.count || 0)
  }));

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* 1. Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, idx: number) => {
            const isInfo = alert.severity === 'info';
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center space-x-3 text-xs ${
                  isCritical
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : isInfo
                    ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}
              >
                {isCritical ? (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <RotateCcw className="h-4 w-4 text-blue-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold uppercase font-mono mr-2">[{alert.type}]</span>
                  <span>{alert.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Tool Latency Distribution Chart */}
      <div className="p-5 rounded-xl bg-arena-card border border-arena-border space-y-4">
        <div className="flex items-center justify-between border-b border-arena-border pb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Wrench className="h-4 w-4 text-cyan-400" />
            <span>Cumulative Tool Latency Breakdown</span>
          </div>
          <span className="text-xs font-mono text-gray-500">Time spent in external tool execution</span>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">No tool telemetry recorded for this run.</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis
                  stroke="#6b7280"
                  tickFormatter={(val) => `${val}ms`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#fff', borderRadius: 8 }}
                  formatter={(value: any) => [`${value}ms`, 'Total Execution Time']}
                />
                <Bar dataKey="durationMs" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Event Classification Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-200 uppercase font-mono">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>Event Taxonomy Distribution</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
            {eventStats.map((item: any) => (
              <div
                key={item.event_type}
                className="flex items-center justify-between p-2 rounded bg-arena-bg border border-arena-border/50 text-[11px]"
              >
                <span className="text-gray-300">{item.event_type}</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-arena-card border border-arena-border">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-arena-card border border-arena-border space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-200 uppercase font-mono">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>Run Health & Quality Reconcile</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-arena-bg border border-arena-border/50 flex justify-between">
              <span className="text-gray-400">Total Recorded Events</span>
              <span className="font-bold text-white">{metrics?.event_count || 0}</span>
            </div>
            <div className="p-2.5 rounded bg-arena-bg border border-arena-border/50 flex justify-between">
              <span className="text-gray-400">Tool Calls vs Model Calls</span>
              <span className="font-bold text-cyan-400">{metrics?.tool_calls || 0} Tools / {metrics?.model_calls || 0} LLM</span>
            </div>
            <div className="p-2.5 rounded bg-arena-bg border border-arena-border/50 flex justify-between">
              <span className="text-gray-400">Resilience Recovery Ratio</span>
              <span className="font-bold text-amber-400">
                {(metrics?.retries || 0) > 0 ? '100% Recovered' : 'No retries required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

