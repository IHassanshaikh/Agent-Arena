'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, GitCompare } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Studio', href: '/', icon: Layers },
    { label: 'Comparison', href: '/compare', icon: GitCompare }
  ];

  return (
    <header className="border-b border-[#27272a] bg-[#111114] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-[#18181b] text-white border border-[#27272a] font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-[#18181b]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[11px] font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-400 font-semibold">RECORDER LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
