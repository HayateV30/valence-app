'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Valence ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#020705] p-6 text-[#ECFDF5]">
          <div className="w-full max-w-md rounded-xl border border-emerald-600/25 bg-[#040C09] p-6">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h1 className="text-base font-semibold text-emerald-50">
                Application Error
              </h1>
            </div>
            <p className="mt-3 break-words font-mono text-xs leading-relaxed text-emerald-100/70">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-800 px-4 py-2 text-xs font-semibold text-emerald-50 transition-colors hover:bg-emerald-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reload Valence
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
