"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  ListChecks,
  Scale,
  Wallet,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { AddRowButton } from "./editable/add-row-button";
import { EditableNumber } from "./editable/editable-number";
import { EditableSelect } from "./editable/editable-select";
import { EditableText } from "./editable/editable-text";
import { RowActions } from "./editable/row-actions";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatPp,
} from "./format";
import { KpiCard } from "./kpi-card";
import { PeriodSelector } from "./period-selector";
import { ProgressBar } from "./progress-bar";
import { StatusBadge } from "./status-badge";
import { ratioTipo, sumFacturacion, sumReconocido } from "./recompute";
import type {
  ControlResultado,
  EstadoCalculo,
  EstadoControl,
  ResumenPeriodo,
  TipoFacturacion,
} from "./types";

const ESTADO_OPTIONS: { value: EstadoCalculo; label: string }[] = [
  { value: "correcto", label: "Correcto" },
  { value: "revision", label: "Requiere revisión" },
  { value: "procesando", label: "Procesando" },
  { value: "error", label: "Error" },
];

const ESTADO_CONTROL_OPTIONS: { value: EstadoControl; label: string }[] = [
  { value: "success", label: "Correcto" },
  { value: "warning", label: "Atención" },
  { value: "error", label: "Error" },
  { value: "info", label: "Información" },
];

const ESTADO_LABELS: Record<EstadoCalculo, string> = {
  correcto: "Correcto",
  revision: "Requiere revisión",
  procesando: "Procesando",
  error: "Error",
};

const ESTADO_TONES: Record<
  EstadoCalculo,
  "success" | "warning" | "info" | "destructive"
> = {
  correcto: "success",
  revision: "warning",
  procesando: "info",
  error: "destructive",
};

