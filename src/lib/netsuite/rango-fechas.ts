/** Rango de fechas `YYYY-MM-DD` compartido entre la vista y la API. */

export const MAX_DIAS_EXPORT = 31;

const FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** Fecha `YYYY-MM-DD` a milisegundos UTC, o `null` si no es una fecha real. */
export function parseFecha(value: string): number | null {
  const m = FECHA_RE.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return ms;
}

function formatFecha(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Días del rango, ambos extremos incluidos. */
export function diasDelRango(inicio: string, fin: string): string[] {
  const a = parseFecha(inicio);
  const b = parseFecha(fin);
  if (a === null || b === null || b < a) return [];
  const dias: string[] = [];
  for (let t = a; t <= b; t += DAY_MS) dias.push(formatFecha(t));
  return dias;
}

/** Mensaje de error del rango, o `null` si es válido. */
export function validarRango(inicio: string, fin: string): string | null {
  const a = parseFecha(inicio);
  const b = parseFecha(fin);
  if (a === null) return "La fecha de inicio no es válida (YYYY-MM-DD).";
  if (b === null) return "La fecha de fin no es válida (YYYY-MM-DD).";
  if (b < a) return "La fecha de fin debe ser igual o posterior a la de inicio.";
  const dias = (b - a) / DAY_MS + 1;
  if (dias > MAX_DIAS_EXPORT) {
    return `El rango no puede superar ${MAX_DIAS_EXPORT} días (seleccionaste ${dias}).`;
  }
  return null;
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export interface MesRango {
  /** `YYYY-MM`, estable como key. */
  clave: string;
  /** p. ej. `sep 2026`. */
  etiqueta: string;
  inicio: string;
  fin: string;
  /** Mes de `hoy`: el rango termina hoy. */
  enCurso: boolean;
}

/** El mes en curso (hasta `hoy`) y los `n - 1` meses completos anteriores, del más reciente al más antiguo. */
export function mesesRecientes(hoy: string, n = 6): MesRango[] {
  const ms = parseFecha(hoy);
  if (ms === null) return [];
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return Array.from({ length: n }, (_, i) => {
    const inicio = Date.UTC(y, m - i, 1);
    const ini = new Date(inicio);
    return {
      clave: formatFecha(inicio).slice(0, 7),
      etiqueta: `${MESES_CORTOS[ini.getUTCMonth()]} ${ini.getUTCFullYear()}`,
      inicio: formatFecha(inicio),
      fin: i === 0 ? hoy : formatFecha(Date.UTC(y, m - i + 1, 0)),
      enCurso: i === 0,
    };
  });
}

/** `2026-09-01`–`2026-09-30` → `1 sep – 30 sep 2026` (año solo al final si coincide). */
export function etiquetaRango(inicio: string, fin: string): string {
  const a = parseFecha(inicio);
  const b = parseFecha(fin);
  if (a === null || b === null) return "";
  const da = new Date(a);
  const db = new Date(b);
  const dia = (d: Date) => `${d.getUTCDate()} ${MESES_CORTOS[d.getUTCMonth()]}`;
  const mismoAnio = da.getUTCFullYear() === db.getUTCFullYear();
  return `${dia(da)}${mismoAnio ? "" : ` ${da.getUTCFullYear()}`} – ${dia(db)} ${db.getUTCFullYear()}`;
}

/** Fecha de hoy `YYYY-MM-DD` (hora local). */
export function hoyIso(hoy: Date = new Date()): string {
  return formatFecha(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
}

/** Primer y último día del mes anterior a `hoy` (hora local). */
export function mesAnterior(hoy: Date = new Date()): { inicio: string; fin: string } {
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  return {
    inicio: formatFecha(Date.UTC(y, m - 1, 1)),
    fin: formatFecha(Date.UTC(y, m, 0)),
  };
}
