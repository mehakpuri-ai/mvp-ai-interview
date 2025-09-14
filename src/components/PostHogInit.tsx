"use client";
import { useEffect } from "react";
import posthog from "posthog-js";

export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key) {
      posthog.init(key, { api_host: host || "https://app.posthog.com" });
      posthog.capture("page_view");
    }
  }, []);
  return null;
}
