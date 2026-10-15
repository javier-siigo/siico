import type {
  ConceptoComision,
  ControlResultado,
  EjecucionHistorico,
  ResumenPeriodo,
  TipoFacturacion,
} from "./types";

export function sumFacturacion(tipos: TipoFacturacion[]): number {
  return tipos.reduce((acc, t) => acc + (t.facturacion || 0), 0);
}

export function sumReconocido(tipos: TipoFacturacion[]): number {
  return tipos.reduce((acc, t) => acc + (t.reconocido || 0), 0);
}

export function percentFromFacturacion(
  tipos: TipoFacturacion[],
): number {
  const total = sumFacturacion(tipos);
  if (total <= 0) return 0;
  return Math.round((sumReconocido(tipos) / total) * 100);
}

export function ratioTipo(tipo: TipoFacturacion): number {
  if (tipo.facturacion <= 0) return 0;
  return Math.round((tipo.reconocido / tipo.facturacion) * 100);
}

export function deriveControlDiferencia(
  diferenciaPp: number,
  base: Omit<ControlResultado, "estado">,
): ControlResultado {
  return {
    ...base,
    estado: diferenciaPp > 1 ? "warning" : "success",
  };
}

export function recomputeControles(
  controles: ControlResultado[],
  diferenciaPp: number,
): ControlResultado[] {
  return controles.map((c) =>
    c.id === "diferencia-encontrada"
      ? deriveControlDiferencia(diferenciaPp, {
          id: c.id,
          titulo: c.titulo,
          descripcion: c.descripcion,
        })
      : c,
  );
}

export function recomputeResumen(
  resumen: ResumenPeriodo,
  opts: { recomputeControles?: boolean } = {},
): ResumenPeriodo {
  const tipos = resumen.tiposFacturacion;
  const facturacionNeta = sumFacturacion(tipos);
  const ingresoReconocido = sumReconocido(tipos);
  const ingresoPorcentaje = percentFromFacturacion(tipos);

  const comisionReconocida = resumen.comisionReconocida;
  const comisionPorcentaje = facturacionNeta > 0
    ? Math.round((comisionReconocida / facturacionNeta) * 100)
    : 0;

  const ingresoAcumulado = resumen.ingresoAcumulado;
  const ingresoAcumuladoPorcentaje = facturacionNeta > 0
    ? Math.round((ingresoAcumulado / facturacionNeta) * 100)
    : 0;

  const comisionAcumulada = resumen.comisionAcumulada;
  const comisionAcumuladaPorcentaje =
    resumen.totalComisiones > 0
      ? Math.round((comisionAcumulada / resumen.totalComisiones) * 100)
      : 0;

  const diferenciaPp = comisionPorcentaje - ingresoPorcentaje;

  const next: ResumenPeriodo = {
    ...resumen,
    facturacionNeta,
    ingresoReconocido,
    ingresoReconocidoPorcentaje: ingresoPorcentaje,
    comisionReconocida,
    comisionReconocidaPorcentaje: comisionPorcentaje,
    ingresoAcumulado,
    ingresoAcumuladoPorcentaje,
    comisionAcumulada,
    comisionAcumuladaPorcentaje,
    diferenciaPp,
  };

  if (opts.recomputeControles ?? true) {
    next.controles = recomputeControles(next.controles, diferenciaPp);
  }

  return next;
}

export function recomputeEjecucion(
  ejecucion: EjecucionHistorico,
  opts: { recomputeControles?: boolean } = {},
): EjecucionHistorico {
  const tipos = ejecucion.tiposFacturacion;
  const facturacionNeta = sumFacturacion(tipos);
  const ingresoReconocido = sumReconocido(tipos);
  const ingresoPorcentaje = percentFromFacturacion(tipos);

  const r = ejecucion.resultados;
  const comisionReconocida = r.comisionReconocida;
  const comisionPorcentaje = facturacionNeta > 0
    ? Math.round((comisionReconocida / facturacionNeta) * 100)
    : 0;
  const saldoPendiente = r.saldoPendiente;
  const diferenciaPp = comisionPorcentaje - ingresoPorcentaje;

  const next: EjecucionHistorico = {
    ...ejecucion,
    ingresoReconocido,
    ingresoPorcentaje,
    comisionReconocida,
    comisionPorcentaje,
    diferenciaPp,
    resultados: {
      ...r,
      facturacionNeta,
      ingresoReconocido,
      ingresoPorcentaje,
      comisionReconocida,
      comisionPorcentaje,
      saldoPendiente,
      diferenciaPp,
    },
    tiposFacturacion: tipos,
    avanceIngresoPorcentaje: ingresoPorcentaje,
    avanceComisionPorcentaje: comisionPorcentaje,
  };

  if (opts.recomputeControles ?? true) {
    next.controles = recomputeControles(next.controles, diferenciaPp);
  }

  return next;
}

export function sumConceptos(conceptos: ConceptoComision[]): number {
  return conceptos.reduce((acc, c) => acc + (c.valor || 0), 0);
}

export function nextTipoCodigo(existing: TipoFacturacion[]): string {
  const used = new Set(existing.map((t) => t.codigo));
  for (let n = 93; n < 200; n += 1) {
    const code = `F${n}`;
    if (!used.has(code)) return code;
  }
  const fallback = existing.length + 100;
  return `F${fallback}`;
}

export function nextConceptoId(existing: ConceptoComision[]): string {
  const used = new Set(existing.map((c) => c.id));
  for (let n = existing.length + 1; n < existing.length + 1000; n += 1) {
    if (!used.has(`concepto-${n}`)) return `concepto-${n}`;
  }
  return `concepto-${Date.now()}`;
}

export function nextControlId(existing: ControlResultado[]): string {
  const used = new Set(existing.map((c) => c.id));
  for (let n = existing.length + 1; n < existing.length + 1000; n += 1) {
    if (!used.has(`control-${n}`)) return `control-${n}`;
  }
  return `control-${Date.now()}`;
}

export function nextEjecId(): string {
  return `ejec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
