"use client";

import { useCallback, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { HistoricoTab } from "./historico-tab";
import { NuevoCalculoTab } from "./nuevo-calculo-tab";
import { ResumenTab } from "./resumen-tab";
import {
  buildResumenFromEjecucion,
  nextEjecId,
  useEditableState,
} from "./use-editable-state";
import type {
  EjecucionHistorico,
  EstadoCalculo,
  ResumenEjecucionActual,
  ResumenPeriodo,
  TipoFacturacion,
} from "./types";

const TABS = [
  { value: "resumen", label: "Resumen" },
  { value: "nuevo", label: "Nuevo cálculo" },
  { value: "historico", label: "Histórico" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

interface CalculoComisionesPageClientProps {
  resumenInicial: ResumenPeriodo;
  ejecucionesIniciales: EjecucionHistorico[];
  periodos: { id: string; label: string; year: number; month: number }[];
  tiposIniciales: TipoFacturacion[];
  conceptosIniciales: import("./types").ConceptoComision[];
  controlesIniciales: import("./types").ControlResultado[];
  ejecucionesInicialesExtra?: EjecucionHistorico[];
}

export function CalculoComisionesPageClient({
  resumenInicial,
  ejecucionesIniciales,
  periodos,
  tiposIniciales,
  conceptosIniciales,
  controlesIniciales,
}: CalculoComisionesPageClientProps) {
  const initialResumenes = useMemo<Record<string, ResumenPeriodo>>(
    () => ({ [resumenInicial.periodoId]: resumenInicial }),
    [resumenInicial],
  );

  const [{ resumenesPorPeriodo, ejecuciones, tiposFacturacion, conceptos, periodos: periodosState }, actions] =
    useEditableState({
      initial: {
        resumenesPorPeriodo: initialResumenes,
        ejecuciones: ejecucionesIniciales,
        tiposFacturacion: tiposIniciales,
        conceptos: conceptosIniciales,
        controles: controlesIniciales,
        periodos,
      },
    });

  const [tab, setTab] = useState<TabValue>("resumen");
  const [periodoId, setPeriodoId] = useState<string>(resumenInicial.periodoId);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [, setNuevoResultado] =
    useState<ResumenEjecucionActual | null>(null);

  const [resetOpen, setResetOpen] = useState(false);

  const periodosParaSelect = useMemo(
    () =>
      [...periodosState].sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month,
      ),
    [periodosState],
  );

  const resumenActual = resumenesPorPeriodo[periodoId] ?? resumenInicial;

  const onPeriodChange = useCallback(
    (id: string) => {
      setLoadingPeriodo(true);
      setPeriodoId(id);
      const t = setTimeout(() => {
        setLoadingPeriodo(false);
      }, 220);
      return () => clearTimeout(t);
    },
    [],
  );

  const handleCompleteNuevo = useCallback(
    (resultado: ResumenEjecucionActual) => {
      setNuevoResultado(resultado);
      const periodoActual = periodosState.find((p) => p.id === periodoId);
      const conceptosActuales = conceptos;
      const newEjec: EjecucionHistorico = {
        id: nextEjecId(),
        periodoId,
        periodoLabel: periodoActual?.label ?? periodoId,
        fechaProcesamiento: new Date().toISOString(),
        usuario: "Tú",
        ingresoReconocido: resultado.ingresoReconocido,
        ingresoPorcentaje: resultado.ingresoReconocidoPorcentaje,
        comisionReconocida: resultado.comisionPeriodo,
        comisionPorcentaje: resultado.ingresoReconocidoPorcentaje,
        diferenciaPp: resultado.diferenciaPp,
        estado: resultado.estado,
        archivoNombre: "archivo_ingresos.xlsx",
        archivoTamano: 2400000,
        archivoFechaCarga: new Date().toISOString(),
        conceptos: conceptosActuales,
        resultados: {
          facturacionNeta: resultado.facturacionNeta,
          ingresoReconocido: resultado.ingresoReconocido,
          ingresoPorcentaje: resultado.ingresoReconocidoPorcentaje,
          totalComisiones: resultado.comisionPeriodo * 2.5,
          comisionReconocida: resultado.comisionPeriodo,
          comisionPorcentaje: resultado.ingresoReconocidoPorcentaje,
          saldoPendiente: resultado.saldoPendiente,
          diferenciaPp: resultado.diferenciaPp,
        },
        avanceIngresoPorcentaje: resultado.avanceIngresoPorcentaje,
        avanceComisionPorcentaje: resultado.avanceComisionPorcentaje,
        tiposFacturacion: resultado.tiposFacturacion,
        controles: resultado.controles,
      };
      actions.addEjecucion(newEjec);
      const nuevoResumen = buildResumenFromEjecucion(
        newEjec,
        periodoId,
      );
      actions.setResumenes((prev) => ({
        ...prev,
        [periodoId]: nuevoResumen,
      }));
    },
    [actions, conceptos, periodoId, periodosState],
  );

  const handleGoToResumen = useCallback(() => {
    setTab("resumen");
  }, []);

  const handleStartNew = useCallback(() => {
    setNuevoResultado(null);
    setTab("nuevo");
  }, []);

  const handleReset = useCallback(() => {
    actions.resetAll();
    setResetOpen(false);
    setPeriodoId(resumenInicial.periodoId);
  }, [actions, resumenInicial.periodoId]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Cálculo de Comisiones
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Procesamiento y control mensual del reconocimiento de comisiones.
          </p>
        </div>
        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="self-start text-muted-foreground sm:self-auto"
            >
              <RotateCcw className="size-4" />
              Restablecer datos demo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restablecer datos demo</AlertDialogTitle>
              <AlertDialogDescription>
                Se revertirán todos los cambios realizados en esta página a los
                datos iniciales de demostración. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Restablecer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="gap-4"
      >
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="flex flex-col gap-5">
          <ResumenTab
            resumen={resumenActual}
            periodos={periodosParaSelect}
            onPeriodChange={onPeriodChange}
            loading={loadingPeriodo}
            onUpdateResumen={(pid, patch) => actions.updateResumen(pid, patch)}
            onUpdateEstadoResumen={(pid, estado: EstadoCalculo) =>
              actions.updateEstadoResumen(pid, estado)
            }
            onUpdateTipo={actions.updateTipo}
            onAddTipo={actions.addTipo}
            onRemoveTipo={actions.removeTipo}
            onUpdateControl={actions.updateControl}
            onAddControl={actions.addControl}
            onRemoveControl={actions.removeControl}
            tiposPlantilla={tiposFacturacion}
          />
        </TabsContent>

        <TabsContent value="nuevo" className="flex flex-col gap-5">
          <NuevoCalculoTab
            onComplete={handleCompleteNuevo}
            onGoToResumen={handleGoToResumen}
            onStartNew={handleStartNew}
            conceptosPlantilla={conceptos}
            onUpdateConcepto={actions.updateConcepto}
            onAddConcepto={actions.addConcepto}
            onRemoveConcepto={actions.removeConcepto}
          />
        </TabsContent>

        <TabsContent value="historico" className="flex flex-col gap-5">
          <HistoricoTab
            ejecuciones={ejecuciones}
            periodos={periodosParaSelect}
            onUpdateEjecucion={actions.updateEjecucion}
            onRemoveEjecucion={actions.removeEjecucion}
            onUpdateConcepto={actions.updateConcepto}
            onAddConcepto={actions.addConcepto}
            onRemoveConcepto={actions.removeConcepto}
            onUpdateTipo={actions.updateTipo}
            onAddTipo={actions.addTipo}
            onRemoveTipo={actions.removeTipo}
            onUpdateControl={actions.updateControl}
            onAddControl={actions.addControl}
            onRemoveControl={actions.removeControl}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
