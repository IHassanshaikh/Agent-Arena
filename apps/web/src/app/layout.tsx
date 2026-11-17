import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'AgentArena — Autonomous Agent Observability & Flight Recorder',
    template: '%s | AgentArena'
  },
  description:
    'Live execution traces, interactive workflow topology, latency waterfall inspection, and resilience flight recording for autonomous AI agents.',
  keywords: [
    'AI agents',
    'Agent Observability',
    'Flight Recorder',
    'Trace Inspection',
    'Autonomous AI',
    'LLM Traces',
    'Agent Benchmarks',
    'AgentArena'
  ],
  authors: [{ name: 'AgentArena Team' }],
  creator: 'AgentArena Team',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: ['/icon.svg']
  },
  openGraph: {
    title: 'AgentArena — Autonomous Agent Observability & Flight Recorder',
    description:
      'Real-time execution traces, workflow topology, latency waterfalls, and resilience tracking for autonomous AI agents.',
    url: 'http://localhost:3000',
    siteName: 'AgentArena',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentArena — Autonomous Agent Observability & Flight Recorder',
    description:
      'Real-time execution traces, workflow topology, latency waterfalls, and resilience tracking for autonomous AI agents.'
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
      </head>
      <body className="h-full bg-[#09090b] text-[#fafafa] flex flex-col antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
        <main className="h-full w-full flex flex-col overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
