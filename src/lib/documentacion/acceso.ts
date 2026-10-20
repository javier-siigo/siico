import "server-only";

import { redirect } from "next/navigation";

import { canAccessProceso, getUserRoles, isAdmin, type UserRolesInfo } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

import { DOCUMENTOS, type DocumentoMeta } from "./registry";

export interface ContextoDocumentacion {
  roles: UserRolesInfo;
  esAdmin: boolean;
  /** Documentos que el usuario puede leer, en el orden del registro. */
  accesibles: DocumentoMeta[];
}

/** Sesión, roles y documentos visibles. Los permisos se validan aquí, en el servidor. */
export async function contextoDocumentacion(): Promise<ContextoDocumentacion> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  const roles = await getUserRoles(data.claims.sub);
  return {
    roles,
    esAdmin: isAdmin(roles),
    accesibles: DOCUMENTOS.filter((d) => canAccessProceso(roles, "documentacion", d)),
  };
}
