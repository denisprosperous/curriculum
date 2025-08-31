"use client";
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function usePosthog() {
  useEffect(() => {
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'ph_dummy_key', { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com' });
    }
    posthog.capture('app_loaded');
  }, []);
}
