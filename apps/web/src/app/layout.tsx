import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TraceSage - Live Execution Traces',
  description: 'AI Agent Observability and Trace Inspection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-black text-gray-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
        <main className="h-full w-full flex flex-col overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
