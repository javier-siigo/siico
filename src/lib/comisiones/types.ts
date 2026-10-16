/**
 * Reconocimiento del gasto de comisiones por cohortes.
 *
 * Las comisiones causadas en un mes (la "cohorte") se difieren y se llevan al
 * gasto al mismo ritmo en que se reconoce el ingreso de las facturas F93/F94
 * emitidas ese mes:
 *
 *   % del mes = ingreso F93+F94 de la cohorte reconocido en el mes
 *               ÷ facturación neta F93+F94 de la cohorte (facturas − NC)
 *   gasto     = comisiones de la cohorte × % del mes
 */

/** Prefijos de factura que son base para comisión. */
export const PREFIJOS_COMISION = ["F94", "F93"] as const;
export type PrefijoComision = (typeof PREFIJOS_COMISION)[number];

/** Cuenta del activo diferido (Comisiones de ventas diferidas). */
export const CUENTA_DIFERIDA = "17109501";
export const NOMBRE_CUENTA_DIFERIDA = "Comisiones de ventas diferidas";

export interface Concepto {
  id: string;
  nombre: string;
  /** Cuenta contable del gasto (p. ej. 52051801). */
  cuenta: string | null;
  activo: boolean;
  orden: number;
}

/** Comisiones causadas por concepto en un periodo (YYYY-MM). */
export interface ValorPeriodo {
  periodo: string;
  conceptoId: string;
  valor: number;
}

/** Facturación emitida y notas crédito de un prefijo en un periodo (NetSuite). */
export interface BasePeriodo {
  periodo: string;
  prefijo: PrefijoComision;
  facturas: number;
  notasCredito: number;
}

export type FuenteReconocimiento = "informe" | "excel";

/** Ingreso reconocido en `periodo` de las facturas emitidas en `cohorte`. */
export interface Reconocimiento {
  cohorte: string;
  periodo: string;
  prefijo: PrefijoComision;
  ingreso: number;
  /**
   * PENDIENTE_POR_DIFERIR de las facturas de la cohorte al cierre del mes.
   * Si es ~0 la cohorte terminó de reconocer ingreso. null si se desconoce
   * (histórico del Excel).
   */
  pendienteIngreso: number | null;
  fuente: FuenteReconocimiento;
}

/**
 * Gasto ya contabilizado de un concepto en un mes, cuando difiere de la
 * fórmula (ajustes hechos a mano en el mayor). Manda sobre el cálculo.
 */
export interface GastoRegistrado {
  cohorte: string;
  periodo: string;
  conceptoId: string;
  gasto: number;
  motivo: string;
}

// ---------------------------------------------------------------------------
// Informe diferido

export type TipoDocumento = "factura" | "nota-credito" | "ajuste";

export interface LineaDiferida {
  producto: string;
  cuenta: string;
  cantidad: number;
  total: number;
  cuota: number;
  veces: number;
  reconocido: number;
  pendiente: number;
}

/** Un comprobante del informe (factura, nota crédito o asiento de ajuste). */
export interface DocumentoDiferido {
  /** NO COMPROBANTE. */
  numero: string;
  /** DOC ORIGEN: la factura F93/F94 a la que pertenece. */
  origen: string;
  tipo: TipoDocumento;
  prefijo: PrefijoComision;
  /** Mes de FECHAFACTURA (YYYY-MM): la cohorte a la que suma. */
  cohorte: string;
  nit: string;
  fechaFactura: string | null;
  inicio: string | null;
  fin: string | null;
  veces: number;
  plazoMixto: boolean;
  total: number;
  cuota: number;
  reconocido: number;
  pendiente: number;
  lineas: LineaDiferida[];
}

/** Ingreso del mes agrupado por cohorte y prefijo. */
export interface IngresoCohorte {
  cohorte: string;
  prefijo: PrefijoComision;
  /** Suma de CUOTA, exacta al centavo. */
  ingreso: number;
  /** Suma de PENDIENTE_POR_DIFERIR: lo que falta por reconocer. */
  pendiente: number;
  lineas: number;
  /** Desglose por tipo de comprobante. */
  facturas: number;
  notasCredito: number;
  ajustes: number;
}

export interface LineasExcluidas {
  prefijo: string;
  lineas: number;
  cuota: number;
}

export interface ResultadoArchivo {
  archivoNombre: string;
  archivoTamano: number;
  /** Periodo de FECHA_DIFERIDO (YYYY-MM). */
  periodoDetectado: string | null;
  /** Más de un FECHA_DIFERIDO en el archivo. */
  periodosMezclados: boolean;
  lineasLeidas: number;
  /** El archivo trae DOC ORIGEN (si no, se clasifica por NO COMPROBANTE). */
  usaDocOrigen: boolean;
  ingresos: IngresoCohorte[];
  documentos: DocumentoDiferido[];
  excluidas: LineasExcluidas[];
  /** Líneas F93/F94 sin FECHAFACTURA: no se pueden asignar a una cohorte. */
  sinFecha: { lineas: number; cuota: number };
  /** Líneas donde RECONOCIDO + PENDIENTE ≠ TOTAL (tolerancia $1). */
  descuadresSaldo: number;
  duracionMs: number;
}

// ---------------------------------------------------------------------------
// Controles y cierres

export type EstadoControl = "ok" | "warning" | "error" | "info";

export interface Control {
  id: string;
  titulo: string;
  detalle: string;
  estado: EstadoControl;
}

export interface LineaAsiento {
  cuenta: string;
  nombre: string;
  debito: number;
  credito: number;
}

export interface Asiento {
  id: string;
  tipo: "diferimiento" | "amortizacion" | "ajuste-cierre";
  cohorte: string;
  descripcion: string;
  lineas: LineaAsiento[];
}

/** Cierre guardado de un periodo. */
export interface CierreGuardado {
  id: string;
  periodo: string;
  archivoNombre: string;
  archivoTamano: number;
  gastoMes: number;
  diferidoNuevo: number;
  saldoDiferido: number;
  asientos: Asiento[];
  controles: Control[];
  createdAt: string;
}
