const SHORT_DATETIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const CENTAVOS_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Pesos con centavos: "$ 213.580.144,52". */
export function formatPesos(value: number): string {
  return CENTAVOS_FORMATTER.format(value);
}

const IMPORTE_FORMATTER = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Centavos a importe sin símbolo, para tablas densas cuyo encabezado ya dice pesos. */
export function formatImporte(centavos: number): string {
  return IMPORTE_FORMATTER.format(centavos / 100);
}

/** Centavos enteros a pesos con centavos. */
export function formatCentavos(centavos: number): string {
  return CENTAVOS_FORMATTER.format(centavos / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return SHORT_DATETIME_FORMATTER.format(date);
}

/**
 * Lee un valor en pesos escrito a mano o pegado desde Excel/NetSuite, con
 * centavos: "7.331.649,80", "7331649,8", "7,331,649.80", "$ 7.331.649".
 * Devuelve null si no es un número. Redondea al centavo.
 */
export function parseCurrencyInput(raw: string): number | null {
  let s = raw.trim().replace(/[\s$]/g, "").replace(/COP/i, "");
  if (!s) return 0;
  const neg = s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  s = s.replace(/[-()]/g, "");
  if (!/^[\d.,]+$/.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  // Con ambos separadores, el último es el decimal. Con uno solo, es decimal
  // si aparece una vez y no lleva exactamente 3 dígitos detrás ("1.234" y
  // "1,234" son miles: los centavos nunca tienen 3 dígitos).
  const unSeparador = (sep: "," | ".", last: number) =>
    s.split(sep).length === 2 && s.length - last - 1 !== 3 ? sep : null;
  let decimal: "," | "." | null = null;
  if (lastComma >= 0 && lastDot >= 0) decimal = lastComma > lastDot ? "," : ".";
  else if (lastComma >= 0) decimal = unSeparador(",", lastComma);
  else if (lastDot >= 0) decimal = unSeparador(".", lastDot);

  const miles = decimal === "," ? "." : decimal === "." ? "," : null;
  let normal = s;
  if (miles) normal = normal.split(miles).join("");
  if (decimal === null) normal = normal.replace(/[.,]/g, "");
  else normal = normal.replace(decimal, ".");

  const value = Number(normal);
  if (!Number.isFinite(value)) return null;
  return (neg ? -1 : 1) * Math.round(value * 100) / 100;
}

/** Valor para editar: miles con punto y centavos con coma solo si los hay. */
export function formatCurrencyInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const entero = Number.isInteger(Math.round(value * 100) / 100);
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: entero ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const PCT_FORMATTERS = new Map<number, Intl.NumberFormat>();

/** Formatea una fracción (0..1) como porcentaje: 0.0998 → "9,98 %". */
export function formatFraction(value: number, fractionDigits = 2): string {
  let f = PCT_FORMATTERS.get(fractionDigits);
  if (!f) {
    f = new Intl.NumberFormat("es-CO", {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    PCT_FORMATTERS.set(fractionDigits, f);
  }
  return f.format(Number.isFinite(value) ? value : 0);
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Fecha ISO (YYYY-MM-DD) a "25 jun 2025". */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : SHORT_DATE_FORMATTER.format(d);
}
