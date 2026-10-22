/** Catálogo de campos de la exportación de bancos, compartido vista/servidor. */

import type { Filtro } from "./filtros";

export const TABLAS = ["t", "tl", "tal", "a", "ter"] as const;
export type Tabla = (typeof TABLAS)[number];

/** Tablas de NetSuite que se pueden muestrear con `alias.*` (descubrir campos). */
export const TABLAS_NETSUITE = ["t", "tl", "tal", "a"] as const satisfies readonly Tabla[];

export const TABLA_LABEL: Record<Tabla, string> = {
  t: "Transacción",
  tl: "Línea de transacción",
  tal: "Línea contable",
  a: "Cuenta",
  ter: "Tercero",
};

/**
 * Campos de "Tercero": el tercero de la línea (`tl.entity`) puede ser
 * cliente, proveedor o empleado, cada uno en su tabla; se toma el que exista.
 * Solo se unen esas tablas si algún campo o filtro los usa.
 */
export const CAMPOS_TERCERO: Record<string, string> = {
  documento: "COALESCE(cu.custentity_ks_documento, ve.custentity_ks_documento, em.custentity_ks_documento)",
  nombre: "COALESCE(cu.companyname, ve.companyname, TRIM(em.firstname || ' ' || em.lastname))",
};

export const JOINS_TERCERO = `
LEFT JOIN customer cu ON cu.id = tl.entity
LEFT JOIN vendor ve ON ve.id = tl.entity
LEFT JOIN employee em ON em.id = tl.entity`;

export function usaTercero(campos: Iterable<Pick<CampoCatalogo, "tabla">>): boolean {
  for (const c of campos) if (c.tabla === "ter") return true;
  return false;
}

export const TIPOS = ["text", "number", "date", "datetime", "boolean"] as const;
export type TipoCampo = (typeof TIPOS)[number];

export const TIPO_LABEL: Record<TipoCampo, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
  datetime: "Fecha y hora",
  boolean: "Sí/No",
};

export type ModoCampo = "valor" | "texto";

/** Identificador SuiteQL permitido (mismo check que la tabla). */
export const CAMPO_RE = /^[a-z][a-z0-9_]{0,99}$/;

export interface CampoCatalogo {
  id: string;
  tabla: Tabla;
  campo: string;
  modo: ModoCampo;
  etiqueta: string;
  tipo: TipoCampo;
  habilitado: boolean;
  orden: number;
}

export interface Plantilla {
  id: string;
  nombre: string;
  campos: string[];
  filtros: Filtro[];
  updatedAt: string;
}

/** Campo encontrado en NetSuite que aún no está en el catálogo. */
export interface CampoDescubierto {
  tabla: Tabla;
  campo: string;
  modo: ModoCampo;
  etiqueta: string;
  tipo: TipoCampo;
  /** Etiqueta de NetSuite para campos personalizados (custbody, custcol…). */
  personalizado: boolean;
  ejemplo: string | null;
}

/** Referencia SuiteQL cruda del campo, p. ej. `tl.entity`. */
export function refCampo(c: Pick<CampoCatalogo, "tabla" | "campo">): string {
  if (!(TABLAS as readonly string[]).includes(c.tabla) || !CAMPO_RE.test(c.campo)) {
    throw new Error(`Campo inválido: ${c.tabla}.${c.campo}`);
  }
  if (c.tabla === "ter") {
    const expr = CAMPOS_TERCERO[c.campo];
    if (!expr) throw new Error(`Campo de tercero desconocido: ${c.campo}`);
    return expr;
  }
  return `${c.tabla}.${c.campo}`;
}

/** Expresión SuiteQL del campo, p. ej. `BUILTIN.DF(tl.entity)`. */
export function expresionCampo(c: Pick<CampoCatalogo, "tabla" | "campo" | "modo" | "tipo">): string {
  const ref = refCampo(c);
  if (c.modo === "texto") return `BUILTIN.DF(${ref})`;
  // TO_CHAR: sin él SuiteQL usa el formato de fecha del usuario de integración.
  if (c.tipo === "date") return `TO_CHAR(${ref}, 'YYYY-MM-DD')`;
  if (c.tipo === "datetime") return `TO_CHAR(${ref}, 'YYYY-MM-DD HH24:MI:SS')`;
  return ref;
}

/**
 * Orden de las columnas: el de la plantilla para sus campos y, al final, los
 * agregados en el orden del catálogo.
 */
export function ordenColumnas(
  seleccion: Set<string>,
  habilitados: Pick<CampoCatalogo, "id">[],
  plantilla: string[] = [],
): string[] {
  const validos = new Set(habilitados.map((c) => c.id));
  const dePlantilla = plantilla.filter((id) => seleccion.has(id) && validos.has(id));
  const ya = new Set(dePlantilla);
  return [...dePlantilla, ...habilitados.filter((c) => seleccion.has(c.id) && !ya.has(c.id)).map((c) => c.id)];
}

export function claveCampo(c: Pick<CampoCatalogo, "tabla" | "campo" | "modo">): string {
  return `${c.tabla}.${c.campo}:${c.modo}`;
}
