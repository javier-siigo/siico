"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, hasRole, isAdmin, ROLE_INGRESOS } from "@/lib/auth/roles";
import { importRetiradosXlsx } from "@/lib/retirados/import";

export type ImportarRetiradosState = {
  ok?: boolean;
  error?: string;
  fileName?: string;
  total?: number;
  upserted?: number;
  errors?: number;
};

export async function importarRetiradosAction(
  _prev: ImportarRetiradosState | undefined,
  formData: FormData,
): Promise<ImportarRetiradosState> {
  const sb = await createClient();
  const { data } = await sb.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  const roles = await getUserRoles(userId);
  if (!isAdmin(roles) && !hasRole(roles, ROLE_INGRESOS)) {
    return { error: "No tienes permisos para importar el reporte." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Selecciona un archivo de Excel." };
  }

  const admin = createAdminClient();
  const result = await importRetiradosXlsx(admin, file, userId);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/ingresos/gestion-anticipos");
  revalidatePath("/admin/importar-retirados");

  return {
    ok: true,
    fileName: result.fileName,
    total: result.total,
    upserted: result.upserted,
    errors: result.errors,
  };
}
