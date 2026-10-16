/**
 * Importa el reporte de Contabilidad de excolaboradores a Supabase.
 *
 * Es un wrapper CLI sobre `importRetiradosXlsx` en
 * `src/lib/retirados/import.ts`, que también usa la server action
 * `importarRetiradosAction` desde la web.
 *
 * Uso:
 *   npm run import:retirados -- /ruta/al/archivo.xlsx
 *
 * Variables de entorno (en .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createAdminClient } from "@/lib/supabase/admin";
import { importRetiradosXlsx } from "@/lib/retirados/import";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error(
      "Uso: npm run import:retirados -- <ruta.xlsx>",
    );
    process.exit(1);
  }
  const abs = path.resolve(fileArg);
  const buf = await readFile(abs);
  const file = new File([buf], path.basename(abs), {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const supabase = createAdminClient();
  const result = await importRetiradosXlsx(supabase, file);
  if (!result.ok) {
    console.error("✗", result.error);
    process.exit(1);
  }
  console.log(
    `✓ Importación completa: ${result.upserted}/${result.total} filas procesadas, ${result.errors} con error.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
