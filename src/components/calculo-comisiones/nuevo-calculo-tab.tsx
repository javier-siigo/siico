import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSpreadsheet,
  Info,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACCEPTED_EXTENSIONS_WITH_DOTS,
  FileDropZone,
  SelectedFileChip,
  formatBytes,
} from "@/components/common/file-upload";
import { cn } from "@/lib/utils";

import { ControlsList } from "./controls-list";
import { AddRowButton } from "./editable/add-row-button";
import { EditableNumber } from "./editable/editable-number";
import { EditableText } from "./editable/editable-text";
import { RowActions } from "./editable/row-actions";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatPp,
} from "./format";
import { KpiCard } from "./kpi-card";
import {
  ANIOS,
  CONTROLES_DEMO,
  ETAPAS_PROCESAMIENTO_DEMO,
  MESES,
  PERIODOS_SELECCIONABLES,
  TIPOS_FACTURACION_DEMO,
} from "./mock-data";
import { ProgressBar } from "./progress-bar";
import { StatusBadge } from "./status-badge";
import { StepsStepper } from "./steps-stepper";
import type {
  ConceptoComision,
  EstadoProceso,
  EtapaProcesamiento,
  ResumenEjecucionActual,
  StepNuevoCalculo,
} from "./types";

interface NuevoCalculoTabProps {
  onComplete?: (resumen: ResumenEjecucionActual) => void;
  onGoToResumen?: () => void;
  onStartNew?: () => void;
  conceptosPlantilla: ConceptoComision[];
  onUpdateConcepto: (id: string, patch: Partial<ConceptoComision>) => void;
  onAddConcepto: () => void;
  onRemoveConcepto: (id: string) => void;
}

const ETAPAS_DELAY_MS = 900;
const ETAPA_ERROR_PROCESANDO = 3;

