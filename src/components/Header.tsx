import React from 'react';
import { ArrowLeft, Lock, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Back to Cypher Labs & Brand Identity */}
        <div className="flex items-center gap-4 min-w-max">
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-600 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-100"
            title="Back to Cypher Labs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">← Back to Cypher Labs</span>
            <span className="sm:hidden">← Back</span>
          </a>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-slate-900 font-sans">
                AIscrubber
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Local-First Badge */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">🔒 Local-First (Browser Only)</span>
            <span className="sm:hidden">🔒 Local-First</span>
          </div>
        </div>
      </div>
    </header>
  );
};
