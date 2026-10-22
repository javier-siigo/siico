/**
 * Filtros de la exportación de bancos, compartidos vista/servidor.
 *
 * Todos se combinan con AND. Cada filtro apunta a un campo del catálogo por
 * id; el SQL se arma en el servidor (`filtros-sql.ts`) solo con filas del
 * catálogo y literales escapados, nunca con texto del cliente.
 */
import { z } from "zod";

import type { CampoCatalogo, TipoCampo } from "./campos";

/** Valor elegido en un filtro de lista: `v` es el valor crudo (null = vacío). */
export interface ValorLista {
  v: string | null;
  /** Nombre visible (BUILTIN.DF) al momento de elegirlo; solo para mostrar. */
  l: string;
}

export type Filtro =
  | { campoId: string; tipo: "lista"; modo: "incluir" | "excluir"; valores: ValorLista[] }
  | { campoId: string; tipo: "texto"; op: "contiene" | "no_contiene" | "empieza"; valor: string }
  | { campoId: string; tipo: "rango"; min: string | null; max: string | null }
  | { campoId: string; tipo: "presencia"; op: "con_valor" | "vacio" };

export type TipoFiltro = Filtro["tipo"];

export const MAX_FILTROS = 20;
export const MAX_VALORES_LISTA = 500;
/** Opciones que devuelve NetSuite por campo (las de más filas primero). */
export const MAX_OPCIONES = 300;
/** Días hacia atrás de los que se sacan los valores del filtro de lista. */
export const VENTANA_DIAS = 90;
/** Días que dura la caché de valores antes de refrescarse. */
export const VIGENCIA_DIAS = 7;

const NUMERO_RE = /^-?\d{1,15}(\.\d{1,10})?$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Tipos de filtro que admite un campo, el primero es el sugerido. */
export function tiposFiltro(tipo: TipoCampo): TipoFiltro[] {
  switch (tipo) {
    case "number":
      return ["rango", "lista", "presencia"];
    case "date":
      return ["lista", "rango", "presencia"];
    case "datetime":
      return ["rango", "presencia"];
    case "boolean":
      return ["lista", "presencia"];
    default:
      return ["lista", "texto", "presencia"];
  }
}

export const TIPO_FILTRO_LABEL: Record<TipoFiltro, string> = {
  lista: "Elegir valores",
  texto: "Buscar texto",
  rango: "Rango",
  presencia: "Con valor / vacío",
};

export const OP_TEXTO_LABEL = {
  contiene: "contiene",
  no_contiene: "no contiene",
  empieza: "empieza por",
} as const;

export function filtroVacio(campo: CampoCatalogo, tipo: TipoFiltro = tiposFiltro(campo.tipo)[0]!): Filtro {
  switch (tipo) {
    case "lista":
      return { campoId: campo.id, tipo, modo: "incluir", valores: [] };
    case "texto":
      return { campoId: campo.id, tipo, op: "contiene", valor: "" };
    case "rango":
      return { campoId: campo.id, tipo, min: null, max: null };
    case "presencia":
      return { campoId: campo.id, tipo, op: "con_valor" };
  }
}

/** Un filtro sin datos no restringe nada: no se envía ni se guarda. */
export function filtroActivo(f: Filtro): boolean {
  switch (f.tipo) {
    case "lista":
      return f.valores.length > 0;
    case "texto":
      return f.valor.trim().length > 0;
    case "rango":
      return f.min !== null || f.max !== null;
    case "presencia":
      return true;
  }
}

/** Error de validación de un valor de rango, o null. */
export function errorRango(tipo: TipoCampo, valor: string | null): string | null {
  if (valor === null || valor === "") return null;
  if (tipo === "number") return NUMERO_RE.test(valor) ? null : "Número inválido";
  return FECHA_RE.test(valor) ? null : "Fecha inválida (AAAA-MM-DD)";
}

const NUMBER_FMT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 10 });

function fmtRango(tipo: TipoCampo, v: string) {
  return tipo === "number" ? NUMBER_FMT.format(Number(v)) : v;
}

