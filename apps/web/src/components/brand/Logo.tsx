'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-9 w-9'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Precision Emblem */}
      <div className={`${iconSizes[size]} shrink-0 relative rounded-md bg-[#111114] border border-[#27272a] p-1 flex items-center justify-center shadow-sm`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          {/* Arena Track */}
          <circle cx="16" cy="16" r="10" stroke="#18181b" strokeWidth="2" />
          <path d="M16 6 A 10 10 0 0 1 26 16" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 26 A 10 10 0 0 1 6 16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          {/* Coordinate Reticle */}
          <line x1="16" y1="3" x2="16" y2="5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="27" x2="16" y2="29" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="16" x2="5" y2="16" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="27" y1="16" x2="29" y2="16" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
          {/* Core Node */}
          <rect x="12" y="12" width="8" height="8" rx="2" fill="#18181b" stroke="#3b82f6" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="1.75" fill="#10b981" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className={`font-mono font-bold tracking-tight text-white flex items-center space-x-1 ${textSizes[size]}`}>
          <span>AGENT</span>
          <span className="text-blue-500">ARENA</span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 -mt-0.5">
            Flight Recorder
          </span>
        )}
      </div>
    </div>
  );
};
