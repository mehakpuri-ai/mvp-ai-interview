import posthog from 'posthog-js';

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    loaded: (ph) => {
      console.log('PostHog loaded', ph);
    }
  });
} else {
  console.warn('⚠️ NEXT_PUBLIC_POSTHOG_KEY is not set — PostHog disabled.');
}