interface ResumenTabProps {
  resumen: ResumenPeriodo;
  periodos: { id: string; label: string }[];
  onPeriodChange: (periodoId: string) => void;
  loading?: boolean;
  onUpdateResumen: (
    periodoId: string,
    patch: Partial<ResumenPeriodo>,
  ) => void;
  onUpdateEstadoResumen: (periodoId: string, estado: EstadoCalculo) => void;
  onUpdateTipo: (codigo: string, patch: Partial<TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
  onUpdateControl: (id: string, patch: Partial<ControlResultado>) => void;
  onAddControl: () => void;
  onRemoveControl: (id: string) => void;
  tiposPlantilla: TipoFacturacion[];
}

export function ResumenTab({
  resumen,
  periodos,
  onPeriodChange,
  loading,
  onUpdateResumen,
  onUpdateEstadoResumen,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
  onUpdateControl,
  onAddControl,
  onRemoveControl,
  tiposPlantilla,
}: ResumenTabProps) {
  if (loading) {
    return <ResumenSkeleton />;
  }

  const totalFacturacion = sumFacturacion(resumen.tiposFacturacion);
  const totalReconocido = sumReconocido(resumen.tiposFacturacion);
  const totalPorcentaje =
    totalFacturacion > 0
      ? Math.round((totalReconocido / totalFacturacion) * 100)
      : 0;

  const avanceDiferencia = Math.abs(
    resumen.ingresoReconocidoPorcentaje - resumen.comisionReconocidaPorcentaje,
  );
  const avanceAlineado = resumen.diferenciaPp <= 1;

  return (
    <div className="flex flex-col gap-5">
      <PeriodoCard
        periodos={periodos}
        periodoId={resumen.periodoId}
        onChange={onPeriodChange}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Facturación neta"
          value={formatCurrencyCompact(resumen.facturacionNeta)}
          hint={formatCurrency(resumen.facturacionNeta)}
          icon={<Banknote className="size-4" />}
          tone="default"
        />
        <KpiCard
          label="Ingreso reconocido"
          value={formatCurrencyCompact(resumen.ingresoReconocido)}
          secondaryValue={formatPercent(resumen.ingresoReconocidoPorcentaje)}
          hint={formatCurrency(resumen.ingresoReconocido)}
          icon={<CircleDollarSign className="size-4" />}
          tone="success"
        />
        <KpiCard
          label="Comisión reconocida"
          value={formatCurrencyCompact(resumen.comisionReconocida)}
          secondaryValue={formatPercent(resumen.comisionReconocidaPorcentaje)}
          hint={formatCurrency(resumen.comisionReconocida)}
          icon={<Wallet className="size-4" />}
          tone="sky"
        />
        <EstadoCard
          estado={resumen.estado}
          onChange={(estado) => onUpdateEstadoResumen(resumen.periodoId, estado)}
        />
      </div>

      <AvanceCard
        ingresoPorcentaje={resumen.ingresoReconocidoPorcentaje}
        comisionPorcentaje={resumen.comisionReconocidaPorcentaje}
        diferenciaPp={resumen.diferenciaPp}
        diferenciaReal={avanceDiferencia}
        alineado={avanceAlineado}
      />

      <ResumenPeriodoCard
        resumen={resumen}
        onUpdate={(patch) => onUpdateResumen(resumen.periodoId, patch)}
      />

      <DetalleFacturacionCard
        tipos={resumen.tiposFacturacion}
        tiposPlantilla={tiposPlantilla}
        totalFacturacion={totalFacturacion}
        totalReconocido={totalReconocido}
        totalPorcentaje={totalPorcentaje}
        onUpdateTipo={onUpdateTipo}
        onAddTipo={onAddTipo}
        onRemoveTipo={onRemoveTipo}
      />

      <ControlesCard
        controles={resumen.controles}
        onUpdate={onUpdateControl}
        onAdd={onAddControl}
        onRemove={onRemoveControl}
      />
    </div>
  );
}

function PeriodoCard({
  periodos,
  periodoId,
  onChange,
}: {
  periodos: { id: string; label: string }[];
  periodoId: string;
  onChange: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Periodo</CardTitle>
          <CardDescription>
            Selecciona el periodo para revisar el cálculo de comisiones.
          </CardDescription>
        </div>
        <div className="w-full max-w-[14rem]">
          <PeriodSelector
            value={periodoId}
            onChange={onChange}
            periodos={periodos as never}
          />
        </div>
      </CardHeader>
    </Card>
  );
}

function EstadoCard({
  estado,
  onChange,
}: {
  estado: EstadoCalculo;
  onChange: (estado: EstadoCalculo) => void;
}) {
  const Icon =
    estado === "correcto"
      ? CheckCircle2
      : estado === "revision"
        ? AlertTriangle
        : estado === "procesando"
          ? ListChecks
          : Scale;
  const tone = ESTADO_TONES[estado];
  const toneClass: Record<typeof tone, string> = {
    success:
      "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40",
    warning:
      "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
    info:
      "bg-sky-100 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/40",
    destructive:
      "bg-rose-100 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40",
  };

  return (
    <div
      className={cn(
        "kpi-tile-stagger flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md border",
          toneClass[tone],
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Estado
        </span>
        <EditableSelect
          value={estado}
          onCommit={onChange}
          options={ESTADO_OPTIONS}
          ariaLabel="Cambiar estado del periodo"
        />
        <div className="-mt-0.5">
          <StatusBadge variant={estado} label={ESTADO_LABELS[estado]} />
        </div>
      </div>
    </div>
  );
}

function AvanceCard({
  ingresoPorcentaje,
  comisionPorcentaje,
  diferenciaPp,
  diferenciaReal,
  alineado,
}: {
  ingresoPorcentaje: number;
  comisionPorcentaje: number;
  diferenciaPp: number;
  diferenciaReal: number;
  alineado: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avance del reconocimiento</CardTitle>
        <CardDescription>
          Comparativa entre ingreso y comisión reconocidos en el periodo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ProgressBar
            label="Ingreso reconocido"
            value={ingresoPorcentaje}
          />
          <ProgressBar
            label="Comisión reconocida"
            value={comisionPorcentaje}
          />
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Diferencia</span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {formatPp(diferenciaPp)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({formatPercent(diferenciaReal)} real)
            </span>
          </div>
          <StatusBadge
            variant={alineado ? "correcto" : "revision"}
            label={alineado ? "Alineado" : "Requiere revisión"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ResumenPeriodoCard({
  resumen,
  onUpdate,
}: {
  resumen: ResumenPeriodo;
  onUpdate: (patch: Partial<ResumenPeriodo>) => void;
}) {
  const items: {
    key: keyof ResumenPeriodo;
    label: string;
    value: number;
    tone?: "muted";
    format: "currency" | "percent";
  }[] = [
    {
      key: "facturacionNeta",
      label: "Facturación neta",
      value: resumen.facturacionNeta,
      format: "currency",
    },
    {
      key: "ingresoReconocido",
      label: "Ingreso reconocido del periodo",
      value: resumen.ingresoReconocido,
      format: "currency",
    },
    {
      key: "ingresoAcumulado",
      label: "Ingreso reconocido acumulado",
      value: resumen.ingresoAcumulado,
      format: "currency",
    },
    {
      key: "totalComisiones",
      label: "Total de comisiones",
      value: resumen.totalComisiones,
      format: "currency",
    },
    {
      key: "comisionPeriodo",
      label: "Comisión a reconocer en el periodo",
      value: resumen.comisionPeriodo,
      format: "currency",
    },
    {
      key: "comisionAcumulada",
      label: "Comisión reconocida acumulada",
      value: resumen.comisionAcumulada,
      format: "currency",
    },
    {
      key: "saldoPendiente",
      label: "Saldo pendiente por reconocer",
      value: resumen.saldoPendiente,
      format: "currency",
      tone: "muted",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del periodo</CardTitle>
        <CardDescription>
          Cifras consolidadas para el periodo seleccionado. Click en un valor
          para editarlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex flex-col gap-1 rounded-md border border-border bg-background p-3",
                item.tone === "muted" && "bg-muted/40",
              )}
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-foreground">
                <EditableNumber
                  value={item.value}
                  onCommit={(next) => onUpdate({ [item.key]: next } as Partial<ResumenPeriodo>)}
                  format={item.format}
                  min={0}
                />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function DetalleFacturacionCard({
  tipos,
  tiposPlantilla,
  totalFacturacion,
  totalReconocido,
  totalPorcentaje,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
}: {
  tipos: TipoFacturacion[];
  tiposPlantilla: TipoFacturacion[];
  totalFacturacion: number;
  totalReconocido: number;
  totalPorcentaje: number;
  onUpdateTipo: (codigo: string, patch: Partial<TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle>Detalle por tipo de facturación</CardTitle>
        <CardDescription>
          Edita cada fila para ajustar facturación y reconocimiento. Los
          porcentajes se recalculan automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9">Tipo</TableHead>
              <TableHead className="h-9">Etiqueta</TableHead>
              <TableHead className="h-9 text-right">Facturación</TableHead>
              <TableHead className="h-9 text-right">Ingreso reconocido</TableHead>
              <TableHead className="h-9 text-right">% reconocido</TableHead>
              <TableHead className="h-9 w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No hay tipos de facturación. Agrega uno para comenzar.
                </TableCell>
              </TableRow>
            )}
            {tipos.map((tipo) => {
              const porcentaje = ratioTipo(tipo);
              return (
                <TableRow key={tipo.codigo}>
                  <TableCell className="w-24">
                    <EditableText
                      value={tipo.codigo}
                      onCommit={(next) =>
                        onUpdateTipo(tipo.codigo, { codigo: next || tipo.codigo })
                      }
                      inputClassName="font-mono text-xs font-semibold"
                      align="left"
                      maxLength={8}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableText
                      value={tipo.label}
                      onCommit={(next) => onUpdateTipo(tipo.codigo, { label: next })}
                      placeholder="Etiqueta del tipo"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableNumber
                      value={tipo.facturacion}
                      onCommit={(next) =>
                        onUpdateTipo(tipo.codigo, { facturacion: next })
                      }
                      format="currency"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableNumber
                      value={tipo.reconocido}
                      onCommit={(next) =>
                        onUpdateTipo(tipo.codigo, { reconocido: next })
                      }
                      format="currency"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {formatPercent(porcentaje)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onDelete={() => onRemoveTipo(tipo.codigo)}
                      confirmTitle={`Eliminar tipo ${tipo.codigo}`}
                      confirmDescription={`Se eliminará "${tipo.label}" del detalle de facturación. Esta acción no se puede deshacer.`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 hover:bg-muted/40">
              <TableCell colSpan={2} className="font-semibold text-foreground">
                TOTAL
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(totalFacturacion)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(totalReconocido)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatPercent(totalPorcentaje)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
        <div className="px-5 pb-5">
          <AddRowButton
            label={
              tiposPlantilla.length > tipos.length
                ? "Agregar tipo desde plantilla"
                : "Agregar tipo de facturación"
            }
            onClick={onAddTipo}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ControlesCard({
  controles,
  onUpdate,
  onAdd,
  onRemove,
}: {
  controles: ControlResultado[];
  onUpdate: (id: string, patch: Partial<ControlResultado>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controles</CardTitle>
        <CardDescription>
          Edita el título, descripción y estado de cada control. Los cambios
          se aplican al periodo y a las ejecuciones futuras.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {controles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No hay controles registrados. Agrega uno para validar este
            periodo.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {controles.map((control) => (
              <li
                key={control.id}
                className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
              >
                <EditableSelect
                  value={control.estado}
                  onCommit={(estado) => onUpdate(control.id, { estado })}
                  options={ESTADO_CONTROL_OPTIONS}
                  ariaLabel="Estado del control"
                  className="w-32"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <EditableText
                    value={control.titulo}
                    onCommit={(titulo) => onUpdate(control.id, { titulo })}
                    inputClassName="text-sm font-semibold"
                    placeholder="Título del control"
                  />
                  <EditableText
                    value={control.descripcion}
                    onCommit={(descripcion) =>
                      onUpdate(control.id, { descripcion })
                    }
                    inputClassName="text-xs"
                    placeholder="Descripción del control"
                  />
                </div>
                <RowActions
                  onDelete={() => onRemove(control.id)}
                  confirmTitle={`Eliminar control`}
                  confirmDescription={`Se eliminará "${control.titulo}" del listado de controles.`}
                />
              </li>
            ))}
          </ul>
        )}
        <AddRowButton label="Agregar control" onClick={onAdd} />
      </CardContent>
    </Card>
  );
}

function ResumenSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-[88px] animate-pulse rounded-lg border border-border bg-muted/40" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[88px] animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
      <div className="h-[220px] animate-pulse rounded-lg border border-border bg-muted/40" />
      <div className="h-[160px] animate-pulse rounded-lg border border-border bg-muted/40" />
      <div className="h-[260px] animate-pulse rounded-lg border border-border bg-muted/40" />
      <div className="h-[200px] animate-pulse rounded-lg border border-border bg-muted/40" />
    </div>
  );
}
