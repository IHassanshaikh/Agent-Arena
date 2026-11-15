'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  Clock,
  Cpu,
  Wrench,
  FileText,
  MessageSquarePlus,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { formatDuration, formatCost, formatTokens } from '@/lib/formatters';
import { addAnnotation, fetchAnnotations } from '@/lib/api';

interface EventInspectorProps {
  event: any;
  onClose: () => void;
}

export const EventInspector: React.FC<EventInspectorProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (event?.run_id) {
      fetchAnnotations(event.run_id)
        .then((res) => {
          const matching = (res.annotations || []).filter(
            (a: any) => a.event_id === event.event_id || (!a.event_id && !event.event_id)
          );
          setAnnotations(matching);
        })
        .catch(() => {});
    }
  }, [event?.event_id, event?.run_id]);

  if (!event) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotationText.trim()) return;
    setSavingNote(true);
    try {
      const res = await addAnnotation(event.run_id, annotationText, event.event_id);
      setAnnotations([...annotations, res]);
      setAnnotationText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const p = event.payload || {};
  const isLLM = event.event_type.startsWith('llm.');
  const isTool = event.event_type.startsWith('tool.');
  const isRetry = event.event_type === 'retry.scheduled';

  return (
    <div className="bg-arena-card border border-arena-border rounded-xl p-5 shadow-xl space-y-5 sticky top-20">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b border-arena-border pb-3.5">
        <div>
          <div className="text-xs font-mono text-gray-400 flex items-center space-x-1.5">
            <span>SEQUENCE #{event.sequence}</span>
            <span>•</span>
            <span className="text-blue-400">{event.source || 'agent'}</span>
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">{event.event_type}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyJson}
            className="p-1.5 rounded-lg bg-arena-bg border border-arena-border text-gray-400 hover:text-white"
            title="Copy sanitized JSON payload"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-arena-border/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Redaction Notice */}
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span className="font-mono text-[11px]">Secrets Redacted (Policy v{event.redaction_version || '1.0'})</span>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-arena-bg border border-arena-border/60">
          <div className="text-gray-500 text-[10px]">SPAN ID</div>
          <div className="text-gray-200 mt-0.5 truncate">{event.span_id || 'root'}</div>
        </div>

        <div className="p-2.5 rounded-lg bg-arena-bg border border-arena-border/60">
          <div className="text-gray-500 text-[10px]">PARENT SPAN</div>
          <div className="text-gray-200 mt-0.5 truncate">{event.parent_span_id || 'none'}</div>
        </div>

        <div className="p-2.5 rounded-lg bg-arena-bg border border-arena-border/60">
          <div className="text-gray-500 text-[10px]">DURATION</div>
          <div className="text-gray-200 mt-0.5">{formatDuration(event.duration_ms)}</div>
        </div>

        <div className="p-2.5 rounded-lg bg-arena-bg border border-arena-border/60">
          <div className="text-gray-500 text-[10px]">TIMESTAMP (UTC)</div>
          <div className="text-gray-200 mt-0.5 truncate">{new Date(event.occurred_at).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Structured Payload Inspection */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase font-mono text-gray-400">Inspected Content</div>

        {isLLM && (
          <div className="space-y-2 p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Provider & Model:</span>
              <span className="font-mono text-purple-300 font-bold">{p.provider} / {p.model}</span>
            </div>
            {p.input_tokens !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Token Consumption:</span>
                <span className="font-mono text-gray-200">
                  {formatTokens(p.input_tokens)} in / {formatTokens(p.output_tokens)} out ({formatTokens(p.input_tokens + p.output_tokens)} total)
                </span>
              </div>
            )}
            {p.finish_reason && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Finish Reason:</span>
                <span className="font-mono text-gray-300">{p.finish_reason}</span>
              </div>
            )}
            {p.response_summary && (
              <div className="pt-1.5 border-t border-purple-500/20">
                <div className="text-gray-400 text-[11px] mb-1">Response Summary:</div>
                <div className="text-gray-200 font-mono text-[11px] bg-arena-bg p-2 rounded border border-purple-500/20">
                  {p.response_summary}
                </div>
              </div>
            )}
          </div>
        )}

        {isTool && (
          <div className="space-y-2 p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tool Name:</span>
              <span className="font-mono text-cyan-300 font-bold">{p.tool_name}</span>
            </div>
            {p.safe_arguments && (
              <div>
                <span className="text-gray-400 block mb-1">Safe Arguments:</span>
                <pre className="p-2 rounded bg-arena-bg border border-cyan-500/20 font-mono text-[11px] overflow-x-auto text-gray-200">
                  {JSON.stringify(p.safe_arguments, null, 2)}
                </pre>
              </div>
            )}
            {p.result_summary && (
              <div>
                <span className="text-gray-400 block mb-1">Result Summary:</span>
                <div className="p-2 rounded bg-arena-bg border border-cyan-500/20 font-mono text-[11px] text-gray-200">
                  {p.result_summary}
                </div>
              </div>
            )}
            {p.safe_error_message && (
              <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Error: {p.error_code || 'Execution Error'}</span>
                </div>
                <p className="mt-1 font-mono text-[11px]">{p.safe_error_message}</p>
              </div>
            )}
          </div>
        )}

        {isRetry && (
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold">Attempt Number:</span>
              <span className="font-mono text-amber-200 font-bold">#{p.attempt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Backoff Wait:</span>
              <span className="font-mono text-gray-200">{p.backoff_ms}ms</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Retry Reason:</span>
              <div className="p-2 rounded bg-arena-bg border border-amber-500/20 font-mono text-[11px] text-amber-200">
                {p.reason}
              </div>
            </div>
          </div>
        )}

        {/* Raw JSON viewer */}
        <details className="text-xs group">
          <summary className="font-mono text-gray-400 hover:text-gray-200 cursor-pointer select-none">
            ▸ View Raw Envelope JSON
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-arena-bg border border-arena-border text-[11px] font-mono text-gray-300 overflow-x-auto max-h-56">
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>

      {/* Developer Annotations */}
      <div className="border-t border-arena-border pt-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
          <span className="flex items-center space-x-1.5">
            <MessageSquarePlus className="h-3.5 w-3.5 text-blue-400" />
            <span>Developer Annotations</span>
          </span>
          <span className="text-gray-500 font-mono text-[11px]">{annotations.length} notes</span>
        </div>

        {annotations.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {annotations.map((note) => (
              <div key={note.id} className="p-2 rounded bg-arena-bg border border-arena-border text-xs">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                  <span>{note.author_id}</span>
                  <span>{new Date(note.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-200 text-xs">{note.note}</div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddAnnotation} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Add note on this event..."
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-arena-bg border border-arena-border text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={savingNote || !annotationText.trim()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            {savingNote ? 'Saving...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  );
};

