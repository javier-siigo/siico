export type EstadoCalculo =
  | "correcto"
  | "revision"
  | "procesando"
  | "error";

export type EstadoProceso =
  | "pendiente"
  | "procesando"
  | "completado"
  | "revision"
  | "error";

export type EstadoControl = "success" | "warning" | "error" | "info";

export type StepNuevoCalculo =
  | "informacion"
  | "archivo"
  | "procesamiento"
  | "resultado";

export interface Periodo {
  id: string;
  year: number;
  month: number;
  label: string;
}

export interface ConceptoComision {
  id: string;
  label: string;
  valor: number;
}

export interface TipoFacturacion {
  codigo: string;
  label: string;
  facturacion: number;
  reconocido: number;
}

export interface ControlResultado {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoControl;
}

export interface ResumenPeriodo {
  periodoId: string;
  facturacionNeta: number;
  ingresoReconocido: number;
  ingresoReconocidoPorcentaje: number;
  comisionReconocida: number;
  comisionReconocidaPorcentaje: number;
  estado: EstadoCalculo;
  ingresoAcumulado: number;
  ingresoAcumuladoPorcentaje: number;
  totalComisiones: number;
  comisionPeriodo: number;
  comisionAcumulada: number;
  comisionAcumuladaPorcentaje: number;
  saldoPendiente: number;
  diferenciaPp: number;
  tiposFacturacion: TipoFacturacion[];
  controles: ControlResultado[];
}

export interface EjecucionHistorico {
  id: string;
  periodoId: string;
  periodoLabel: string;
  fechaProcesamiento: string;
  usuario: string;
  ingresoReconocido: number;
  ingresoPorcentaje: number;
  comisionReconocida: number;
  comisionPorcentaje: number;
  diferenciaPp: number;
  estado: EstadoCalculo;
  archivoNombre: string;
  archivoTamano: number;
  archivoFechaCarga: string;
  conceptos: ConceptoComision[];
  resultados: {
    facturacionNeta: number;
    ingresoReconocido: number;
    ingresoPorcentaje: number;
    totalComisiones: number;
    comisionReconocida: number;
    comisionPorcentaje: number;
    saldoPendiente: number;
    diferenciaPp: number;
  };
  avanceIngresoPorcentaje: number;
  avanceComisionPorcentaje: number;
  tiposFacturacion: TipoFacturacion[];
  controles: ControlResultado[];
}

export interface EtapaProcesamiento {
  id: string;
  label: string;
  estado: EstadoProceso;
  detalle?: string;
}

export interface ResumenEjecucionActual {
  facturacionNeta: number;
  ingresoReconocido: number;
  ingresoReconocidoPorcentaje: number;
  comisionPeriodo: number;
  saldoPendiente: number;
  diferenciaPp: number;
  avanceIngresoPorcentaje: number;
  avanceComisionPorcentaje: number;
  tiposFacturacion: TipoFacturacion[];
  controles: ControlResultado[];
  estado: EstadoCalculo;
}