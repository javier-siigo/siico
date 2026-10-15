import { CalculoComisionesPageClient } from "@/components/calculo-comisiones/calculo-comisiones-page";
import {
  CONCEPTOS_DEMO,
  CONTROLES_DEMO,
  EJECUCIONES_HISTORICO,
  PERIODOS,
  RESUMENES_POR_PERIODO,
  TIPOS_FACTURACION_DEMO,
} from "@/components/calculo-comisiones/mock-data";
import { PageTransition } from "@/components/motion/page-transition";

export const metadata = {
  title: "Cálculo de Comisiones",
};

export default function CalculoComisionesPage() {
  const periodoInicial = PERIODOS[0]?.id ?? "2026-10";
  const resumenInicial =
    RESUMENES_POR_PERIODO[periodoInicial] ??
    Object.values(RESUMENES_POR_PERIODO)[0];
  if (!resumenInicial) {
    throw new Error("No hay resumenes disponibles");
  }

  return (
    <PageTransition>
      <CalculoComisionesPageClient
        periodos={PERIODOS}
        resumenInicial={resumenInicial}
        ejecucionesIniciales={EJECUCIONES_HISTORICO}
        tiposIniciales={TIPOS_FACTURACION_DEMO}
        conceptosIniciales={CONCEPTOS_DEMO}
        controlesIniciales={CONTROLES_DEMO}
      />
    </PageTransition>
  );
}
