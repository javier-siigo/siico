import "server-only";

import { refCampo, type CampoCatalogo } from "./campos";
import { errorRango, type Filtro } from "./filtros";
import { esCampoTipo, esTipoPersonalizado } from "./tipos-documento";

/**
 * Traduce filtros a condiciones SuiteQL. Las expresiones salen del catálogo
 * (tabla y campo ya validados con regex) y los valores van como literales
 * escapados: el cliente nunca aporta SQL.
 */

const ref = refCampo;

/** Literal de texto SuiteQL: comillas duplicadas, sin caracteres de control. */
export function literal(value: string): string {
  if (/[\u0000-\u001f]/.test(value)) throw new Error("Valor con caracteres no permitidos");
  return `'${value.replace(/'/g, "''")}'`;
}

function literalFecha(value: string): string {
  if (errorRango("date", value)) throw new Error(`Fecha inválida: ${value}`);
  return `TO_DATE(${literal(value)}, 'YYYY-MM-DD')`;
}

function literalNumero(value: string): string {
  if (errorRango("number", value)) throw new Error(`Número inválido: ${value}`);
  return value;
}

/**
 * Expresión sobre la que filtra una lista: el valor crudo (ids, códigos), así
 * la comparación es exacta aunque se muestre el nombre. Las fechas se agrupan
 * por día.
 */
export function expresionLista(c: CampoCatalogo): string {
  if (c.tipo === "date") return `TO_CHAR(${ref(c)}, 'YYYY-MM-DD')`;
  return ref(c);
}

/** Expresión para buscar texto: el nombre visible si el campo lo usa. */
function expresionTexto(c: CampoCatalogo): string {
  return c.modo === "texto" ? `BUILTIN.DF(${ref(c)})` : ref(c);
}

function escaparLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Tipos estándar por `t.type`; personalizados por `t.recordtype`. */
function condicionTipo(f: Extract<Filtro, { tipo: "lista" }>): string {
  const valores = f.valores.map((x) => x.v).filter((v): v is string => v !== null);
  const estandar = valores.filter((v) => !esTipoPersonalizado(v)).map(literal);
  const personalizados = valores.filter(esTipoPersonalizado).map(literal);
  const partes = [
    estandar.length > 0 ? `t.type IN (${estandar.join(", ")})` : null,
    personalizados.length > 0 ? `t.recordtype IN (${personalizados.join(", ")})` : null,
  ].filter(Boolean);
  // `t.type` nunca es nulo: elegir solo "(vacío)" no deja pasar nada.
  const en = partes.length > 0 ? `(${partes.join(" OR ")})` : "(1 = 0)";
  return f.modo === "incluir" ? en : `NOT ${en}`;
}

function condicion(f: Filtro, c: CampoCatalogo): string {
  switch (f.tipo) {
    case "lista": {
      if (esCampoTipo(c)) return condicionTipo(f);
      const expr = expresionLista(c);
      const conValor = f.valores.filter((x) => x.v !== null).map((x) => literal(x.v!));
      const incluyeVacio = f.valores.some((x) => x.v === null);
      const enLista = conValor.length > 0 ? `${expr} IN (${conValor.join(", ")})` : null;
      if (f.modo === "incluir") {
        const partes = [enLista, incluyeVacio ? `${expr} IS NULL` : null].filter(Boolean);
        return `(${partes.join(" OR ")})`;
      }
      const partes = [
        incluyeVacio ? `${expr} IS NOT NULL` : null,
        enLista ? (incluyeVacio ? `NOT (${enLista})` : `(${expr} IS NULL OR NOT (${enLista}))`) : null,
      ].filter(Boolean);
      return `(${partes.join(" AND ")})`;
    }
    case "texto": {
      const expr = `LOWER(${expresionTexto(c)})`;
      const v = escaparLike(f.valor.trim().toLowerCase());
      if (f.op === "empieza") return `${expr} LIKE ${literal(`${v}%`)} ESCAPE '\\'`;
      const like = `${expr} LIKE ${literal(`%${v}%`)} ESCAPE '\\'`;
      return f.op === "contiene" ? like : `(${expr} IS NULL OR NOT (${like}))`;
    }
    case "rango": {
      const r = ref(c);
      const partes: string[] = [];
      if (c.tipo === "number") {
        if (f.min !== null) partes.push(`${r} >= ${literalNumero(f.min)}`);
        if (f.max !== null) partes.push(`${r} <= ${literalNumero(f.max)}`);
      } else {
        // Fechas por día completo: el máximo incluye todo ese día.
        if (f.min !== null) partes.push(`${r} >= ${literalFecha(f.min)}`);
        if (f.max !== null) partes.push(`${r} < ${literalFecha(f.max)} + 1`);
      }
      return `(${partes.join(" AND ")})`;
    }
    case "presencia":
      return `${ref(c)} IS ${f.op === "con_valor" ? "NOT " : ""}NULL`;
  }
}

/** Condiciones `AND …` para añadir al WHERE, o cadena vacía sin filtros. */
/**
 * Sin filtro de Tipo Cuenta la exportación es de bancos: solo cuentas
 * bancarias y sin diarios (salvo que un filtro de Tipo Documento los pida).
 * Con filtro de Tipo Cuenta se exporta cualquier documento contable de esas
 * cuentas, diarios incluidos.
 */
export const SOLO_BANCOS = "\n  AND a.accttype = 'Bank'";
export const SIN_DIARIOS = "\n  AND t.type <> 'Journal'";

export function esCampoTipoCuenta(c: Pick<CampoCatalogo, "tabla" | "campo">): boolean {
  return c.tabla === "a" && c.campo === "accttype";
}

/** Hay un filtro de Tipo Cuenta: deja de ser una exportación solo de bancos. */
export function eligeTipoCuenta(filtros: Filtro[], campos: Map<string, CampoCatalogo>): boolean {
  return filtros.some((f) => {
    const c = campos.get(f.campoId);
    return c !== undefined && esCampoTipoCuenta(c);
  });
}

function pideDiarios(filtros: Filtro[], campos: Map<string, CampoCatalogo>): boolean {
  return filtros.some((f) => {
    const c = campos.get(f.campoId);
    return (
      c !== undefined &&
      esCampoTipo(c) &&
      f.tipo === "lista" &&
      f.modo === "incluir" &&
      f.valores.some((x) => x.v === "Journal")
    );
  });
}

/** Condiciones `AND …` del universo (bancos o no) y de los filtros. */
export function whereFiltros(filtros: Filtro[], campos: Map<string, CampoCatalogo>): string {
  const condiciones = filtros
    .map((f) => {
      const c = campos.get(f.campoId);
      if (!c) throw new Error(`Campo de filtro desconocido: ${f.campoId}`);
      return `\n  AND ${condicion(f, c)}`;
    })
    .join("");
  if (eligeTipoCuenta(filtros, campos)) return condiciones;
  return SOLO_BANCOS + (pideDiarios(filtros, campos) ? "" : SIN_DIARIOS) + condiciones;
}
