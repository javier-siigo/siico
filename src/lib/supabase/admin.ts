import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let cachedAdmin: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cachedAdmin) return cachedAdmin;
  const env = serverEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor");
  }
  const pub = publicEnv();
  cachedAdmin = createClient<Database>(
    pub.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return cachedAdmin;
}
