"use client";

import { useCallback, useMemo } from "react";

import {
  nextConceptoId,
  nextControlId,
  nextEjecId,
  nextTipoCodigo,
  recomputeEjecucion,
  recomputeResumen,
} from "./recompute";
import {
  CONCEPTOS_DEMO,
  CONTROLES_DEMO,
  EJECUCIONES_HISTORICO,
  PERIODOS,
  RESUMENES_POR_PERIODO,
  TIPOS_FACTURACION_DEMO,
} from "./mock-data";
import { useLocalStorageState } from "./use-local-storage";
import type {
  ConceptoComision,
  ControlResultado,
  EjecucionHistorico,
  EstadoCalculo,
  Periodo,
  ResumenPeriodo,
  TipoFacturacion,
} from "./types";

const STORAGE_KEY = "calculo-comisiones:v1";

export interface EditableStateSnapshot {
  resumenesPorPeriodo: Record<string, ResumenPeriodo>;
  ejecuciones: EjecucionHistorico[];
  tiposFacturacion: TipoFacturacion[];
  conceptos: ConceptoComision[];
  controles: ControlResultado[];
  periodos: Periodo[];
}

export interface EditableStateActions {
  setResumenes: React.Dispatch<
    React.SetStateAction<Record<string, ResumenPeriodo>>
  >;
  setEjecuciones: React.Dispatch<React.SetStateAction<EjecucionHistorico[]>>;
  setTipos: React.Dispatch<React.SetStateAction<TipoFacturacion[]>>;
  setConceptos: React.Dispatch<React.SetStateAction<ConceptoComision[]>>;
  setControles: React.Dispatch<React.SetStateAction<ControlResultado[]>>;
  setPeriodos: React.Dispatch<React.SetStateAction<Periodo[]>>;

  updateResumen: (
    periodoId: string,
    patch: Partial<ResumenPeriodo>,
    opts?: { skipRecompute?: boolean },
  ) => void;
  updateEstadoResumen: (periodoId: string, estado: EstadoCalculo) => void;

  updateTipo: (
    codigo: string,
    patch: Partial<TipoFacturacion>,
  ) => void;
  addTipo: () => void;
  removeTipo: (codigo: string) => void;

  updateControl: (id: string, patch: Partial<ControlResultado>) => void;
  addControl: () => void;
  removeControl: (id: string) => void;

  updateConcepto: (id: string, patch: Partial<ConceptoComision>) => void;
  addConcepto: () => void;
  removeConcepto: (id: string) => void;

  updateEjecucion: (
    id: string,
    patch: Partial<EjecucionHistorico>,
  ) => void;
  removeEjecucion: (id: string) => void;
  addEjecucion: (ejec: EjecucionHistorico) => void;

  resetAll: () => void;
}

export interface UseEditableStateOptions {
  initial: EditableStateSnapshot;
}

export type UseEditableStateReturn = [
  EditableStateSnapshot,
  EditableStateActions,
];

