import type { TourStep } from "@/components/tour/como-usar";
import { MAX_DIAS_EXPORT } from "@/lib/netsuite/rango-fechas";

/** Recorrido "¿Cómo usar?" de Movimientos bancarios NetSuite. */
export const TOUR_EXPORT_BANCOS: TourStep[] = [
  {
    title: "Exportar movimientos bancarios",
    description:
      "Genera un solo Excel con las líneas contables de las cuentas bancarias de NetSuite. Eliges el periodo, revisas las columnas y descargas.",
  },
  {
    target: "meses",
    title: "1. Elige el mes",
    description:
      "Un clic llena el rango completo del mes. El punto marca el mes en curso, que va hasta hoy.",
    side: "bottom",
  },
  {
    target: "fechas",
    title: "O ajusta las fechas",
    description: `Para un rango a medida. Se filtra por fecha de transacción y el máximo es ${MAX_DIAS_EXPORT} días.`,
    side: "bottom",
  },
  {
    target: "plantilla",
    title: "2. Elige la plantilla",
    description:
      "Una plantilla es un juego de columnas guardado para el equipo. Bancos estándar trae las de siempre. En el menú … puedes guardar tu selección como una plantilla nueva.",
    side: "bottom",
  },
  {
    target: "campos",
    title: "Ajusta las columnas",
    description:
      "Marca o desmarca campos. La casilla del grupo los marca todos. Si cambias la plantilla, aparece Modificada con la opción de restablecer o guardar los cambios.",
    side: "bottom",
  },
  {
    target: "catalogo",
    title: "Administra el catálogo",
    description:
      "Como administrador puedes renombrar, reordenar y habilitar campos, o descubrir campos nuevos en NetSuite.",
    side: "bottom",
  },
  {
    target: "resumen",
    title: "3. Revisa el resumen",
    description:
      "Confirma el rango, los días y cuántas columnas tendrá el Excel antes de generarlo.",
    side: "left",
  },
  {
    target: "generar",
    title: "Genera el Excel",
    description:
      "Un mes completo suele tardar alrededor de un minuto. Mientras consulta puedes cancelar; no cierres la pestaña.",
    side: "left",
  },
  {
    target: "estado",
    title: "4. Descarga el archivo",
    description:
      "Aquí ves el avance y, al terminar, las filas exportadas y el botón Descargar. El enlace dura 1 hora; después genera el Excel de nuevo.",
    side: "top",
  },
];
