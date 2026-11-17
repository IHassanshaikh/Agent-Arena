'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Eye,
  Code,
  Copy,
  Check,
  ExternalLink,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  FileText
} from 'lucide-react';
import { fetchRunArtifact } from '@/lib/api';

interface ArtifactPreviewProps {
  runId: string;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ runId }) => {
  const [artifact, setArtifact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetchRunArtifact(runId)
      .then((data) => {
        setArtifact(data);
        if (data && (data.isHtml || data.filename?.endsWith('.md'))) {
          setMode('preview');
        } else {
          setMode('code');
        }
      })
      .catch((err) => {
        console.error('Failed to load artifact:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [runId]);

  const handleCopy = () => {
    if (!artifact?.content) return;
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!artifact) return;
    const blob = new Blob([artifact.content], { type: artifact.contentType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename || 'generated-artifact';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-400 font-mono">
        <RefreshCw className="h-5 w-5 animate-spin mb-2.5 text-zinc-400" />
        <span className="text-xs text-zinc-300">Loading artifact...</span>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#09090b] text-zinc-400 font-mono p-6">
        <div className="p-6 rounded-lg bg-[#111114] border border-[#27272a] max-w-sm text-center shadow-lg">
          <FileCode className="h-8 w-8 text-zinc-500 mx-auto mb-2.5" />
          <div className="text-sm font-semibold text-zinc-200 mb-1">No Artifact Generated</div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            The selected execution run did not generate or save any final file artifact.
          </div>
        </div>
      </div>
    );
  }

  const rawUrl = `http://localhost:4000/api/runs/${runId}/artifact/raw`;
  const isMarkdown = artifact.filename?.endsWith('.md');
  const isHtml = artifact.isHtml;

  const viewportWidthClass =
    viewport === 'mobile' ? 'max-w-[375px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] text-zinc-200 overflow-hidden select-none font-sans">
      {/* 1. Header Toolbar */}
      <div className="h-11 border-b border-[#27272a] px-3.5 flex items-center justify-between bg-[#111114] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-[#18181b] text-zinc-300 border border-[#27272a]">
              {isMarkdown ? <FileText className="h-3.5 w-3.5" /> : <FileCode className="h-3.5 w-3.5" />}
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-100">{artifact.filename}</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {(artifact.size / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Mode Switcher */}
          {(isHtml || isMarkdown) && (
            <div className="flex items-center p-0.5 rounded-md bg-[#18181b] border border-[#27272a] text-xs font-mono">
              <button
                onClick={() => setMode('preview')}
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  mode === 'preview'
                    ? 'bg-[#27272a] text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>{isHtml ? 'Preview' : 'Formatted'}</span>
              </button>
              <button
                onClick={() => setMode('code')}
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  mode === 'code'
                    ? 'bg-[#27272a] text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code className="h-3 w-3" />
                <span>Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Viewport size controls */}
        {mode === 'preview' && isHtml && (
          <div className="hidden sm:flex items-center space-x-1 p-0.5 rounded-md bg-[#18181b] border border-[#27272a] text-xs text-zinc-400">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded ${viewport === 'desktop' ? 'bg-[#27272a] text-zinc-100' : 'hover:text-zinc-200'}`}
              title="Desktop (100%)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded ${viewport === 'tablet' ? 'bg-[#27272a] text-zinc-100' : 'hover:text-zinc-200'}`}
              title="Tablet (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded ${viewport === 'mobile' ? 'bg-[#27272a] text-zinc-100' : 'hover:text-zinc-200'}`}
              title="Mobile (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open</span>
          </a>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-3 bg-[#09090b]">
        {mode === 'preview' && isHtml ? (
          <div
            className={`h-full ${viewportWidthClass} transition-all duration-200 border border-[#27272a] rounded-lg overflow-hidden bg-white shadow-xl`}
          >
            <iframe
              srcDoc={artifact.content}
              title="Artifact Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : mode === 'preview' && isMarkdown ? (
          <div className="w-full h-full overflow-y-auto p-6 max-w-4xl mx-auto bg-[#111114] border border-[#27272a] rounded-lg text-zinc-200 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {artifact.content}
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden bg-[#111114] border border-[#27272a] rounded-lg flex flex-col font-mono text-xs">
            <div className="flex-1 overflow-auto p-4 text-zinc-300 leading-5">
              <pre>
                <code>{artifact.content}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