export function NuevoCalculoTab({
  onComplete,
  onGoToResumen,
  onStartNew,
  conceptosPlantilla,
  onUpdateConcepto,
  onAddConcepto,
  onRemoveConcepto,
}: NuevoCalculoTabProps) {
  const [step, setStep] = useState<StepNuevoCalculo>("informacion");
  const [periodoId, setPeriodoId] = useState<string>(
    PERIODOS_SELECCIONABLES[0]?.id ?? "2026-10",
  );
  const [file, setFile] = useState<File | null>(null);
  const [etapas, setEtapas] = useState<EtapaProcesamiento[]>(
    ETAPAS_PROCESAMIENTO_DEMO,
  );
  const [error, setError] = useState<string | null>(null);
  const [detalleError, setDetalleError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResumenEjecucionActual | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const totalConceptos = useMemo(
    () => conceptosPlantilla.reduce((acc, c) => acc + (c.valor || 0), 0),
    [conceptosPlantilla],
  );

  const canContinueInfo =
    conceptosPlantilla.some((c) => c.valor > 0) && totalConceptos > 0;
  const canContinueArchivo = file !== null;

  const handleContinue = useCallback(() => {
    if (step === "informacion" && canContinueInfo) {
      setStep("archivo");
    } else if (step === "archivo" && canContinueArchivo) {
      setStep("procesamiento");
      runProcessing();
    }
  }, [step, canContinueInfo, canContinueArchivo]);

  const handleBack = useCallback(() => {
    if (step === "archivo") setStep("informacion");
  }, [step]);

  const runProcessing = useCallback(() => {
    setError(null);
    setDetalleError(null);
    setEtapas(ETAPAS_PROCESAMIENTO_DEMO.map((e) => ({ ...e, estado: "pendiente" })));

    const ordered = ETAPAS_PROCESAMIENTO_DEMO.map((e) => e.id);
    const desired: Record<string, EstadoProceso> = {
      recibido: "completado",
      validado: "completado",
      informacion: "completado",
      procesando: "procesando",
      calculo: "pendiente",
      controles: "pendiente",
    };
    setEtapas(
      ETAPAS_PROCESAMIENTO_DEMO.map((e) => ({
        ...e,
        estado: desired[e.id] ?? "pendiente",
      })),
    );

    const shouldFail = Math.random() < 0.18;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    ordered.forEach((id, idx) => {
      const t = setTimeout(() => {
        if (!mountedRef.current) return;
        setEtapas((prev) =>
          prev.map((e) => {
            if (e.id !== id) return e;
            if (shouldFail && idx === ETAPA_ERROR_PROCESANDO) {
              return {
                ...e,
                estado: "error",
                detalle:
                  "No se encontró la columna requerida: COMISION_BASE.",
              };
            }
            return { ...e, estado: "completado" };
          }),
        );

        if (!shouldFail && idx === ordered.length - 1) {
          setResultado(buildResumenActual());
          setStep("resultado");
          onComplete?.(buildResumenActual());
        } else if (shouldFail && idx === ETAPA_ERROR_PROCESANDO) {
          setError("No fue posible procesar el archivo.");
          setDetalleError(
            "No se encontró la columna requerida: COMISION_BASE. Verifica el archivo y vuelve a intentarlo.",
          );
          setEtapas((prev) =>
            prev.map((e) => (e.estado === "procesando" ? { ...e, estado: "error" } : e)),
          );
        }
      }, ETAPAS_DELAY_MS * (idx + 1));
      timeouts.push(t);
    });
  }, [onComplete]);

  const handleRetry = useCallback(() => {
    runProcessing();
  }, [runProcessing]);

  const handleChangeFile = useCallback(() => {
    setFile(null);
    setStep("archivo");
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
  }, []);

  const reachable: StepNuevoCalculo[] = useMemo(() => {
    const base: StepNuevoCalculo[] = ["informacion", "archivo"];
    if (resultado) base.push("procesamiento", "resultado");
    return base;
  }, [resultado]);

  return (
    <div className="flex flex-col gap-5">
      <StepsStepper current={step} reachable={reachable} />

      {step === "informacion" && (
        <InformacionStep
          periodoId={periodoId}
          onPeriodChange={setPeriodoId}
          conceptos={conceptosPlantilla}
          totalConceptos={totalConceptos}
          onUpdateConcepto={onUpdateConcepto}
          onAddConcepto={onAddConcepto}
          onRemoveConcepto={onRemoveConcepto}
        />
      )}

      {step === "archivo" && (
        <ArchivoStep
          file={file}
          onSelect={setFile}
          onChange={handleChangeFile}
          onRemove={handleRemoveFile}
        />
      )}

      {step === "procesamiento" && (
        <ProcesamientoStep
          periodoLabel={periodoLabel(periodoId)}
          fileName={file?.name ?? null}
          fileSize={file?.size ?? 0}
          etapas={etapas}
          error={error}
          detalleError={detalleError}
          onRetry={handleRetry}
          onChangeFile={handleChangeFile}
        />
      )}

      {step === "resultado" && resultado && (
        <ResultadoStep
          resumen={resultado}
          onGoToResumen={onGoToResumen}
          onStartNew={onStartNew}
        />
      )}

      {step !== "resultado" && step !== "procesamiento" && (
        <div className="flex items-center justify-end gap-2">
          {step === "archivo" && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="size-4" />
              Volver
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={
              (step === "informacion" && !canContinueInfo) ||
              (step === "archivo" && !canContinueArchivo)
            }
          >
            {step === "informacion" ? "Continuar" : "Procesar"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {step === "procesamiento" && error && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleChangeFile}>
            Cambiar archivo
          </Button>
          <Button onClick={handleRetry}>
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}

function periodoLabel(periodoId: string): string {
  return (
    PERIODOS_SELECCIONABLES.find((p) => p.id === periodoId)?.label ?? periodoId
  );
}

function InformacionStep({
  periodoId,
  onPeriodChange,
  conceptos,
  totalConceptos,
  onUpdateConcepto,
  onAddConcepto,
  onRemoveConcepto,
}: {
  periodoId: string;
  onPeriodChange: (id: string) => void;
  conceptos: ConceptoComision[];
  totalConceptos: number;
  onUpdateConcepto: (
    id: string,
    patch: Partial<ConceptoComision>,
  ) => void;
  onAddConcepto: () => void;
  onRemoveConcepto: (id: string) => void;
}) {
  const [yearValue, mesValue] = periodoId.split("-");
  const year = Number(yearValue);
  const mes = Number(mesValue);

  const handleMesChange = (newMes: string) => {
    onPeriodChange(`${year}-${newMes.padStart(2, "0")}`);
  };
  const handleYearChange = (newYear: string) => {
    onPeriodChange(`${newYear}-${String(mes).padStart(2, "0")}`);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Periodo a procesar</CardTitle>
          <CardDescription>
            Mes y año del reconocimiento que se va a calcular.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mes">Mes</Label>
            <Select value={String(mes)} onValueChange={handleMesChange}>
              <SelectTrigger id="mes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="anio">Año</Label>
            <Select value={String(year)} onValueChange={handleYearChange}>
              <SelectTrigger id="anio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIOS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mb-1 size-3.5" />
            <span>
              El periodo define el mes contable al que se asocia el reconocimiento.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Valores de comisiones</CardTitle>
          <CardDescription>
            Ingresa el valor de cada concepto. El total se calcula automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {conceptos.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No hay conceptos. Agrega uno para registrar valores.
              </div>
            )}
            {conceptos.map((concepto) => (
              <div
                key={concepto.id}
                className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto] sm:gap-4"
              >
                <EditableText
                  value={concepto.label}
                  onCommit={(label) => onUpdateConcepto(concepto.id, { label })}
                  inputClassName="text-sm font-medium"
                  placeholder="Nombre del concepto"
                />
                <div className="flex items-center gap-2 sm:w-56">
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    $
                  </span>
                  <EditableNumber
                    value={concepto.valor}
                    onCommit={(valor) =>
                      onUpdateConcepto(concepto.id, { valor })
                    }
                    format="currency"
                    min={0}
                    className="text-right"
                  />
                </div>
                <RowActions
                  onDelete={() => onRemoveConcepto(concepto.id)}
                  confirmTitle="Eliminar concepto"
                  confirmDescription={`Se eliminará "${concepto.label}" del listado de conceptos.`}
                />
              </div>
            ))}
          </div>
          <AddRowButton
            label="Agregar concepto"
            onClick={onAddConcepto}
            className="mt-3"
          />
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Total comisiones
            </span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {formatCurrency(totalConceptos)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArchivoStep({
  file,
  onSelect,
  onChange,
  onRemove,
}: {
  file: File | null;
  onSelect: (f: File) => void;
  onChange: () => void;
  onRemove: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onSelect(f);
    },
    [onSelect],
  );

  if (file) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Archivo de reconocimiento de ingresos</CardTitle>
          <CardDescription>
            Confirma el archivo antes de iniciar el procesamiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SelectedFileChip
            file={file}
            state="idle"
            busy={false}
            onRemove={onRemove}
            showSubmit={false}
            showRetry={false}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              Tamaño: {formatBytes(file.size)}
            </span>
            <span aria-hidden>·</span>
            <span>
              Estado:{" "}
              <span className="font-semibold text-foreground">
                Listo para procesar
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onChange}>
              Cambiar archivo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-muted-foreground"
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivo de reconocimiento de ingresos</CardTitle>
        <CardDescription>
          Arrastra el archivo Excel con el reconocimiento de ingresos o
          selecciónalo desde tu equipo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="button"
          tabIndex={0}
          aria-label="Seleccionar archivo de reconocimiento de ingresos"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const input = document.getElementById("hidden-file-input");
              (input as HTMLInputElement | null)?.click();
            }
          }}
        >
          <FileDropZone
            dragOver={dragOver}
            disabled={false}
            accept={ACCEPTED_EXTENSIONS_WITH_DOTS.join(",")}
            ariaLabel="Seleccionar archivo de reconocimiento de ingresos"
            onClick={() => {
              const input = document.getElementById("hidden-file-input");
              (input as HTMLInputElement | null)?.click();
            }}
            onKeyDown={() => undefined}
            onDragOver={() => undefined}
            onDragLeave={() => undefined}
            onDrop={() => undefined}
          />
        </div>
        <input
          id="hidden-file-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS_WITH_DOTS.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}

function ProcesamientoStep({
  periodoLabel,
  fileName,
  fileSize,
  etapas,
  error,
  detalleError,
  onRetry,
  onChangeFile,
}: {
  periodoLabel: string;
  fileName: string | null;
  fileSize: number;
  etapas: EtapaProcesamiento[];
  error: string | null;
  detalleError: string | null;
  onRetry: () => void;
  onChangeFile: () => void;
}) {
  const totalEtapas = etapas.length;
  const completadas = etapas.filter(
    (e) => e.estado === "completado" || e.estado === "revision",
  ).length;
  const ratio = totalEtapas > 0 ? (completadas / totalEtapas) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {error ? (
            <CircleAlert className="size-4 text-destructive" />
          ) : (
            <Loader2 className="size-4 animate-spin text-primary" />
          )}
          {error ? "No fue posible procesar el archivo" : "Procesando cálculo de comisiones"}
        </CardTitle>
        <CardDescription>
          {error
            ? "Revisa el detalle del error y vuelve a intentarlo."
            : "Esto puede tardar unos segundos. No cierres esta ventana."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Periodo
            </span>
            <span className="text-sm font-medium text-foreground">
              {periodoLabel}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Archivo
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span className="truncate">{fileName ?? "—"}</span>
              {fileSize > 0 && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  · {formatBytes(fileSize)}
                </span>
              )}
            </span>
          </div>
        </div>

        <ProgressBar
          label="Avance"
          value={ratio}
          trailingLabel={`${completadas} de ${totalEtapas}`}
        />

        <ol className="flex flex-col gap-2">
          {etapas.map((etapa) => (
            <EtapaRow key={etapa.id} etapa={etapa} />
          ))}
        </ol>

        {error && (
          <div className="rounded-md border border-rose-200/60 bg-rose-50 p-3 text-sm dark:border-rose-900/40 dark:bg-rose-950/40">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  {error}
                </span>
                {detalleError && (
                  <span className="text-xs text-rose-700/80 dark:text-rose-300/80">
                    Detalle: {detalleError}
                  </span>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Button size="sm" onClick={onRetry}>
                    <RefreshCw className="size-4" />
                    Reintentar
                  </Button>
                  <Button size="sm" variant="outline" onClick={onChangeFile}>
                    Cambiar archivo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EtapaRow({ etapa }: { etapa: EtapaProcesamiento }) {
  const Icon =
    etapa.estado === "completado"
      ? Check
      : etapa.estado === "procesando"
        ? Loader2
        : etapa.estado === "error"
          ? X
          : ChevronRight;

  const toneClass = cn(
    "flex size-7 shrink-0 items-center justify-center rounded-full border",
    etapa.estado === "completado" &&
      "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
    etapa.estado === "procesando" &&
      "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300",
    etapa.estado === "error" &&
      "border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300",
    etapa.estado === "pendiente" && "border-border bg-muted text-muted-foreground",
    etapa.estado === "revision" &&
      "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
  );

  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5">
      <span aria-hidden className={toneClass}>
        <Icon
          className={cn(
            "size-3.5",
            etapa.estado === "procesando" && "animate-spin",
          )}
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm font-medium",
            etapa.estado === "pendiente"
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {etapa.label}
        </span>
        {etapa.detalle && (
          <span className="text-xs text-rose-600 dark:text-rose-400">
            {etapa.detalle}
          </span>
        )}
      </div>
      <StatusBadge
        variant={etapa.estado}
        label={etapa.estado.charAt(0).toUpperCase() + etapa.estado.slice(1)}
        withDot={false}
      />
    </li>
  );
}

function ResultadoStep({
  resumen,
  onGoToResumen,
  onStartNew,
}: {
  resumen: ResumenEjecucionActual;
  onGoToResumen?: () => void;
  onStartNew?: () => void;
}) {
  const alineado = resumen.diferenciaPp <= 1;
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="size-4" />
            </span>
            Cálculo completado
          </CardTitle>
          <CardDescription>
            Revisa el resultado del reconocimiento antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Facturación neta"
            value={formatCurrencyCompact(resumen.facturacionNeta)}
            hint={formatCurrency(resumen.facturacionNeta)}
            icon={<Calculator className="size-4" />}
          />
          <KpiCard
            label="Ingreso reconocido"
            value={formatCurrencyCompact(resumen.ingresoReconocido)}
            secondaryValue={formatPercent(resumen.ingresoReconocidoPorcentaje)}
            hint={formatCurrency(resumen.ingresoReconocido)}
            tone="success"
            icon={<CheckCircle2 className="size-4" />}
          />
          <KpiCard
            label="Comisión a reconocer"
            value={formatCurrencyCompact(resumen.comisionPeriodo)}
            hint={formatCurrency(resumen.comisionPeriodo)}
            tone="sky"
          />
          <KpiCard
            label="Saldo pendiente"
            value={formatCurrencyCompact(resumen.saldoPendiente)}
            hint={formatCurrency(resumen.saldoPendiente)}
            tone="warning"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avance del reconocimiento</CardTitle>
          <CardDescription>
            Comparativa entre ingreso y comisiones reconocidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ProgressBar
              label="Ingreso"
              value={resumen.avanceIngresoPorcentaje}
            />
            <ProgressBar
              label="Comisiones"
              value={resumen.avanceComisionPorcentaje}
            />
          </div>
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Diferencia</span>
              <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                {formatPp(resumen.diferenciaPp)}
              </span>
            </div>
            <StatusBadge
              variant={alineado ? "correcto" : "revision"}
              label={alineado ? "Alineado" : "Requiere revisión"}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle>Detalle por tipo de facturación</CardTitle>
          <CardDescription>
            Distribución del reconocimiento por tipo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9">Tipo</TableHead>
                <TableHead className="h-9 text-right">Facturación</TableHead>
                <TableHead className="h-9 text-right">Reconocido</TableHead>
                <TableHead className="h-9 text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumen.tiposFacturacion.map((tipo) => {
                const pct =
                  tipo.facturacion > 0
                    ? Math.round((tipo.reconocido / tipo.facturacion) * 100)
                    : 0;
                return (
                  <TableRow key={tipo.codigo}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {tipo.codigo}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {tipo.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatCurrency(tipo.facturacion)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatCurrency(tipo.reconocido)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatPercent(pct)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controles</CardTitle>
          <CardDescription>
            Validaciones automáticas del procesamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ControlsList controles={resumen.controles} />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onStartNew}>
          Procesar otro periodo
        </Button>
        <Button onClick={onGoToResumen}>
          Ver resumen
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function buildResumenActual(): ResumenEjecucionActual {
  const totalFacturacion = TIPOS_FACTURACION_DEMO.reduce(
    (acc, t) => acc + t.facturacion,
    0,
  );
  const totalReconocido = TIPOS_FACTURACION_DEMO.reduce(
    (acc, t) => acc + t.reconocido,
    0,
  );
  const ingresoPorcentaje =
    totalFacturacion > 0
      ? Math.round((totalReconocido / totalFacturacion) * 100)
      : 0;
  const comisionPorcentaje = ingresoPorcentaje;
  return {
    facturacionNeta: totalFacturacion,
    ingresoReconocido: totalReconocido,
    ingresoReconocidoPorcentaje: ingresoPorcentaje,
    comisionPeriodo: Math.round(totalReconocido * 0.15),
    saldoPendiente: Math.round(totalReconocido * 0.05),
    diferenciaPp: 0,
    avanceIngresoPorcentaje: ingresoPorcentaje,
    avanceComisionPorcentaje: comisionPorcentaje,
    tiposFacturacion: TIPOS_FACTURACION_DEMO,
    controles: CONTROLES_DEMO,
    estado: "correcto",
  };
}