export function useEditableState(
  options: UseEditableStateOptions,
): UseEditableStateReturn {
  const [resumenes, setResumenes, resetResumenes] = useLocalStorageState<
    Record<string, ResumenPeriodo>
  >(`${STORAGE_KEY}:resumenes`, options.initial.resumenesPorPeriodo);

  const [ejecuciones, setEjecuciones, resetEjecuciones] = useLocalStorageState<
    EjecucionHistorico[]
  >(`${STORAGE_KEY}:ejecuciones`, options.initial.ejecuciones);

  const [tipos, setTipos, resetTipos] = useLocalStorageState<TipoFacturacion[]>(
    `${STORAGE_KEY}:tipos`,
    options.initial.tiposFacturacion,
  );

  const [conceptos, setConceptos, resetConceptos] = useLocalStorageState<
    ConceptoComision[]
  >(`${STORAGE_KEY}:conceptos`, options.initial.conceptos);

  const [controles, setControles, resetControles] = useLocalStorageState<
    ControlResultado[]
  >(`${STORAGE_KEY}:controles`, options.initial.controles);

  const [periodos, setPeriodos, resetPeriodos] = useLocalStorageState<Periodo[]>(
    `${STORAGE_KEY}:periodos`, options.initial.periodos);

  const updateResumen = useCallback<EditableStateActions["updateResumen"]>(
    (periodoId, patch, opts) => {
      setResumenes((prev) => {
        const current = prev[periodoId];
        if (!current) return prev;
        const merged: ResumenPeriodo = { ...current, ...patch };
        const next = opts?.skipRecompute
          ? merged
          : recomputeResumen(merged, { recomputeControles: true });
        return { ...prev, [periodoId]: next };
      });
      if (
        patch.tiposFacturacion !== undefined ||
        patch.comisionReconocida !== undefined ||
        patch.ingresoAcumulado !== undefined ||
        patch.comisionAcumulada !== undefined ||
        patch.totalComisiones !== undefined ||
        patch.saldoPendiente !== undefined ||
        patch.controles !== undefined
      ) {
        // Persist the underlying shared lists so future periods and ejecuciones see them.
        if (patch.tiposFacturacion) setTipos(patch.tiposFacturacion);
        if (patch.controles) setControles(patch.controles);
      }
    },
    [setResumenes, setTipos, setControles],
  );

  const updateEstadoResumen = useCallback<
    EditableStateActions["updateEstadoResumen"]
  >((periodoId, estado) => {
    setResumenes((prev) => {
      const current = prev[periodoId];
      if (!current) return prev;
      return { ...prev, [periodoId]: { ...current, estado } };
    });
  }, [setResumenes]);

  const updateTipo = useCallback<EditableStateActions["updateTipo"]>(
    (codigo, patch) => {
      setTipos((prev) =>
        prev.map((t) => (t.codigo === codigo ? { ...t, ...patch } : t)),
      );
      setResumenes((prev) => {
        const next: Record<string, ResumenPeriodo> = {};
        for (const [pid, resumen] of Object.entries(prev)) {
          const updated = resumen.tiposFacturacion.some(
            (t) => t.codigo === codigo,
          )
            ? recomputeResumen(
                {
                  ...resumen,
                  tiposFacturacion: resumen.tiposFacturacion.map((t) =>
                    t.codigo === codigo ? { ...t, ...patch } : t,
                  ),
                },
                { recomputeControles: true },
              )
            : resumen;
          next[pid] = updated;
        }
        return next;
      });
    },
    [setTipos, setResumenes],
  );

  const addTipo = useCallback<EditableStateActions["addTipo"]>(() => {
    setTipos((prev) => {
      const codigo = nextTipoCodigo(prev);
      const nuevo: TipoFacturacion = {
        codigo,
        label: "Nuevo tipo de facturación",
        facturacion: 0,
        reconocido: 0,
      };
      const list = [...prev, nuevo];
      setResumenes((rPrev) => {
        const next: Record<string, ResumenPeriodo> = {};
        for (const [pid, resumen] of Object.entries(rPrev)) {
          next[pid] = recomputeResumen(
            { ...resumen, tiposFacturacion: list },
            { recomputeControles: true },
          );
        }
        return next;
      });
      return list;
    });
  }, [setTipos, setResumenes]);

  const removeTipo = useCallback<EditableStateActions["removeTipo"]>(
    (codigo) => {
      setTipos((prev) => {
        const list = prev.filter((t) => t.codigo !== codigo);
        setResumenes((rPrev) => {
          const next: Record<string, ResumenPeriodo> = {};
          for (const [pid, resumen] of Object.entries(rPrev)) {
            next[pid] = recomputeResumen(
              { ...resumen, tiposFacturacion: list },
              { recomputeControles: true },
            );
          }
          return next;
        });
        setEjecuciones((ePrev) =>
          ePrev.map((e) =>
            recomputeEjecucion({
              ...e,
              tiposFacturacion: e.tiposFacturacion.filter(
                (t) => t.codigo !== codigo,
              ),
            }),
          ),
        );
        return list;
      });
    },
    [setTipos, setResumenes, setEjecuciones],
  );

  const updateControl = useCallback<EditableStateActions["updateControl"]>(
    (id, patch) => {
      setControles((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
      setResumenes((rPrev) => {
        const next: Record<string, ResumenPeriodo> = {};
        for (const [pid, resumen] of Object.entries(rPrev)) {
          const updatedControles = resumen.controles.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          );
          next[pid] = { ...resumen, controles: updatedControles };
        }
        return next;
      });
      setEjecuciones((ePrev) =>
        ePrev.map((e) => ({
          ...e,
          controles: e.controles.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      );
    },
    [setControles, setResumenes, setEjecuciones],
  );

  const addControl = useCallback<EditableStateActions["addControl"]>(() => {
    setControles((prev) => {
      const id = nextControlId(prev);
      const nuevo: ControlResultado = {
        id,
        titulo: "Nuevo control",
        descripcion: "Describe la validación que se ejecuta.",
        estado: "info",
      };
      const list = [...prev, nuevo];
      setResumenes((rPrev) => {
        const next: Record<string, ResumenPeriodo> = {};
        for (const [pid, resumen] of Object.entries(rPrev)) {
          next[pid] = { ...resumen, controles: list };
        }
        return next;
      });
      setEjecuciones((ePrev) =>
        ePrev.map((e) => ({ ...e, controles: list })),
      );
      return list;
    });
  }, [setControles, setResumenes, setEjecuciones]);

  const removeControl = useCallback<EditableStateActions["removeControl"]>(
    (id) => {
      setControles((prev) => {
        const list = prev.filter((c) => c.id !== id);
        setResumenes((rPrev) => {
          const next: Record<string, ResumenPeriodo> = {};
          for (const [pid, resumen] of Object.entries(rPrev)) {
            next[pid] = { ...resumen, controles: list };
          }
          return next;
        });
        setEjecuciones((ePrev) =>
          ePrev.map((e) => ({ ...e, controles: list })),
        );
        return list;
      });
    },
    [setControles, setResumenes, setEjecuciones],
  );

  const updateConcepto = useCallback<EditableStateActions["updateConcepto"]>(
    (id, patch) => {
      setConceptos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [setConceptos],
  );

  const addConcepto = useCallback<EditableStateActions["addConcepto"]>(() => {
    setConceptos((prev) => {
      const id = nextConceptoId(prev);
      const nuevo: ConceptoComision = {
        id,
        label: "Nuevo concepto",
        valor: 0,
      };
      return [...prev, nuevo];
    });
  }, [setConceptos]);

  const removeConcepto = useCallback<EditableStateActions["removeConcepto"]>(
    (id) => {
      setConceptos((prev) => prev.filter((c) => c.id !== id));
    },
    [setConceptos],
  );

  const updateEjecucion = useCallback<EditableStateActions["updateEjecucion"]>(
    (id, patch) => {
      setEjecuciones((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const merged: EjecucionHistorico = { ...e, ...patch };
          const needsRecompute =
            patch.tiposFacturacion !== undefined ||
            patch.resultados !== undefined;
          return needsRecompute
            ? recomputeEjecucion(merged)
            : merged;
        }),
      );
    },
    [setEjecuciones],
  );

  const removeEjecucion = useCallback<EditableStateActions["removeEjecucion"]>(
    (id) => {
      setEjecuciones((prev) => prev.filter((e) => e.id !== id));
    },
    [setEjecuciones],
  );

  const addEjecucion = useCallback<EditableStateActions["addEjecucion"]>(
    (ejec) => {
      setEjecuciones((prev) => [ejec, ...prev]);
    },
    [setEjecuciones],
  );

  const resetAll = useCallback(() => {
    resetResumenes();
    resetEjecuciones();
    resetTipos();
    resetConceptos();
    resetControles();
    resetPeriodos();
  }, [
    resetResumenes,
    resetEjecuciones,
    resetTipos,
    resetConceptos,
    resetControles,
    resetPeriodos,
  ]);

  const snapshot = useMemo<EditableStateSnapshot>(
    () => ({
      resumenesPorPeriodo: resumenes,
      ejecuciones,
      tiposFacturacion: tipos,
      conceptos,
      controles,
      periodos,
    }),
    [resumenes, ejecuciones, tipos, conceptos, controles, periodos],
  );

  const actions: EditableStateActions = {
    setResumenes,
    setEjecuciones,
    setTipos,
    setConceptos,
    setControles,
    setPeriodos,
    updateResumen,
    updateEstadoResumen,
    updateTipo,
    addTipo,
    removeTipo,
    updateControl,
    addControl,
    removeControl,
    updateConcepto,
    addConcepto,
    removeConcepto,
    updateEjecucion,
    removeEjecucion,
    addEjecucion,
    resetAll,
  };

  return [snapshot, actions];
}

export function buildSnapshotFromMock(): EditableStateSnapshot {
  const resumenesPorPeriodo: Record<string, ResumenPeriodo> = {};
  for (const periodo of PERIODOS) {
    const resumen = RESUMENES_POR_PERIODO[periodo.id];
    if (resumen) resumenesPorPeriodo[periodo.id] = resumen;
  }
  return {
    resumenesPorPeriodo,
    ejecuciones: EJECUCIONES_HISTORICO,
    tiposFacturacion: TIPOS_FACTURACION_DEMO,
    conceptos: CONCEPTOS_DEMO,
    controles: CONTROLES_DEMO,
    periodos: PERIODOS,
  };
}

export function buildResumenFromEjecucion(
  ejec: EjecucionHistorico,
  periodoId: string,
): ResumenPeriodo {
  const r = ejec.resultados;
  return {
    periodoId,
    facturacionNeta: r.facturacionNeta,
    ingresoReconocido: r.ingresoReconocido,
    ingresoReconocidoPorcentaje: r.ingresoPorcentaje,
    comisionReconocida: r.comisionReconocida,
    comisionReconocidaPorcentaje: r.comisionPorcentaje,
    estado: ejec.estado,
    ingresoAcumulado: r.ingresoReconocido,
    ingresoAcumuladoPorcentaje: r.ingresoPorcentaje,
    totalComisiones: r.totalComisiones,
    comisionPeriodo: r.comisionReconocida,
    comisionAcumulada: r.comisionReconocida,
    comisionAcumuladaPorcentaje: r.comisionPorcentaje,
    saldoPendiente: r.saldoPendiente,
    diferenciaPp: r.diferenciaPp,
    tiposFacturacion: ejec.tiposFacturacion,
    controles: ejec.controles,
  };
}

export { nextEjecId };
