import type { TourStep } from "@/components/tour/como-usar";
import { MAX_DIAS_EXPORT } from "@/lib/netsuite/rango-fechas";

/** Recorrido "¿Cómo usar?" de Auditoría Asientos de Diario. */
export const TOUR_EXPORT_BANCOS: TourStep[] = [
  {
    title: "Auditoría Asientos de Diario",
    description:
      "Genera un solo Excel con las líneas contables de NetSuite: de cuentas bancarias o, con un filtro de Tipo Cuenta, de todos los documentos. Eliges el periodo, revisas las columnas y descargas.",
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
    target: "filtros",
    title: "2. Filtra las líneas",
    description:
      "Sin filtros salen todas las líneas de cuentas bancarias, sin diarios. Con un filtro de Tipo Cuenta (por ejemplo Ingresos o Cuentas por cobrar) salen todos los documentos contables de esas cuentas, diarios incluidos.",
    side: "bottom",
  },
  {
    target: "filtros-sugeridos",
    title: "Empieza por un sugerido",
    description:
      "Un clic agrega el filtro de los campos más usados: Tipo Cuenta, Subsidiaria, Tipo Documento, Moneda…",
    side: "bottom",
  },
  {
    target: "agregar-filtro",
    title: "Agrega cualquier campo",
    description:
      "Busca el campo y elige cómo filtrar: una lista con los valores de NetSuite (es / no es), un rango de montos o fechas, un texto (contiene, no contiene, empieza por) o si tiene valor o está vacío.",
    side: "left",
  },
  {
    target: "filtros-lista",
    title: "Edita o quita un filtro",
    description:
      "Haz clic en un filtro para cambiarlo y en la X para quitarlo. Uno con borde punteado está sin definir y no se aplica. Todos los filtros se cumplen a la vez.",
    side: "bottom",
  },
  {
    target: "plantilla",
    title: "3. Elige la plantilla",
    description:
      "Una plantilla guarda columnas y filtros para el equipo. Bancos estándar trae las de siempre; Auditoría · Documentos contables, las de la auditoría. En el menú … puedes guardar tu selección como una plantilla nueva.",
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
    title: "4. Revisa el resumen",
    description:
      "Confirma el rango, los días, los filtros activos y cuántas columnas tendrá el Excel antes de generarlo.",
    side: "left",
  },
  {
    target: "generar",
    title: "Genera el Excel",
    description:
      "Un mes de bancos suele tardar alrededor de un minuto; uno de ingresos, unos 3. Mientras consulta puedes cancelar; no cierres la pestaña.",
    side: "left",
  },
  {
    target: "estado",
    title: "5. Descarga el archivo",
    description:
      "Aquí ves el avance y, al terminar, las filas exportadas y el botón Descargar. El enlace dura 1 hora; después genera el Excel de nuevo.",
    side: "top",
  },
];
