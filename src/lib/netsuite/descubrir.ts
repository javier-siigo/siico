import "server-only";

import {
  CAMPO_RE,
  TABLAS_NETSUITE,
  claveCampo,
  type CampoDescubierto,
  type ModoCampo,
  type Tabla,
  type TipoCampo,
} from "./campos";
import { getAccessToken, netsuiteConfig, runSuiteQL, suiteQLPage } from "./client";
import { fromBancos } from "./export-bancos";

/**
 * Descubre los campos disponibles en las cuatro tablas de la exportación con
 * una muestra `SELECT alias.*` de varios días. SuiteQL omite los campos
 * nulos, así que un campo vacío en toda la muestra no aparece: por eso se
 * muestrean varios días. Los campos personalizados toman etiqueta y tipo de
 * la tabla `customfield`.
 */

const FILAS_POR_MUESTRA = 200;
const CONCURRENCIA = 4;

/** `fieldvaluetype` de customfield (español o inglés según el usuario). */
const TIPO_CUSTOM: Record<string, TipoCampo> = {
  fecha: "date",
  date: "date",
  "fecha/hora": "datetime",
  "date/time": "datetime",
  "casilla de verificación": "boolean",
  "check box": "boolean",
  moneda: "number",
  currency: "number",
  "número decimal": "number",
  "decimal number": "number",
  "número entero": "number",
  "integer number": "number",
  porcentaje: "number",
  percent: "number",
};
const LISTA_CUSTOM = new Set(["lista/registro", "list/record", "selección múltiple", "multiple select"]);

const NOMBRE_NUMERICO = /(amount|rate|debit|credit|balance|total|quantity|cost|price)/;

/** Tipo sugerido a partir de los valores de la muestra (todos strings). */
function inferirTipo(campo: string, valores: string[]): TipoCampo {
  if (valores.length === 0) return "text";
  if (valores.every((v) => v === "T" || v === "F")) return "boolean";
  if (valores.every((v) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v))) return "date";
  if (valores.every((v) => /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/.test(v))) return "datetime";
  if (valores.every((v) => /^-?\d+(\.\d+)?(E-?\d+)?$/i.test(v))) {
    // Los enteros suelen ser IDs internos; solo se sugiere número si hay
    // decimales o el nombre lo indica.
    if (valores.some((v) => /[.E]/i.test(v)) || NOMBRE_NUMERICO.test(campo)) return "number";
  }
  return "text";
}

function diasDeMuestra(hoy = new Date()): string[] {
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  return [5, 15, 25].map((d) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10));
}

async function enParalelo<T>(tareas: (() => Promise<T>)[], limite: number): Promise<T[]> {
  const out: T[] = new Array(tareas.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limite, tareas.length) }, async () => {
      while (next < tareas.length) {
        const i = next++;
        out[i] = await tareas[i]!();
      }
    }),
  );
  return out;
}

export async function descubrirCampos(existentes: Set<string>): Promise<CampoDescubierto[]> {
  const config = netsuiteConfig();
  const signal = AbortSignal.timeout(50_000);
  const token = await getAccessToken(config, signal);

  const muestras: { tabla: Tabla; items: Record<string, unknown>[] }[] = [];
  const tareas = TABLAS_NETSUITE.flatMap((tabla) =>
    diasDeMuestra().map((dia) => async () => {
      const items = await suiteQLPage(
        config,
        token,
        `SELECT ${tabla}.* ${fromBancos(dia)}`,
        FILAS_POR_MUESTRA,
        signal,
      );
      muestras.push({ tabla, items });
    }),
  );

  const [, customFields] = await Promise.all([
    enParalelo(tareas, CONCURRENCIA),
    runSuiteQL(
      config,
      token,
      "SELECT scriptid, name, fieldvaluetype FROM customfield WHERE scriptid LIKE 'CUST%' ORDER BY id",
      ["scriptid", "name", "fieldvaluetype"] as const,
      signal,
    ),
  ]);

  const custom = new Map(
    customFields.map((f) => [
      String(f.scriptid).toLowerCase(),
      { nombre: String(f.name ?? "").trim(), tipo: String(f.fieldvaluetype ?? "").toLowerCase() },
    ]),
  );

  // Valores de muestra por tabla.campo.
  const valores = new Map<string, { tabla: Tabla; campo: string; valores: string[] }>();
  for (const { tabla, items } of muestras) {
    for (const item of items) {
      for (const [campo, v] of Object.entries(item)) {
        if (campo === "links" || !CAMPO_RE.test(campo)) continue;
        const key = `${tabla}.${campo}`;
        const entry = valores.get(key) ?? { tabla, campo, valores: [] };
        if (v !== null && v !== undefined && v !== "" && entry.valores.length < 50) {
          entry.valores.push(String(v));
        }
        valores.set(key, entry);
      }
    }
  }

  const out: CampoDescubierto[] = [];
  const push = (c: CampoDescubierto) => {
    if (!existentes.has(claveCampo(c))) out.push(c);
  };
  for (const { tabla, campo, valores: vs } of valores.values()) {
    const cf = custom.get(campo);
    const ejemplo = vs[0]?.slice(0, 80) ?? null;
    if (cf) {
      const esLista = LISTA_CUSTOM.has(cf.tipo);
      const base = {
        tabla,
        campo,
        etiqueta: (cf.nombre || campo).slice(0, 80),
        personalizado: true,
        ejemplo,
      };
      if (esLista) {
        push({ ...base, modo: "texto" as ModoCampo, tipo: "text" });
        push({ ...base, etiqueta: `ID ${base.etiqueta}`.slice(0, 80), modo: "valor", tipo: "text" });
      } else {
        push({ ...base, modo: "valor", tipo: TIPO_CUSTOM[cf.tipo] ?? inferirTipo(campo, vs) });
      }
    } else {
      push({
        tabla,
        campo,
        modo: "valor",
        etiqueta: campo,
        tipo: inferirTipo(campo, vs),
        personalizado: false,
        ejemplo,
      });
    }
  }

  return out.sort((a, b) =>
    a.tabla === b.tabla
      ? Number(a.personalizado) - Number(b.personalizado) || a.campo.localeCompare(b.campo)
      : TABLAS_NETSUITE.indexOf(a.tabla as (typeof TABLAS_NETSUITE)[number]) -
        TABLAS_NETSUITE.indexOf(b.tabla as (typeof TABLAS_NETSUITE)[number]),
  );
}
