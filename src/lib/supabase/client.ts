"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (cached) return cached;
  const env = publicEnv();
  cached = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return cached;
}
