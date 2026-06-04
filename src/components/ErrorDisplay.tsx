/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-display-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-red-500/40 bg-slate-900 shadow-2xl">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-full bg-red-500/15 p-3 ring-1 ring-red-500/30">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="error-display-title"
                className="text-lg font-semibold text-white"
              >
                Stress Test Failed
              </h2>
              <p className="mt-2 text-sm text-slate-300 break-words">
                {error}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay;
