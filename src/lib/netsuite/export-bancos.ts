import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ExcelJS from "exceljs";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { expresionCampo, type CampoCatalogo, type TipoCampo } from "./campos";
import {
  NetSuiteError,
  getAccessToken,
  netsuiteConfig,
  runSuiteQL,
} from "./client";
import { diasDelRango } from "./rango-fechas";

/**
 * Exporta las líneas contables de cuentas bancarias de NetSuite a un único
 * .xlsx con los campos elegidos del catálogo. Una query SuiteQL por día
 * (límite de 100k filas por query), varios días en paralelo, y escritura en
 * streaming a /tmp en orden de fecha. El archivo se sube a Supabase Storage
 * porque supera el límite de respuesta de Vercel.
 */

export class ExportStorageError extends Error {
  readonly code = "storage";
  constructor(message: string) {
    super(message);
    this.name = "ExportStorageError";
  }
}

export interface ExportBancosResult {
  url: string;
  fileName: string;
  filas: number;
  duracionMs: number;
}

const CONCURRENCIA = 5;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
/**
 * Tiempo máximo para la fase de NetSuite. Deja margen dentro de los 300 s de
 * la función para cerrar el libro y subirlo, y así devolver un error claro
 * en lugar del 504 de Vercel.
 */
const NETSUITE_DEADLINE_MS = 240_000;

/** Filtro común: líneas contables contabilizadas de cuentas bancarias de un día. */
export function fromBancos(fecha: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  return `FROM transactionaccountingline tal
JOIN transaction t ON t.id = tal.transaction
JOIN transactionline tl ON tl.transaction = tal.transaction AND tl.id = tal.transactionline
JOIN account a ON a.id = tal.account
WHERE tal.posting = 'T' AND a.accttype = 'Bank' AND t.type <> 'Journal'
  AND t.trandate = TO_DATE('${fecha}','YYYY-MM-DD')`;
}

// Columnas auxiliares para ordenar; no van al Excel.
const ORDEN_KEYS = ["k_tranid", "k_tid", "k_tlid", "k_aid"] as const;

/**
 * Se pagina ordenando solo por claves numéricas: con `ORDER BY t.tranid`
 * primero, NetSuite ignora el `offset` y repite la primera página. El orden
 * por número de documento se aplica después, en memoria (`ordenarDia`).
 */
function queryDelDia(fecha: string, campos: CampoCatalogo[]): string {
  const select = [
    ...campos.map((c, i) => `${expresionCampo(c)} AS c${i}`),
    "t.tranid AS k_tranid",
    "t.id AS k_tid",
    "tl.id AS k_tlid",
    "a.id AS k_aid",
  ].join(", ");
  return `SELECT ${select}
${fromBancos(fecha)}
ORDER BY t.id, tl.id, a.id`;
}

type Fila = Record<string, unknown>;

function compararNum(a: unknown, b: unknown): number {
  return Number(a) - Number(b);
}

/** Orden final del día: tranid, id, línea, cuenta. */
function ordenarDia(filas: Fila[]): Fila[] {
  return filas.sort((x, y) => {
    const ta = String(x.k_tranid ?? "");
    const tb = String(y.k_tranid ?? "");
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (
      compararNum(x.k_tid, y.k_tid) ||
      compararNum(x.k_tlid, y.k_tlid) ||
      compararNum(x.k_aid, y.k_aid)
    );
  });
}

const NUM_FMT: Record<TipoCampo, string | undefined> = {
  text: undefined,
  boolean: undefined,
  number: "#,##0.00",
  date: "yyyy-mm-dd",
  datetime: "yyyy-mm-dd hh:mm:ss",
};

function anchoColumna(c: CampoCatalogo): number {
  if (c.tipo === "number") return 16;
  if (c.tipo === "date") return 12;
  if (c.tipo === "datetime") return 20;
  return Math.min(40, Math.max(10, c.etiqueta.length + 4));
}

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/**
 * Fecha como `Date` en UTC con la hora "de pared" de NetSuite: exceljs
 * convierte a número de serie desde UTC, así que no hay corrimiento por la
 * zona horaria del servidor.
 */
function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const m = DATETIME_RE.exec(value);
  if (!m) return null;
  return new Date(
    Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] ?? 0),
      Number(m[5] ?? 0),
      Number(m[6] ?? 0),
    ),
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCell(tipo: TipoCampo, value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return null;
  switch (tipo) {
    case "number":
      return toNumber(value) ?? String(value);
    case "date":
    case "datetime":
      return toDate(value) ?? String(value);
    case "boolean":
      return value === "T" || value === true ? "Sí" : value === "F" || value === false ? "No" : String(value);
    default:
      return typeof value === "number" ? value : String(value);
  }
}

