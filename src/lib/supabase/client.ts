"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env-public";
import type { Database } from "@/types/supabase";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (cached) return cached;
  const env = publicEnv();
  cached = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return cached;
}
