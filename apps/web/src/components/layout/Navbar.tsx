'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Layers, GitCompare, Terminal, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Runs Overview', href: '/', icon: Layers },
    { label: 'Run Comparison', href: '/compare', icon: GitCompare }
  ];

  return (
    <header className="border-b border-arena-border bg-black/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-wider text-white flex items-center space-x-1">
                <span>AGENT</span>
                <span className="text-blue-400">ARENA</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 ml-1">TRACES</span>
              </div>
              <p className="text-[10px] text-gray-400 -mt-0.5 font-mono">Autonomous Agent Observability</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-arena-border/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-mono">RECORDER LIVE</span>
          </div>

          <div className="text-xs text-gray-400 font-mono hidden lg:block">
            Hackathon 2026 Build
          </div>
        </div>
      </div>
    </header>
  );
};

