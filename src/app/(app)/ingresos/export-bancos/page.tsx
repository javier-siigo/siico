import { redirect } from "next/navigation";

import { ExportBancosPageClient } from "@/components/export-bancos/export-bancos-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getUserRoles, isAdmin, requireProcesoAccess } from "@/lib/auth/roles";
import { getCamposData, type CamposData } from "@/lib/netsuite/campos-actions";
import { hoyIso, mesAnterior } from "@/lib/netsuite/rango-fechas";
import { createClient } from "@/lib/supabase/server";

// El descubrimiento de campos (server action) consulta NetSuite hasta ~50 s.
export const maxDuration = 60;

export const metadata = {
  title: "Auditoría Asientos de Diario",
};

export default async function ExportBancosPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  const roles = await getUserRoles(data.claims.sub);
  await requireProcesoAccess(roles, "ingresos", { slug: "export-bancos" });
  const esAdmin = isAdmin(roles);

  let camposData: CamposData = { campos: [], plantillas: [] };
  let errorCampos: string | null = null;
  try {
    camposData = await getCamposData(esAdmin);
  } catch (err) {
    errorCampos = err instanceof Error ? err.message : "Error inesperado.";
  }

  return (
    <PageTransition>
      <ExportBancosPageClient
        rangoInicial={mesAnterior()}
        hoy={hoyIso()}
        campos={camposData.campos}
        plantillas={camposData.plantillas}
        esAdmin={esAdmin}
        errorCampos={errorCampos}
      />
    </PageTransition>
  );
}
