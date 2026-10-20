import type { TourStep } from "@/components/tour/como-usar";

/** Recorrido "¿Cómo usar?" del cierre mensual de comisiones. */
export const TOUR_COMISIONES: TourStep[] = [
  {
    title: "Cierre mensual de comisiones",
    description:
      "Las comisiones de cada mes se llevan al gasto al mismo ritmo en que se reconoce el ingreso de las facturas F93 y F94 de ese mes. El cierre se hace en 4 pasos y termina con los asientos para NetSuite.",
  },
  {
    target: "periodo",
    title: "Elige el mes",
    description:
      "Con las flechas o la lista. Los meses que ya tienen un cálculo guardado vienen marcados en la lista.",
    side: "bottom",
  },
  {
    target: "siguiente",
    title: "La banda Siguiente",
    description:
      "Siempre dice la única acción que sigue y cuántos pasos faltan; su botón te lleva a ese paso. Al final, aquí aparecen Exportar Excel y Guardar cierre.",
    side: "bottom",
  },
  {
    target: "paso-1",
    title: "1. Comisiones causadas",
    description:
      "El valor de cada concepto de comisión del mes con su cuenta de gasto. Si el mes está vacío, puedes copiar los valores del mes anterior y ajustarlos.",
    side: "bottom",
  },
  {
    target: "paso-2",
    title: "2. Facturación del mes",
    description:
      "Las facturas y notas crédito F93/F94 emitidas en el mes según NetSuite. El neto es la base del porcentaje de esta cohorte.",
    side: "bottom",
  },
  {
    target: "paso-3",
    title: "3. Informe diferido",
    description:
      "Arrastra el Excel mensual de contabilidad a cualquier parte de la página o elígelo aquí. Se lee en tu navegador y da el ingreso reconocido en el mes por cohorte.",
    side: "top",
  },
  {
    target: "paso-4",
    title: "4. Revisión y asientos",
    description:
      "El gasto por cohorte, los controles y los asientos para NetSuite, cada uno con Copiar para pegarlo. Resuelve los controles en error y guarda el cierre desde la banda.",
    side: "top",
  },
  {
    target: "seguimiento",
    title: "Seguimiento",
    description:
      "La matriz histórica por cohorte y los cierres guardados. Desde ahí abres cualquier mes para revisarlo.",
    side: "bottom",
  },
];
