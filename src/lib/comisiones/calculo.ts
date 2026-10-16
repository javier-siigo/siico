import {
  CUENTA_DIFERIDA,
  NOMBRE_CUENTA_DIFERIDA,
  PREFIJOS_COMISION,
  type Asiento,
  type BasePeriodo,
  type Concepto,
  type FuenteReconocimiento,
  type GastoRegistrado,
  type IngresoCohorte,
  type LineaAsiento,
  type PrefijoComision,
  type Reconocimiento,
  type ValorPeriodo,
} from "./types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function periodoLabel(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  return `${MESES[m - 1]} ${y}`;
}

/** "2026-03" → "Mar 2026". */
export function periodoCorto(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  return `${MESES[m - 1]!.slice(0, 3)} ${y}`;
}

export function shiftPeriodo(periodo: string, delta: number): string {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function periodoActual(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Periodos de `desde` a `hasta`, ambos incluidos. */
export function rangoPeriodos(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let p = desde; p <= hasta; p = shiftPeriodo(p, 1)) out.push(p);
  return out;
}

/**
 * Mes del plazo en el que cae el periodo (1 = primer mes de reconocimiento).
 * Devuelve null si no hay fecha de inicio.
 */
export function mesDelPlazo(inicio: string | null, periodo: string): number | null {
  if (!inicio) return null;
  const [iy, im] = inicio.split("-").map(Number);
  const [py, pm] = periodo.split("-").map(Number);
  if (!iy || !im || !py || !pm) return null;
  return (py - iy) * 12 + (pm - im) + 1;
}

// ---------------------------------------------------------------------------
// Centavos
//
// Todo el cálculo se hace en centavos enteros para que las sumas cuadren
// exacto; solo el % del mes es una fracción. Los asientos salen de sumar
// líneas ya redondeadas, así débitos = créditos siempre.

export const aCentavos = (pesos: number): number => Math.round(pesos * 100);
export const aPesos = (centavos: number): number => centavos / 100;

type PorPrefijo = Record<PrefijoComision, number>;
const ceroPrefijos = (): PorPrefijo => ({ F94: 0, F93: 0 });

// ---------------------------------------------------------------------------
// Índices

export interface DatosComisiones {
  conceptos: Concepto[];
  valores: ValorPeriodo[];
  bases: BasePeriodo[];
  reconocimientos: Reconocimiento[];
  registrados: GastoRegistrado[];
}

interface ConceptoValor {
  conceptoId: string;
  nombre: string;
  cuenta: string | null;
  /** Centavos. */
  valor: number;
}

interface IngresoMes {
  porPrefijo: PorPrefijo;
  /** Centavos; null si no se conoce. */
  pendiente: number | null;
  fuente: FuenteReconocimiento;
}

interface Indice {
  /** cohorte → conceptos con valor ≠ 0 (centavos). */
  comisiones: Map<string, ConceptoValor[]>;
  /** cohorte → base por prefijo (centavos). */
  bases: Map<string, Record<PrefijoComision, { facturas: number; nc: number }>>;
  /** `${cohorte}|${periodo}` → ingreso del mes. */
  ingresos: Map<string, IngresoMes>;
  /** `${cohorte}|${periodo}|${conceptoId}` → gasto contabilizado (centavos). */
  registrados: Map<string, { gasto: number; motivo: string }>;
}

const clave = (cohorte: string, periodo: string) => `${cohorte}|${periodo}`;

/**
 * Ingreso pendiente por diferir que se considera inmaterial (centavos): con
 * $1.000 o menos la cohorte terminó de reconocer ingreso. El informe deja
 * residuos de centavos o pocos pesos en cohortes ya terminadas.
 */
export const UMBRAL_PENDIENTE = 100_000;

function indexar(datos: DatosComisiones): Indice {
  const porId = new Map(datos.conceptos.map((c) => [c.id, c]));
  const comisiones = new Map<string, ConceptoValor[]>();
  for (const v of datos.valores) {
    const cent = aCentavos(v.valor);
    if (cent === 0) continue;
    const c = porId.get(v.conceptoId);
    const lista = comisiones.get(v.periodo) ?? [];
    lista.push({
      conceptoId: v.conceptoId,
      nombre: c?.nombre ?? "Concepto eliminado",
      cuenta: c?.cuenta ?? null,
      valor: cent,
    });
    comisiones.set(v.periodo, lista);
  }
  for (const lista of comisiones.values()) {
    lista.sort(
      (a, b) =>
        (porId.get(a.conceptoId)?.orden ?? 0) - (porId.get(b.conceptoId)?.orden ?? 0),
    );
  }

  const bases: Indice["bases"] = new Map();
  for (const b of datos.bases) {
    const r = bases.get(b.periodo) ?? {
      F94: { facturas: 0, nc: 0 },
      F93: { facturas: 0, nc: 0 },
    };
    r[b.prefijo] = { facturas: aCentavos(b.facturas), nc: aCentavos(b.notasCredito) };
    bases.set(b.periodo, r);
  }

  const ingresos: Indice["ingresos"] = new Map();
  for (const r of datos.reconocimientos) {
    const k = clave(r.cohorte, r.periodo);
    const e = ingresos.get(k) ?? { porPrefijo: ceroPrefijos(), pendiente: 0, fuente: r.fuente };
    e.porPrefijo[r.prefijo] += aCentavos(r.ingreso);
    e.pendiente =
      e.pendiente === null || r.pendienteIngreso === null
        ? null
        : e.pendiente + aCentavos(r.pendienteIngreso);
    ingresos.set(k, e);
  }

  const registrados: Indice["registrados"] = new Map();
  for (const g of datos.registrados) {
    registrados.set(`${g.cohorte}|${g.periodo}|${g.conceptoId}`, {
      gasto: aCentavos(g.gasto),
      motivo: g.motivo,
    });
  }

  return { comisiones, bases, ingresos, registrados };
}

/** Facturación neta F93+F94 de la cohorte (centavos). */
function baseNeta(idx: Indice, cohorte: string): number {
  const b = idx.bases.get(cohorte);
  if (!b) return 0;
  return PREFIJOS_COMISION.reduce((a, p) => a + b[p].facturas - b[p].nc, 0);
}

// ---------------------------------------------------------------------------
// Gasto de una cohorte en un mes
//
// Reglas, en orden:
// 1. Gasto registrado: si el mayor tiene un valor contabilizado para ese
//    concepto y mes, ese es el gasto.
// 2. Fórmula: comisión × (ingreso del mes ÷ facturación neta), igual que el
//    Excel de reconocimiento.
// 3. Tope: nunca se lleva al gasto más de lo causado; el mes que se alcanza,
//    se reconoce solo el saldo (así cerraba contabilidad las cohortes 2025).
// 4. Cierre por ingreso terminado: si el informe muestra que las facturas de
//    la cohorte ya no tienen ingreso por diferir y aún queda comisión
//    diferida, el saldo se amortiza en el mes como ajuste de cierre.

interface GastoConcepto {
  /** Gasto por fórmula o registrado (centavos). */
  gasto: number;
  /** Saldo llevado al gasto por cierre de la cohorte. */
  ajusteCierre: number;
  registrado: string | null;
  topado: boolean;
}

function gastoDelMes(
  idx: Indice,
  cohorte: string,
  periodo: string,
  conceptos: ConceptoValor[],
  previo: Map<string, number>,
  ingreso: IngresoMes | undefined,
): Map<string, GastoConcepto> {
  const base = baseNeta(idx, cohorte);
  const total = ingreso ? ingreso.porPrefijo.F94 + ingreso.porPrefijo.F93 : 0;
  const terminada =
    !!ingreso &&
    ingreso.pendiente !== null &&
    Math.abs(ingreso.pendiente) <= UMBRAL_PENDIENTE &&
    cohorte !== periodo;

  const out = new Map<string, GastoConcepto>();
  for (const c of conceptos) {
    const antes = previo.get(c.conceptoId) ?? 0;
    const reg = idx.registrados.get(`${cohorte}|${periodo}|${c.conceptoId}`);
    let gasto = 0;
    let topado = false;
    if (reg) {
      gasto = reg.gasto;
    } else if (ingreso && base > 0) {
      gasto = Math.round(c.valor * (total / base));
      // Tope en ambos sentidos: un concepto negativo (reversión) tampoco
      // puede reconocer más de su valor.
      const pasa = c.valor > 0 ? antes + gasto > c.valor : antes + gasto < c.valor;
      if (c.valor !== 0 && pasa) {
        gasto = c.valor - antes;
        topado = true;
      }
    }
    const saldo = c.valor - antes - gasto;
    const ajusteCierre = terminada && !reg ? saldo : 0;
    out.set(c.conceptoId, { gasto, ajusteCierre, registrado: reg?.motivo ?? null, topado });
  }
  return out;
}

/** Acumulado por concepto de la cohorte en los meses [cohorte, hasta). */
function acumuladoPrevio(
  idx: Indice,
  cohorte: string,
  hasta: string,
): { previo: Map<string, number>; topado: boolean } {
  const conceptos = idx.comisiones.get(cohorte) ?? [];
  const previo = new Map(conceptos.map((c) => [c.conceptoId, 0]));
  let topado = false;
  for (let p = cohorte; p < hasta; p = shiftPeriodo(p, 1)) {
    const ing = idx.ingresos.get(clave(cohorte, p));
    const hayRegistro = conceptos.some((c) => idx.registrados.has(`${cohorte}|${p}|${c.conceptoId}`));
    if (!ing && !hayRegistro) continue;
    const g = gastoDelMes(idx, cohorte, p, conceptos, previo, ing);
    for (const c of conceptos) {
      const x = g.get(c.conceptoId)!;
      if (x.topado) topado = true;
      previo.set(c.conceptoId, previo.get(c.conceptoId)! + x.gasto + x.ajusteCierre);
    }
  }
  return { previo, topado };
}

// ---------------------------------------------------------------------------
// Cierre de un periodo

export interface ConceptoCohorte {
  conceptoId: string;
  nombre: string;
  cuenta: string | null;
  valor: number;
  previo: number;
  /** Gasto por fórmula (o registrado). */
  gastoMes: number;
  /** Saldo amortizado por cierre de la cohorte. */
  ajusteCierre: number;
  acumulado: number;
  pendiente: number;
  registrado: string | null;
}

export type AlertaCohorte =
  | "sin-base"
  | "sin-comisiones"
  | "sin-ingreso"
  | "tope"
  | "cierre"
  | "registrado"
  | "ingreso-negativo"
  | "difiere-registro";

export interface CohorteCalculo {
  cohorte: string;
  esPropia: boolean;
  /** Centavos. */
  baseNeta: number;
  ingresoMes: number;
  ingresoPorPrefijo: PorPrefijo;
  /** Ingreso F93+F94 de la cohorte que falta por reconocer (null si se desconoce). */
  pendienteIngreso: number | null;
  /** ingresoMes ÷ baseNeta. */
  pctMes: number;
  comisiones: number;
  previo: number;
  /** Gasto por fórmula del mes. */
  gastoMes: number;
  /** Saldo llevado al gasto por cierre de la cohorte. */
  ajusteCierre: number;
  acumulado: number;
  pendiente: number;
  /** acumulado ÷ comisiones. */
  pctAcumulado: number;
  conceptos: ConceptoCohorte[];
  alertas: AlertaCohorte[];
  /** Ingreso registrado antes para este mes, si el informe trae otro valor. */
  ingresoRegistrado: number | null;
}

export interface CierreCalculo {
  periodo: string;
  cohortes: CohorteCalculo[];
  /** Gasto total del mes, incluidos los ajustes de cierre (centavos). */
  gastoMes: number;
  /** Parte del gasto del mes que corresponde a ajustes de cierre. */
  ajustesCierre: number;
  /** Parte de las comisiones del mes que queda diferida. */
  diferidoNuevo: number;
  /** Saldo de la cuenta diferida al cierre del mes. */
  saldoDiferido: number;
  asientos: Asiento[];
  /** Cohortes con ingreso en el informe pero sin comisiones registradas. */
  sinSeguimiento: { cohorte: string; ingreso: number }[];
}

export interface OpcionesCierre {
  periodo: string;
  /**
   * Ingreso del mes por cohorte leído del informe. Si es null se usa lo
   * registrado para el periodo (cierre guardado o histórico del Excel).
   */
  ingresosArchivo: IngresoCohorte[] | null;
}

export function calcularCierre(datos: DatosComisiones, opts: OpcionesCierre): CierreCalculo {
  const idx = indexar(datos);
  const { periodo } = opts;

  // Ingreso del mes por cohorte.
  const ingresoMes = new Map<string, IngresoMes>();
  if (opts.ingresosArchivo) {
    for (const i of opts.ingresosArchivo) {
      const r = ingresoMes.get(i.cohorte) ?? {
        porPrefijo: ceroPrefijos(),
        pendiente: 0,
        fuente: "informe" as const,
      };
      r.porPrefijo[i.prefijo] += aCentavos(i.ingreso);
      r.pendiente = (r.pendiente ?? 0) + aCentavos(i.pendiente);
      ingresoMes.set(i.cohorte, r);
    }
  } else {
    for (const [k, v] of idx.ingresos) {
      const [cohorte, p] = k.split("|");
      if (p === periodo && cohorte) ingresoMes.set(cohorte, { ...v, porPrefijo: { ...v.porPrefijo } });
    }
  }

  // Cohortes en seguimiento: tienen comisiones y no son posteriores al mes.
  const cohortesSet = new Set<string>();
  for (const c of idx.comisiones.keys()) if (c <= periodo) cohortesSet.add(c);
  cohortesSet.add(periodo);
  const cohortes = [...cohortesSet].sort();

  const resultado: CohorteCalculo[] = [];
  for (const cohorte of cohortes) {
    const conceptos = idx.comisiones.get(cohorte) ?? [];
    const base = baseNeta(idx, cohorte);
    const ing = ingresoMes.get(cohorte);
    const porPrefijo = ing?.porPrefijo ?? ceroPrefijos();
    const ingreso = porPrefijo.F94 + porPrefijo.F93;
    const { previo, topado: topadoAntes } = acumuladoPrevio(idx, cohorte, periodo);
    const esPropia = cohorte === periodo;
    const pendienteAntes = conceptos.reduce((a, c) => a + c.valor - (previo.get(c.conceptoId) ?? 0), 0);

    const g = gastoDelMes(idx, cohorte, periodo, conceptos, previo, ing);
    const filas: ConceptoCohorte[] = conceptos.map((c) => {
      const x = g.get(c.conceptoId)!;
      const antes = previo.get(c.conceptoId) ?? 0;
      const acumulado = antes + x.gasto + x.ajusteCierre;
      return {
        conceptoId: c.conceptoId,
        nombre: c.nombre,
        cuenta: c.cuenta,
        valor: c.valor,
        previo: antes,
        gastoMes: x.gasto,
        ajusteCierre: x.ajusteCierre,
        acumulado,
        pendiente: c.valor - acumulado,
        registrado: x.registrado,
      };
    });

    type Campo = "valor" | "previo" | "gastoMes" | "ajusteCierre" | "acumulado" | "pendiente";
    const suma = (k: Campo) => filas.reduce((a, f) => a + f[k], 0);
    const comisiones = suma("valor");

    // Cohorte ya amortizada por completo y sin movimiento en el mes: no aparece.
    if (!esPropia && conceptos.length > 0 && pendienteAntes === 0 && suma("gastoMes") === 0) continue;

    const alertas: AlertaCohorte[] = [];
    if (conceptos.length === 0) alertas.push("sin-comisiones");
    if (base <= 0 && (conceptos.length > 0 || esPropia)) alertas.push("sin-base");
    if (ingreso === 0 && suma("pendiente") !== 0 && !esPropia) alertas.push("sin-ingreso");
    if (ingreso < 0) alertas.push("ingreso-negativo");
    if (topadoAntes || [...g.values()].some((x) => x.topado)) alertas.push("tope");
    if (suma("ajusteCierre") !== 0) alertas.push("cierre");
    if (filas.some((f) => f.registrado)) alertas.push("registrado");

    // Diferencia contra lo registrado antes para este mes.
    let ingresoRegistrado: number | null = null;
    const reg = idx.ingresos.get(clave(cohorte, periodo));
    if (opts.ingresosArchivo && reg) {
      const r = reg.porPrefijo.F94 + reg.porPrefijo.F93;
      if (Math.abs(r - ingreso) >= 1) {
        ingresoRegistrado = r;
        alertas.push("difiere-registro");
      }
    }

    // Una cohorte sin comisiones solo se muestra si es la del mes.
    if (conceptos.length === 0 && !esPropia) continue;

    resultado.push({
      cohorte,
      esPropia,
      baseNeta: base,
      ingresoMes: ingreso,
      ingresoPorPrefijo: porPrefijo,
      pendienteIngreso: ing?.pendiente ?? null,
      pctMes: base > 0 ? ingreso / base : 0,
      comisiones,
      previo: suma("previo"),
      gastoMes: suma("gastoMes"),
      ajusteCierre: suma("ajusteCierre"),
      acumulado: suma("acumulado"),
      pendiente: suma("pendiente"),
      pctAcumulado: comisiones !== 0 ? suma("acumulado") / comisiones : 0,
      conceptos: filas,
      alertas,
      ingresoRegistrado,
    });
  }

  const sinSeguimiento = [...ingresoMes.entries()]
    .filter(([c]) => !idx.comisiones.has(c) && c !== periodo)
    .map(([cohorte, v]) => ({ cohorte, ingreso: v.porPrefijo.F94 + v.porPrefijo.F93 }))
    .sort((a, b) => a.cohorte.localeCompare(b.cohorte));

  const propia = resultado.find((c) => c.esPropia);
  const ajustesCierre = resultado.reduce((a, c) => a + c.ajusteCierre, 0);
  return {
    periodo,
    cohortes: resultado,
    gastoMes: resultado.reduce((a, c) => a + c.gastoMes, 0) + ajustesCierre,
    ajustesCierre,
    diferidoNuevo: propia ? propia.comisiones - propia.gastoMes : 0,
    saldoDiferido: resultado.reduce((a, c) => a + c.pendiente, 0),
    asientos: construirAsientos(periodo, resultado),
    sinSeguimiento,
  };
}

// ---------------------------------------------------------------------------
// Asientos

function linea(cuenta: string | null, nombre: string, monto: number, lado: "debito" | "credito"): LineaAsiento {
  // Un monto negativo pasa al lado contrario.
  const l = monto < 0 ? (lado === "debito" ? "credito" : "debito") : lado;
  const abs = Math.abs(monto);
  return {
    cuenta: cuenta ?? "",
    nombre,
    debito: l === "debito" ? abs : 0,
    credito: l === "credito" ? abs : 0,
  };
}

function asientoGasto(
  id: string,
  tipo: Asiento["tipo"],
  cohorte: string,
  descripcion: string,
  montos: { cuenta: string | null; nombre: string; monto: number }[],
): Asiento | null {
  const lineas = montos
    .filter((m) => m.monto !== 0)
    .map((m) => linea(m.cuenta, m.nombre, m.monto, "debito"));
  const total = montos.reduce((a, m) => a + m.monto, 0);
  if (lineas.length === 0) return null;
  if (total !== 0) lineas.push(linea(CUENTA_DIFERIDA, NOMBRE_CUENTA_DIFERIDA, total, "credito"));
  return { id, tipo, cohorte, descripcion, lineas };
}

/**
 * - Diferimiento (cohorte del mes): crédito a cada cuenta de gasto por la parte
 *   no reconocida, débito a 17109501.
 * - Amortización (cohortes anteriores): débito a cada cuenta de gasto por el
 *   gasto del mes, crédito a 17109501. Un asiento por cohorte, como se
 *   registra hoy.
 * - Ajuste por cierre de cohorte: asiento aparte con el saldo que quedaba
 *   diferido cuando la cohorte terminó de reconocer ingreso.
 */
function construirAsientos(periodo: string, cohortes: CohorteCalculo[]): Asiento[] {
  const asientos: Asiento[] = [];
  for (const c of cohortes) {
    if (c.esPropia) {
      const lineas = c.conceptos
        .map((k) => ({ k, monto: k.valor - k.gastoMes }))
        .filter((x) => x.monto !== 0)
        .map((x) => linea(x.k.cuenta, x.k.nombre, x.monto, "credito"));
      const total = c.conceptos.reduce((a, k) => a + k.valor - k.gastoMes, 0);
      if (total === 0) continue;
      lineas.push(linea(CUENTA_DIFERIDA, NOMBRE_CUENTA_DIFERIDA, total, "debito"));
      asientos.push({
        id: `diferimiento-${c.cohorte}`,
        tipo: "diferimiento",
        cohorte: c.cohorte,
        descripcion: `Diferimiento comisiones ${periodoLabel(c.cohorte)}`,
        lineas,
      });
      continue;
    }
    const amort = asientoGasto(
      `amortizacion-${c.cohorte}`,
      "amortizacion",
      c.cohorte,
      `Amortización comisiones ${periodoLabel(c.cohorte)} · ${periodoLabel(periodo)}`,
      c.conceptos.map((k) => ({ cuenta: k.cuenta, nombre: k.nombre, monto: k.gastoMes })),
    );
    if (amort) asientos.push(amort);
    const ajuste = asientoGasto(
      `ajuste-cierre-${c.cohorte}`,
      "ajuste-cierre",
      c.cohorte,
      `Ajuste por cierre de cohorte ${periodoLabel(c.cohorte)} · ${periodoLabel(periodo)}`,
      c.conceptos.map((k) => ({ cuenta: k.cuenta, nombre: k.nombre, monto: k.ajusteCierre })),
    );
    if (ajuste) asientos.push(ajuste);
  }
  return asientos;
}

export function totalesAsiento(a: Asiento): { debito: number; credito: number } {
  return a.lineas.reduce(
    (acc, l) => ({ debito: acc.debito + l.debito, credito: acc.credito + l.credito }),
    { debito: 0, credito: 0 },
  );
}

// ---------------------------------------------------------------------------
// Seguimiento (matriz cohorte × mes)

export interface CeldaSeguimiento {
  pct: number;
  /** Ingreso F93+F94 de la cohorte reconocido en el mes (centavos). */
  ingreso: number;
  gasto: number;
  /** La cohorte ya estaba amortizada por completo: el ingreso no genera gasto. */
  cerrada: boolean;
  fuente: FuenteReconocimiento;
  /** El mes incluye gasto registrado a mano o un ajuste de cierre. */
  nota: "registrado" | "cierre" | "tope" | null;
}

export interface FilaSeguimiento {
  cohorte: string;
  baseNeta: number;
  comisiones: number;
  porPeriodo: Map<string, CeldaSeguimiento>;
  /** Ingreso reconocido acumulado de la cohorte (centavos). */
  ingresoAcumulado: number;
  acumulado: number;
  pendiente: number;
}

export interface Seguimiento {
  periodos: string[];
  filas: FilaSeguimiento[];
  /** Gasto total por mes. */
  totalPorPeriodo: Map<string, number>;
  /** Ingreso F93+F94 total por mes (de las cohortes en seguimiento). */
  ingresoPorPeriodo: Map<string, number>;
}

/** Gasto reconocido por cohorte y mes a partir de lo registrado. */
export function calcularSeguimiento(datos: DatosComisiones): Seguimiento {
  const idx = indexar(datos);
  const cohortes = [...idx.comisiones.keys()].sort();
  let ultimo = cohortes[cohortes.length - 1] ?? "";
  for (const k of idx.ingresos.keys()) {
    const p = k.split("|")[1]!;
    if (p > ultimo) ultimo = p;
  }
  const periodos = cohortes.length ? rangoPeriodos(cohortes[0]!, ultimo) : [];
  const totalPorPeriodo = new Map<string, number>();
  const ingresoPorPeriodo = new Map<string, number>();

  const filas = cohortes.map((cohorte) => {
    const conceptos = idx.comisiones.get(cohorte)!;
    const base = baseNeta(idx, cohorte);
    const comisiones = conceptos.reduce((a, c) => a + c.valor, 0);
    const acum = new Map(conceptos.map((c) => [c.conceptoId, 0]));
    const porPeriodo = new Map<string, CeldaSeguimiento>();
    let ingresoAcumulado = 0;
    for (const p of periodos) {
      if (p < cohorte) continue;
      const ing = idx.ingresos.get(clave(cohorte, p));
      const hayRegistro = conceptos.some((c) => idx.registrados.has(`${cohorte}|${p}|${c.conceptoId}`));
      if (!ing && !hayRegistro) continue;
      const cerradaAntes = conceptos.every((c) => acum.get(c.conceptoId) === c.valor);
      const g = gastoDelMes(idx, cohorte, p, conceptos, acum, ing);
      let gasto = 0;
      let nota: CeldaSeguimiento["nota"] = null;
      for (const c of conceptos) {
        const x = g.get(c.conceptoId)!;
        acum.set(c.conceptoId, acum.get(c.conceptoId)! + x.gasto + x.ajusteCierre);
        gasto += x.gasto + x.ajusteCierre;
        if (x.registrado) nota = "registrado";
        else if (x.ajusteCierre !== 0 && nota !== "registrado") nota = "cierre";
        else if (x.topado && !nota) nota = "tope";
      }
      const ingreso = ing ? ing.porPrefijo.F94 + ing.porPrefijo.F93 : 0;
      ingresoAcumulado += ingreso;
      porPeriodo.set(p, {
        pct: base > 0 ? ingreso / base : 0,
        ingreso,
        gasto,
        // Cohorte ya cerrada: el ingreso residual no genera gasto.
        cerrada: cerradaAntes && gasto === 0 && !hayRegistro,
        fuente: ing?.fuente ?? "excel",
        nota,
      });
      totalPorPeriodo.set(p, (totalPorPeriodo.get(p) ?? 0) + gasto);
      ingresoPorPeriodo.set(p, (ingresoPorPeriodo.get(p) ?? 0) + ingreso);
    }
    const acumulado = [...acum.values()].reduce((a, v) => a + v, 0);
    return {
      cohorte,
      baseNeta: base,
      comisiones,
      porPeriodo,
      ingresoAcumulado,
      acumulado,
      pendiente: comisiones - acumulado,
    };
  });

  return { periodos, filas, totalPorPeriodo, ingresoPorPeriodo };
}
