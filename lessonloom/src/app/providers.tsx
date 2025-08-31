"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { usePosthog } from './posthog';

export default function Providers({ children }: { children: React.ReactNode }) {
  usePosthog();
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Capture referral
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      try { localStorage.setItem('ll_ref', ref); } catch {}
    }
  }, []);
  return <SessionProvider>{children}</SessionProvider>;
}
