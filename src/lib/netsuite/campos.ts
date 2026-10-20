/** Catálogo de campos de la exportación de bancos, compartido vista/servidor. */

export const TABLAS = ["t", "tl", "tal", "a"] as const;
export type Tabla = (typeof TABLAS)[number];

export const TABLA_LABEL: Record<Tabla, string> = {
  t: "Transacción",
  tl: "Línea de transacción",
  tal: "Línea contable",
  a: "Cuenta",
};

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

/** Expresión SuiteQL del campo, p. ej. `BUILTIN.DF(tl.entity)`. */
export function expresionCampo(c: Pick<CampoCatalogo, "tabla" | "campo" | "modo" | "tipo">): string {
  if (!(TABLAS as readonly string[]).includes(c.tabla) || !CAMPO_RE.test(c.campo)) {
    throw new Error(`Campo inválido: ${c.tabla}.${c.campo}`);
  }
  const ref = `${c.tabla}.${c.campo}`;
  if (c.modo === "texto") return `BUILTIN.DF(${ref})`;
  // TO_CHAR: sin él SuiteQL usa el formato de fecha del usuario de integración.
  if (c.tipo === "date") return `TO_CHAR(${ref}, 'YYYY-MM-DD')`;
  if (c.tipo === "datetime") return `TO_CHAR(${ref}, 'YYYY-MM-DD HH24:MI:SS')`;
  return ref;
}

export function claveCampo(c: Pick<CampoCatalogo, "tabla" | "campo" | "modo">): string {
  return `${c.tabla}.${c.campo}:${c.modo}`;
}
