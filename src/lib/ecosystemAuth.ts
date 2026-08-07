import { supabase } from './supabaseClient';

const COOKIE_NAME = 'poorvith_auth_session';

const getCookieDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.endsWith('poorvithmp.com')) return '.poorvithmp.com';
  return '';
};

export const getSharedAuthCookie = () => {
  if (typeof document === 'undefined') return null;
  const name = COOKIE_NAME + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(name.length)));
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const setSharedAuthCookie = (userData: any, sessionData: any = null) => {
  if (typeof document === 'undefined') return;
  const domain = getCookieDomain();
  const domainStr = domain ? `; domain=${domain}` : '';
  const secureStr = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  
  const payload = {
    user: userData ? {
      id: userData.id,
      email: userData.email,
      user_metadata: userData.user_metadata || { full_name: userData.email?.split('@')[0] }
    } : null,
    access_token: sessionData?.access_token || null,
    refresh_token: sessionData?.refresh_token || null
  };

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; path=/${domainStr}; max-age=${maxAge}; SameSite=Lax${secureStr}`;
  try {
    if (userData) {
      localStorage.setItem('poorvith_auth_user', JSON.stringify(payload.user));
    } else {
      localStorage.removeItem('poorvith_auth_user');
    }
  } catch {}
};

export const clearSharedAuthCookie = () => {
  if (typeof document === 'undefined') return;
  const domain = getCookieDomain();
  const domainStr = domain ? `; domain=${domain}` : '';
  document.cookie = `${COOKIE_NAME}=; path=/${domainStr}; max-age=0; SameSite=Lax`;
  try {
    localStorage.removeItem('poorvith_auth_user');
  } catch {}
};

export const syncEcosystemAuth = (onUserChange: (user: any) => void) => {
  if (typeof window === 'undefined') return;

  // 1. INSTANT SYNCHRONOUS HYDRATION (0ms UI latency)
  const urlParams = new URLSearchParams(window.location.search);
  const ssoUserRaw = urlParams.get('sso_user');
  let instantUser = null;

  if (ssoUserRaw) {
    try {
      instantUser = JSON.parse(decodeURIComponent(ssoUserRaw));
    } catch {}
  }

  if (!instantUser) {
    const shared = getSharedAuthCookie();
    if (shared?.user) {
      instantUser = shared.user;
    }
  }

  if (!instantUser) {
    try {
      const saved = localStorage.getItem('poorvith_auth_user');
      if (saved) instantUser = JSON.parse(saved);
    } catch {}
  }

  if (instantUser) {
    onUserChange(instantUser);
    setSharedAuthCookie(instantUser);
  }

  // 2. BACKGROUND NON-BLOCKING VERIFICATION
  setTimeout(async () => {
    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && supabase) {
        try {
          const { data: { session } } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          if (session?.user) {
            setSharedAuthCookie(session.user, session);
            onUserChange(session.user);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        } catch {}
      }
    }

    if (ssoUserRaw) {
      urlParams.delete('sso_user');
      const newQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
      window.history.replaceState(null, '', `${window.location.pathname}${newQuery}`);
    }

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSharedAuthCookie(session.user, session);
          onUserChange(session.user);
        } else if (!instantUser) {
          onUserChange(null);
        }
      } catch {}
    }
  }, 0);
};
