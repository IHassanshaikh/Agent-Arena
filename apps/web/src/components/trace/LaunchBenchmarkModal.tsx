'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, X, ShieldAlert, Sparkles, Cpu, RefreshCw } from 'lucide-react';
import { launchBenchmark } from '@/lib/api';

interface LaunchBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunched?: (runId: string) => void;
}

export const LaunchBenchmarkModal: React.FC<LaunchBenchmarkModalProps> = ({ isOpen, onClose, onLaunched }) => {
  const router = useRouter();
  const [agentId, setAgentId] = useState('alpha');
  const [seededFailure, setSeededFailure] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const res = await launchBenchmark({
        agent_id: agentId,
        task_id: 'seeded-react-login-bug',
        seeded_failure: seededFailure
      });

      if (onLaunched) onLaunched(res.run_id);
      onClose();
      router.push(`/runs/${res.run_id}`);
    } catch (err) {
      console.error('Launch failed:', err);
      alert('Failed to launch benchmark run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-arena-card border border-arena-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-arena-border/50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Launch Agent Benchmark Run</h2>
            <p className="text-xs text-gray-400">Test autonomous agent execution against seeded tasks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Benchmark Task</label>
            <div className="p-3 rounded-lg bg-arena-bg border border-arena-border text-sm">
              <div className="font-semibold text-gray-200">Fix Auth Token Expiration Race in Login Component</div>
              <div className="text-xs text-gray-400 mt-1">
                A seeded React bug where session token refresh is not awaited, causing race conditions in test harness.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Select Agent Architecture</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAgentId('alpha')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  agentId === 'alpha'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-arena-border bg-arena-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-sm flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>Agent Alpha</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Resilient Bug-Fixer (Gemini 2.5 Flash) with autonomous retry recovery.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAgentId('beta')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  agentId === 'beta'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-arena-border bg-arena-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-sm flex items-center space-x-1.5">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span>Agent Beta</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Baseline (Gemini Flash) fast zero-shot without retry logic.
                </div>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={seededFailure}
                onChange={(e) => setSeededFailure(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-amber-400 flex items-center space-x-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Seed Controlled Tool Failure (Hackathon Demo)</span>
                </span>
                <p className="text-gray-400 mt-0.5">
                  Injects a transient test runner timeout on first attempt to showcase <code>retry.scheduled</code> and recovery.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-arena-border/50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleLaunch}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            <span>{loading ? 'Starting Runner...' : 'Start Execution'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

