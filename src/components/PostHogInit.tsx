// src/components/PostHogInit.tsx
'use client';

import { useEffect } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

export default function PostHogInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (key && typeof window !== 'undefined') {
      if (!posthog.has_opted_out_capturing()) {
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,   // auto pageview tracking
          capture_pageleave: true,  // auto "page leave" tracking
        });
      }
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
