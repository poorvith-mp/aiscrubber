import React from 'react';
import { ShieldAlert, Sparkles, ArrowRight, X, Lock } from 'lucide-react';

interface TrialLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
}

export const TrialLimitModal: React.FC<TrialLimitModalProps> = ({
  isOpen,
  onClose,
  toolName = 'AIScrubber'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-center space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X size={16} />
        </button>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
          <Lock size={30} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            <ShieldAlert size={12} /> Daily Guest Limit Reached
          </span>
          <h3 className="text-2xl font-bold text-white">
            Daily Trial Used (3/3)
          </h3>
          <p className="text-sm text-slate-300">
            You have used all 3 free daily trial operations for <strong className="text-emerald-400">{toolName}</strong> today.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Sign in to unlock:</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 pl-6 list-disc">
            <li><strong>Unlimited, unblocked access</strong> across all tools</li>
            <li>Saved prompt privacy presets & custom token maps</li>
            <li>1-click cross-subdomain access across the entire suite</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <a
            href="https://poorvithmp.com/auth"
            className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span>Sign In / Register for Free</span>
            <ArrowRight size={15} />
          </a>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 uppercase font-bold tracking-wider transition"
          >
            Close & Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};
