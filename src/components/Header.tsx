/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Search } from 'lucide-react';

interface HeaderProps {
  addressInput: string;
  onAddressChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  dataSource: 'AI_GENERATED' | 'PROCEDURAL_SIMULATION' | 'PRESET';
}

export function Header({
  addressInput,
  onAddressChange,
  onSubmit,
  isLoading,
  dataSource,
}: HeaderProps) {
  return (
    <header className="h-[80px] border-b border-border-dark px-6 lg:px-8 bg-bg-dark flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border border-accent-gold flex items-center justify-center font-serif text-accent-gold font-bold text-lg select-none bg-surface-dark/40">
          S
        </div>
        <div>
          <h1 className="text-base font-serif italic tracking-widest text-accent-gold">Climate Stress Test</h1>
        </div>
      </div>

      {/* Global Search and Engine Status Bar */}
      <div className="flex items-center gap-4">
        <form onSubmit={onSubmit} className="flex border border-border-dark bg-surface-dark items-center">
          <span className="pl-3 pr-1 text-[#888888]"><MapPin size={14} /></span>
          <input
            type="text"
            placeholder="Address / coordinates / parcel..."
            value={addressInput}
            onChange={(e) => onAddressChange(e.target.value)}
            disabled={isLoading}
            className="px-2 py-2 focus:outline-none bg-transparent text-xs text-[#e5e5e5] font-mono w-[220px] lg:w-[320px] rounded-none placeholder:text-[#555555]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-surface-dark hover:bg-[#1a1a1a] hover:text-[#e5e5e5] text-[#888888] border-l border-border-dark px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            data-source={dataSource}
          >
            <Search size={12} className="text-accent-gold" />
            STRESS TEST
          </button>
        </form>
      </div>
    </header>
  );
}
