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
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-[#a1a1aa] font-mono">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-[#38bdf8]" />
        <span className="text-sm font-medium text-white">Loading generated artifact...</span>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-[#a1a1aa] font-mono p-6">
        <div className="p-8 rounded-2xl bg-[#09090b] border border-[rgba(255,255,255,0.08)] max-w-md text-center shadow-2xl">
          <FileCode className="h-10 w-10 text-[#38bdf8] mx-auto mb-3" />
          <div className="text-base font-bold text-white mb-2">No Artifact Generated Yet</div>
          <div className="text-xs text-[#a1a1aa] leading-relaxed">
            The agent is still executing or no output file was created for this run. Type any instruction above and click <strong className="text-[#38bdf8]">[Run]</strong> to generate live HTML or code!
          </div>
        </div>
      </div>
    );
  }

  const rawUrl = `http://localhost:4000/api/runs/${runId}/artifact/raw`;
  const isMarkdown = artifact.filename?.endsWith('.md');
  const isHtml = artifact.isHtml;

  return (
    <div className="w-full h-full flex flex-col bg-black text-[#e4e4e7] overflow-hidden select-none font-sans">
      {/* 1. Header Toolbar */}
      <div className="h-12 border-b border-[#18181b] px-4 flex items-center justify-between bg-[#070709] shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#121217] text-[#38bdf8] border border-[rgba(255,255,255,0.08)]">
              {isMarkdown ? <FileText className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-white">{artifact.filename}</span>
              <span className="text-[11px] font-mono text-[#71717a] ml-2">
                ({(artifact.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>

          {/* Mode Switcher: Live Preview vs Source Code */}
          {(isHtml || isMarkdown) && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#0e0e12] border border-[rgba(255,255,255,0.08)] text-xs font-mono">
              <button
                onClick={() => setMode('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                  mode === 'preview'
                    ? 'bg-[#18181b] text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isHtml ? 'Live Preview' : 'Formatted View'}</span>
              </button>
              <button
                onClick={() => setMode('code')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                  mode === 'code'
                    ? 'bg-[#18181b] text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Source Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Viewport size controls for live preview */}
        {mode === 'preview' && isHtml && (
          <div className="hidden sm:flex items-center space-x-1 p-0.5 rounded-lg bg-[#0e0e12] border border-[rgba(255,255,255,0.08)] text-xs text-[#71717a]">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-md ${viewport === 'desktop' ? 'bg-[#18181b] text-white' : 'hover:text-white'}`}
              title="Desktop 100%"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-md ${viewport === 'tablet' ? 'bg-[#18181b] text-white' : 'hover:text-white'}`}
              title="Tablet 768px"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-md ${viewport === 'mobile' ? 'bg-[#18181b] text-white' : 'hover:text-white'}`}
              title="Mobile 375px"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 font-mono">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#0e0e12] hover:bg-[#18181b] border border-[rgba(255,255,255,0.08)] text-xs text-[#a1a1aa] hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#22c55e]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#0e0e12] hover:bg-[#18181b] border border-[rgba(255,255,255,0.08)] text-xs text-[#a1a1aa] hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Tab</span>
          </a>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold transition-colors shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-[#000000]">
        {mode === 'preview' && isHtml ? (
          <div
            className={`h-full transition-all duration-200 border border-[#27272a] rounded-xl overflow-hidden shadow-2xl bg-white ${
              viewport === 'desktop' ? 'w-full' : viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
          >
            <iframe
              srcDoc={artifact.content}
              title="Artifact Live Preview"
              sandbox="allow-scripts allow-forms allow-same-origin"
              className="w-full h-full border-0"
            />
          </div>
        ) : mode === 'preview' && isMarkdown ? (
          <div className="w-full h-full overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#09090b] p-8 max-w-3xl mx-auto text-gray-200 leading-relaxed shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#38bdf8] mb-4 pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <span>Verified Markdown Document</span>
              <span>•</span>
              <span className="text-[#a1a1aa]">{artifact.filename}</span>
            </div>
            <div className="prose prose-invert max-w-none text-sm space-y-4">
              {artifact.content.split('\n\n').map((paragraph: string, idx: number) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={idx} className="text-2xl font-bold text-white border-b border-zinc-800 pb-2">{paragraph.replace('# ', '')}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-bold text-white mt-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={idx} className="text-lg font-bold text-white mt-3">{paragraph.replace('### ', '')}</h3>;
                }
                return <p key={idx} className="text-[#d4d4d8] leading-7">{paragraph}</p>;
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#070709] p-4 font-mono text-xs text-[#e4e4e7] leading-relaxed">
            <pre className="whitespace-pre">
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
