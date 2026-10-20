import type { TourStep } from "@/components/tour/como-usar";

/** Recorrido "¿Cómo usar?" de Notas crédito. */
export const TOUR_NOTAS_CREDITO: TourStep[] = [
  {
    title: "Conciliar notas crédito",
    description:
      "Concilia el archivo INFORME de notas crédito contra NetSuite: lo subes, el flujo lo procesa y descargas un Excel con los duplicados resueltos y las diferencias negativas resaltadas en rojo.",
  },
  {
    target: "subir",
    title: "1. Sube el archivo INFORME y procésalo",
    description:
      "Arrástralo aquí o haz clic para elegirlo (.xlsx, .xls o .csv, hasta 10 MB). Con el archivo elegido aparece el botón Procesar: se sube y se ejecuta la conciliación. Si te equivocaste de archivo, quítalo con la X.",
    side: "bottom",
  },
  {
    target: "resultado",
    title: "2. Descarga el resultado",
    description:
      "Aquí ves el avance y, al terminar, el botón para descargar el Excel conciliado. Si algo falla, el mensaje dice qué pasó y puedes reintentar.",
    side: "bottom",
  },
  {
    target: "historial",
    title: "Historial de esta sesión",
    description:
      "Cada corrida queda aquí para volver a descargarla. El historial se borra al recargar o cerrar la página.",
    side: "top",
  },
];
