import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  LogOut,
  User,
  Shield,
  FileCode,
  GraduationCap,
  Key,
  Layout,
  Home,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const TOOLS_LIST = [
  {
    id: 'aiscrubber',
    name: 'AIScrubber',
    desc: 'AI Prompt & Metadata Privacy',
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
    url: 'https://aiscrubber.poorvithmp.com'
  },
  {
    id: 'portfoliogen',
    name: 'PortfolioGen',
    desc: 'Developer Portfolio Generator',
    icon: FileCode,
    color: 'from-blue-500 to-indigo-600',
    url: 'https://portfoliogen.poorvithmp.com'
  },
  {
    id: 'gradepath',
    name: 'GradePath',
    desc: 'Academic GPA Goal Planner',
    icon: GraduationCap,
    color: 'from-amber-500 to-orange-600',
    url: 'https://gradepath.poorvithmp.com'
  },
  {
    id: 'safegen',
    name: 'SafeGen',
    desc: 'Crypto Key & Password Vault',
    icon: Key,
    color: 'from-rose-500 to-red-600',
    url: 'https://safegen.poorvithmp.com'
  },
  {
    id: 'infinitecanvas',
    name: 'InfiniteCanvas',
    desc: 'Endless Visual Canvas',
    icon: Layout,
    color: 'from-purple-500 to-pink-600',
    url: 'https://infinitecanvas.poorvithmp.com'
  },
  {
    id: 'poorvithmp',
    name: 'PoorvithMP',
    desc: 'Main Portfolio & Hub',
    icon: Home,
    color: 'from-slate-700 to-slate-900',
    url: 'https://poorvithmp.com'
  }
];

export const AppLauncherDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      setUser(activeSession?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      setUser(activeSession?.user || null);
    });

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const avatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';
  const userEmail = user?.email || '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-emerald-500/50 hover:text-white min-h-[44px]"
        aria-label="App launcher and account menu"
      >
        <Grid size={16} className="text-emerald-400 shrink-0" />
        {avatar ? (
          <img src={avatar} alt={userName} className="h-5 w-5 rounded-full object-cover shrink-0" />
        ) : (
          <User size={15} className="shrink-0" />
        )}
        <span className="hidden sm:inline max-w-[90px] truncate">{user ? userName : 'Apps'}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-slate-800 pb-3 mb-3">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt={userName} className="h-10 w-10 rounded-full object-cover shrink-0 border border-emerald-500/50" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-white truncate">{userName}</h4>
                    <p className="font-mono text-[11px] text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>
                <a
                  href="https://poorvithmp.com/profile"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-200 shrink-0"
                >
                  Profile
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-1">
                <div>
                  <h4 className="font-bold text-sm text-white">Guest Access (3 Uses/Day)</h4>
                  <p className="text-[11px] text-slate-400">Sign in for unlimited access</p>
                </div>
                <a
                  href="https://poorvithmp.com/auth"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              PoorvithMP Tools
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TOOLS_LIST.map((tool) => {
              const Icon = tool.icon;
              const targetUrl = session?.access_token && tool.id !== 'aiscrubber'
                ? `${tool.url}/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`
                : tool.url;

              return (
                <a
                  key={tool.id}
                  href={targetUrl}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-900 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition group text-center"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm group-hover:scale-110 transition-transform mb-1.5`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 line-clamp-1">
                    {tool.name}
                  </span>
                </a>
              );
            })}
          </div>

          {user && (
            <div className="border-t border-slate-800 mt-3 pt-2.5 flex justify-end">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1 transition"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
