import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://cyfbphqzrpcetfzgsmus.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZmJwaHF6cnBjZXRmemdzbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjAyNTksImV4cCI6MjEwMTEzNjI1OX0.5lHBuOlGBIyZg_RH9T_KW6eFvgcqHTQwfHWusYetwi8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const getCookieDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.endsWith('poorvithmp.com')) {
    return '.poorvithmp.com';
  }
  return '';
};

export const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const name = encodeURIComponent(key) + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        try {
          return decodeURIComponent(c.substring(name.length));
        } catch {
          return null;
        }
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    
    // Strip heavy user metadata so cookie stays under 4KB browser limit
    let storedValue = value;
    try {
      const parsed = JSON.parse(value);
      if (parsed && (parsed.access_token || parsed.currentSession?.access_token)) {
        const session = parsed.currentSession || parsed;
        storedValue = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type
        });
      }
    } catch {
      // ignore
    }

    const domain = getCookieDomain();
    const domainStr = domain ? `; domain=${domain}` : '';
    const secureStr = window.location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(storedValue)}; path=/${domainStr}; max-age=${maxAge}; SameSite=Lax${secureStr}`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    const domain = getCookieDomain();
    const domainStr = domain ? `; domain=${domain}` : '';
    document.cookie = `${encodeURIComponent(key)}=; path=/${domainStr}; max-age=0; SameSite=Lax`;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