export async function exportarBancos(params: {
  fechaInicio: string;
  fechaFin: string;
  campos: CampoCatalogo[];
  userId: string;
  signal?: AbortSignal;
}): Promise<ExportBancosResult> {
  const startedAt = Date.now();
  const { fechaInicio, fechaFin, campos, userId } = params;
  if (campos.length === 0) throw new Error("No hay campos para exportar.");
  const dias = diasDelRango(fechaInicio, fechaFin);
  const fileName = `bancos_${fechaInicio}_${fechaFin}.xlsx`;
  const tmpPath = join(tmpdir(), `${randomUUID()}_${fileName}`);
  const columnas = [...campos.map((_, i) => `c${i}`), ...ORDEN_KEYS];

  const config = netsuiteConfig();
  const env = serverEnv();

  // Se aborta por tiempo, si el cliente se desconecta o si falla otro día.
  const failCtrl = new AbortController();
  const signal = AbortSignal.any(
    [AbortSignal.timeout(NETSUITE_DEADLINE_MS), failCtrl.signal, params.signal].filter(
      (s): s is AbortSignal => s !== undefined,
    ),
  );

  try {
    const token = await getAccessToken(config, signal);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: tmpPath,
      useStyles: true,
      useSharedStrings: false,
    });
    const sheet = workbook.addWorksheet("Bancos", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    sheet.columns = campos.map((c, i) => ({
      key: `c${i}`,
      header: c.etiqueta,
      width: anchoColumna(c),
      style: NUM_FMT[c.tipo] ? { numFmt: NUM_FMT[c.tipo] } : {},
    }));
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    const filaACeldas = (fila: Fila): ExcelJS.CellValue[] =>
      campos.map((c, i) => toCell(c.tipo, fila[`c${i}`]));

    // Los días se consultan en paralelo pero se escriben en orden: cada día
    // queda en buffer hasta que todos los anteriores estén escritos.
    const listos = new Map<number, Fila[]>();
    let siguienteAEscribir = 0;
    let siguienteAConsultar = 0;
    let filas = 0;
    let primerError: unknown = null;

    const escribirListos = () => {
      while (listos.has(siguienteAEscribir)) {
        const delDia = listos.get(siguienteAEscribir)!;
        listos.delete(siguienteAEscribir);
        for (const fila of delDia) {
          sheet.addRow(filaACeldas(fila)).commit();
        }
        filas += delDia.length;
        siguienteAEscribir++;
      }
    };

    const worker = async () => {
      while (primerError === null && siguienteAConsultar < dias.length) {
        const i = siguienteAConsultar++;
        try {
          const delDia = await runSuiteQL(
            config,
            token,
            queryDelDia(dias[i]!, campos),
            columnas,
            signal,
          );
          listos.set(i, ordenarDia(delDia));
          escribirListos();
        } catch (err) {
          if (primerError === null) {
            primerError =
              err instanceof NetSuiteError && err.code !== "timeout"
                ? new NetSuiteError(`${dias[i]}: ${err.message}`, err.code)
                : err;
          }
          failCtrl.abort();
          return;
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCIA, dias.length) }, worker),
    );
    if (primerError !== null) throw primerError;
    if (siguienteAEscribir !== dias.length) {
      throw new Error("No se escribieron todos los días del rango.");
    }

    sheet.commit();
    await workbook.commit();

    const storagePath = `bancos/${userId}/${randomUUID()}/${fileName}`;
    const admin = createAdminClient();
    const buffer = await readFile(tmpPath);
    const bucket = admin.storage.from(env.EXPORTS_BUCKET);

    const upload = await bucket.upload(storagePath, buffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    });
    if (upload.error) {
      throw new ExportStorageError(
        `No se pudo subir el Excel a Storage (bucket "${env.EXPORTS_BUCKET}"): ${upload.error.message}`,
      );
    }

    const signed = await bucket.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, {
      download: fileName,
    });
    if (signed.error || !signed.data) {
      throw new ExportStorageError(
        `No se pudo generar el enlace de descarga: ${signed.error?.message ?? "sin datos"}`,
      );
    }

    return {
      url: signed.data.signedUrl,
      fileName,
      filas,
      duracionMs: Date.now() - startedAt,
    };
  } finally {
    await rm(tmpPath, { force: true }).catch(() => {});
  }
}
