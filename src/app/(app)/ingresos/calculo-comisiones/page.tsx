import { CalculoComisionesPageClient } from "@/components/calculo-comisiones/calculo-comisiones-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getComisionesData, type ComisionesData } from "@/lib/comisiones/actions";
import { periodoActual, shiftPeriodo } from "@/lib/comisiones/calculo";

export const metadata = {
  title: "Cálculo de Comisiones",
};

export default async function CalculoComisionesPage() {
  // Si Supabase falla (p. ej. migración sin aplicar) la página sigue
  // disponible para leer el informe; solo se pierde el cálculo y el guardado.
  let data: ComisionesData = {
    conceptos: [],
    valores: [],
    bases: [],
    reconocimientos: [],
    registrados: [],
    cierres: [],
  };
  let errorDatos: string | null = null;
  try {
    data = await getComisionesData();
  } catch (err) {
    errorDatos = err instanceof Error ? err.message : "Error inesperado.";
  }

  // El informe de un mes llega a inicios del siguiente: por defecto se abre
  // el mes anterior al actual.
  const periodoMax = periodoActual();

  return (
    <PageTransition>
      <CalculoComisionesPageClient
        data={data}
        periodoInicial={shiftPeriodo(periodoMax, -1)}
        periodoMax={periodoMax}
        errorDatos={errorDatos}
      />
    </PageTransition>
  );
}
