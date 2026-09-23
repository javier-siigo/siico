import { z } from "zod";

const serverSchema = z.object({
  N8N_BASE_URL: z
    .string()
    .url("N8N_BASE_URL debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  N8N_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Falta la anon key de Supabase"),
});

type PublicEnv = z.infer<typeof publicSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

let cachedServer: ServerEnv | null = null;

export function publicEnv(): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function serverEnv(): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverSchema.safeParse({
    N8N_BASE_URL: process.env.N8N_BASE_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  });
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variables de entorno inválidas:\n${messages}`);
  }
  cachedServer = parsed.data;
  return cachedServer;
}