/** Resumen corto para el chip del filtro, p. ej. "es Pago, Cheque". */
export function describirFiltro(f: Filtro, campo: Pick<CampoCatalogo, "tipo">): string {
  switch (f.tipo) {
    case "lista": {
      const nombres = f.valores.map((x) => (x.v === null ? "(vacío)" : x.l || x.v));
      const lista =
        nombres.length <= 2 ? nombres.join(", ") : `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
      return `${f.modo === "incluir" ? "es" : "no es"} ${lista}`;
    }
    case "texto":
      return `${OP_TEXTO_LABEL[f.op]} “${f.valor.trim()}”`;
    case "rango":
      if (f.min !== null && f.max !== null)
        return `entre ${fmtRango(campo.tipo, f.min)} y ${fmtRango(campo.tipo, f.max)}`;
      if (f.min !== null) return `≥ ${fmtRango(campo.tipo, f.min)}`;
      return `≤ ${fmtRango(campo.tipo, f.max!)}`;
    case "presencia":
      return f.op === "con_valor" ? "tiene valor" : "está vacío";
  }
}

// ---------------------------------------------------------------------------
// Validación (API y server actions)

const textoLibre = z
  .string()
  .max(200)
  .refine((s) => !/[\u0000-\u001f]/.test(s), "Texto con caracteres no permitidos");

const valorRango = z.string().max(20).nullable();

export const filtroSchema = z.discriminatedUnion("tipo", [
  z.object({
    campoId: z.uuid(),
    tipo: z.literal("lista"),
    modo: z.enum(["incluir", "excluir"]),
    valores: z
      .array(z.object({ v: textoLibre.nullable(), l: z.string().max(300) }))
      .min(1)
      .max(MAX_VALORES_LISTA),
  }),
  z.object({
    campoId: z.uuid(),
    tipo: z.literal("texto"),
    op: z.enum(["contiene", "no_contiene", "empieza"]),
    valor: textoLibre.refine((s) => s.trim().length > 0, "Escribe el texto a buscar"),
  }),
  z.object({
    campoId: z.uuid(),
    tipo: z.literal("rango"),
    min: valorRango,
    max: valorRango,
  }),
  z.object({
    campoId: z.uuid(),
    tipo: z.literal("presencia"),
    op: z.enum(["con_valor", "vacio"]),
  }),
]);

export const filtrosSchema = z.array(filtroSchema).max(MAX_FILTROS, `Máximo ${MAX_FILTROS} filtros`);

/**
 * Valida los filtros contra el catálogo: el campo debe existir y admitir ese
 * tipo de filtro, y los rangos deben tener el formato del campo.
 */
export function validarFiltros(
  filtros: Filtro[],
  campos: Map<string, CampoCatalogo>,
): string | null {
  for (const f of filtros) {
    const campo = campos.get(f.campoId);
    if (!campo) return "Un filtro usa un campo que ya no está habilitado en el catálogo.";
    if (!tiposFiltro(campo.tipo).includes(f.tipo)) {
      return `El campo “${campo.etiqueta}” no admite ese tipo de filtro.`;
    }
    if (f.tipo === "rango") {
      if (f.min === null && f.max === null) return `Completa el rango de “${campo.etiqueta}”.`;
      const err = errorRango(campo.tipo, f.min) ?? errorRango(campo.tipo, f.max);
      if (err) return `${campo.etiqueta}: ${err}`;
    }
  }
  return null;
}

/** Filtros guardados en una plantilla; descarta los que ya no son válidos. */
export function parseFiltrosGuardados(raw: unknown): Filtro[] {
  const parsed = filtrosSchema.safeParse(raw);
  return parsed.success ? (parsed.data as Filtro[]) : [];
}

/** Forma canónica de los filtros activos, para comparar con una plantilla. */
function claveFiltros(filtros: Filtro[]): string {
  return JSON.stringify(
    filtros.filter(filtroActivo).map((f) =>
      f.tipo === "lista"
        ? { ...f, valores: f.valores.map((x) => x.v).sort((a, b) => String(a).localeCompare(String(b))) }
        : f,
    ),
  );
}

export function mismosFiltros(a: Filtro[], b: Filtro[]): boolean {
  return claveFiltros(a) === claveFiltros(b);
}

/** Filtros de una plantilla cuyos campos siguen habilitados. */
export function filtrosValidos(filtros: Filtro[], habilitados: Set<string>): Filtro[] {
  return filtros.filter((f) => habilitados.has(f.campoId));
}
