import "server-only";

import { z } from "zod";

const serverSchema = z.object({
  N8N_BASE_URL: z
    .string()
    .url("N8N_BASE_URL debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  N8N_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  N8N_NOTAS_CREDITO_PATH: z
    .string()
    .optional()
    .or(z.literal(""))
    .default("webhook/conciliacion-netsuite"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Falta la service role key de Supabase")
    .optional()
    .or(z.literal("")),
  // NetSuite (OAuth 2.0 M2M). Opcionales aquí para no romper el resto del
  // portal; `netsuiteConfig()` exige que estén completas al usarlas.
  NETSUITE_ACCOUNT_ID: z.string().optional().or(z.literal("")),
  NETSUITE_CONSUMER_KEY: z.string().optional().or(z.literal("")),
  NETSUITE_CERT_ID: z.string().optional().or(z.literal("")),
  NETSUITE_PRIVATE_KEY: z.string().optional().or(z.literal("")),
  EXPORTS_BUCKET: z
    .string()
    .optional()
    .transform((v) => v || "exports"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServer: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverSchema.safeParse({
    N8N_BASE_URL: process.env.N8N_BASE_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    N8N_NOTAS_CREDITO_PATH: process.env.N8N_NOTAS_CREDITO_PATH,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NETSUITE_ACCOUNT_ID: process.env.NETSUITE_ACCOUNT_ID,
    NETSUITE_CONSUMER_KEY: process.env.NETSUITE_CONSUMER_KEY,
    NETSUITE_CERT_ID: process.env.NETSUITE_CERT_ID,
    NETSUITE_PRIVATE_KEY: process.env.NETSUITE_PRIVATE_KEY,
    EXPORTS_BUCKET: process.env.EXPORTS_BUCKET,
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