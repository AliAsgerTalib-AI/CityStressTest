// src/components/LoadingOverlay.tsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface LoadingOverlayProps {
  isLoading: boolean;
  loadingLog: string;
}

export function LoadingOverlay({ isLoading, loadingLog }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-6 border-4 border-border-dark"
        >
          <div className="max-w-md w-full bg-surface-dark border border-accent-gold p-8 text-center rounded-none font-mono">
            <div className="flex justify-center mb-6">
              <RefreshCw size={36} className="text-accent-gold animate-spin" />
            </div>
            <h2 className="text-[#e5e5e5] font-extrabold text-sm tracking-wider uppercase mb-2">
              Analyzing Property Risk
            </h2>
            <p className="text-[10px] text-[#888888] uppercase tracking-widest mb-6">
              Processing climate data
            </p>

            <div className="bg-bg-dark border border-border-dark p-4 text-left text-xs min-h-[90px] flex items-center">
              <div className="text-accent-gold leading-relaxed">
                <span className="text-[#888888]">[SYSTEM ACTIVE]</span> {loadingLog}
              </div>
            </div>

            <div className="mt-6 text-[9px] text-[#888888] uppercase tracking-widest">
              Please wait...
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
