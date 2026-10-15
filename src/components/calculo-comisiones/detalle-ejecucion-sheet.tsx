"use client";

import { Download, FileSpreadsheet, FolderArchive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/uploads";

import { AddRowButton } from "./editable/add-row-button";
import { EditableNumber } from "./editable/editable-number";
import { EditableSelect } from "./editable/editable-select";
import { EditableText } from "./editable/editable-text";
import { RowActions } from "./editable/row-actions";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateTime,
  formatPercent,
  formatPp,
  formatShortDateTime,
} from "./format";
import { ProgressBar } from "./progress-bar";
import {
  ratioTipo,
  sumConceptos,
  sumFacturacion,
  sumReconocido,
} from "./recompute";
import { StatusBadge } from "./status-badge";
import type {
  ConceptoComision,
  ControlResultado,
  EjecucionHistorico,
  EstadoCalculo,
  EstadoControl,
  TipoFacturacion,
} from "./types";

const ESTADO_LABELS: Record<EstadoCalculo, string> = {
  correcto: "Correcto",
  revision: "Requiere revisión",
  procesando: "Procesando",
  error: "Error",
};

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

interface DetalleEjecucionSheetProps {
  ejecucion: EjecucionHistorico | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateEjecucion: (id: string, patch: Partial<EjecucionHistorico>) => void;
  onUpdateConcepto: (id: string, patch: Partial<ConceptoComision>) => void;
  onAddConcepto: () => void;
  onRemoveConcepto: (id: string) => void;
  onUpdateTipo: (codigo: string, patch: Partial<TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
  onUpdateControl: (id: string, patch: Partial<ControlResultado>) => void;
  onAddControl: () => void;
  onRemoveControl: (id: string) => void;
}

export function DetalleEjecucionSheet({
  ejecucion,
  open,
  onOpenChange,
  onUpdateEjecucion,
  onUpdateConcepto,
  onAddConcepto,
  onRemoveConcepto,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
  onUpdateControl,
  onAddControl,
  onRemoveControl,
}: DetalleEjecucionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        {ejecucion ? (
          <DetalleContent
            ejecucion={ejecucion}
            onUpdateEjecucion={onUpdateEjecucion}
            onUpdateConcepto={onUpdateConcepto}
            onAddConcepto={onAddConcepto}
            onRemoveConcepto={onRemoveConcepto}
            onUpdateTipo={onUpdateTipo}
            onAddTipo={onAddTipo}
            onRemoveTipo={onRemoveTipo}
            onUpdateControl={onUpdateControl}
            onAddControl={onAddControl}
            onRemoveControl={onRemoveControl}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin datos para mostrar.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type DetalleContentProps = {
  ejecucion: EjecucionHistorico;
  onUpdateEjecucion: (id: string, patch: Partial<EjecucionHistorico>) => void;
  onUpdateConcepto: (id: string, patch: Partial<ConceptoComision>) => void;
  onAddConcepto: () => void;
  onRemoveConcepto: (id: string) => void;
  onUpdateTipo: (codigo: string, patch: Partial<TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
  onUpdateControl: (id: string, patch: Partial<ControlResultado>) => void;
  onAddControl: () => void;
  onRemoveControl: (id: string) => void;
};

function DetalleContent({
  ejecucion,
  onUpdateEjecucion,
  onUpdateConcepto,
  onAddConcepto,
  onRemoveConcepto,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
  onUpdateControl,
  onAddControl,
  onRemoveControl,
}: DetalleContentProps) {
  return (
    <>
      <SheetHeader className="border-b border-border p-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico
          </span>
          <SheetTitle>{ejecucion.periodoLabel}</SheetTitle>
          <SheetDescription>
            Detalle completo de la ejecución registrada el{" "}
            <span className="font-mono tabular-nums">
              {formatShortDateTime(ejecucion.fechaProcesamiento)}
            </span>
            .
          </SheetDescription>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 p-5">
        <EjecucionInfo
          ejecucion={ejecucion}
          onUpdateEjecucion={onUpdateEjecucion}
        />

        <ConceptosCard
          conceptos={ejecucion.conceptos}
          onUpdate={onUpdateConcepto}
          onAdd={onAddConcepto}
          onRemove={onRemoveConcepto}
        />

        <ResultadosCard
          ejecucion={ejecucion}
          onUpdateEjecucion={onUpdateEjecucion}
        />

        <AvanceCard
          ingreso={ejecucion.avanceIngresoPorcentaje}
          comision={ejecucion.avanceComisionPorcentaje}
        />

        <DetalleFacturacionCard
          tipos={ejecucion.tiposFacturacion}
          onUpdateTipo={onUpdateTipo}
          onAddTipo={onAddTipo}
          onRemoveTipo={onRemoveTipo}
        />

        <ControlesCard
          controles={ejecucion.controles}
          onUpdate={onUpdateControl}
          onAdd={onAddControl}
          onRemove={onRemoveControl}
        />

        <ArchivoCard ejecucion={ejecucion} />
      </div>
    </>
  );
}

function EjecucionInfo({
  ejecucion,
  onUpdateEjecucion,
}: {
  ejecucion: EjecucionHistorico;
  onUpdateEjecucion: (id: string, patch: Partial<EjecucionHistorico>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de ejecución</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem label="Periodo">
            <span className="font-mono tabular-nums">
              {ejecucion.periodoLabel}
            </span>
          </InfoItem>
          <InfoItem label="Fecha y hora">
            <span className="font-mono tabular-nums">
              {formatDateTime(ejecucion.fechaProcesamiento)}
            </span>
          </InfoItem>
          <InfoItem label="Usuario">
            <EditableText
              value={ejecucion.usuario}
              onCommit={(usuario) =>
                onUpdateEjecucion(ejecucion.id, { usuario })
              }
              inputClassName="text-sm"
              placeholder="Nombre del usuario"
            />
          </InfoItem>
          <InfoItem label="Archivo utilizado">
            <EditableText
              value={ejecucion.archivoNombre}
              onCommit={(archivoNombre) =>
                onUpdateEjecucion(ejecucion.id, { archivoNombre })
              }
              inputClassName="text-xs font-mono"
              placeholder="nombre_archivo.xlsx"
            />
          </InfoItem>
          <InfoItem label="Estado">
            <div className="flex flex-col gap-1">
              <EditableSelect
                value={ejecucion.estado}
                onCommit={(estado) =>
                  onUpdateEjecucion(ejecucion.id, { estado })
                }
                options={ESTADO_OPTIONS}
                ariaLabel="Cambiar estado de la ejecución"
              />
              <StatusBadge
                variant={ejecucion.estado}
                label={ESTADO_LABELS[ejecucion.estado]}
              />
            </div>
          </InfoItem>
        </dl>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function ConceptosCard({
  conceptos,
  onUpdate,
  onAdd,
  onRemove,
}: {
  conceptos: ConceptoComision[];
  onUpdate: (id: string, patch: Partial<ConceptoComision>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const total = sumConceptos(conceptos);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores introducidos</CardTitle>
        <CardDescription>
          Conceptos registrados al inicio del cálculo. Edita la etiqueta o el
          valor, o agrega nuevos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {conceptos.length === 0 && (
            <div className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
              No hay conceptos. Agrega uno.
            </div>
          )}
          {conceptos.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2"
            >
              <EditableText
                value={c.label}
                onCommit={(label) => onUpdate(c.id, { label })}
                inputClassName="text-sm"
                placeholder="Concepto"
              />
              <EditableNumber
                value={c.valor}
                onCommit={(valor) => onUpdate(c.id, { valor })}
                format="currency"
                min={0}
                className="w-40 text-right"
              />
              <RowActions
                onDelete={() => onRemove(c.id)}
                confirmTitle="Eliminar concepto"
                confirmDescription={`Se eliminará "${c.label}".`}
              />
            </div>
          ))}
        </div>
        <AddRowButton
          label="Agregar concepto"
          onClick={onAdd}
          className="mt-3"
        />
        <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultadosCard({
  ejecucion,
  onUpdateEjecucion,
}: {
  ejecucion: EjecucionHistorico;
  onUpdateEjecucion: (id: string, patch: Partial<EjecucionHistorico>) => void;
}) {
  const r = ejecucion.resultados;
  const updateResultado = (patch: Partial<typeof r>) =>
    onUpdateEjecucion(ejecucion.id, {
      resultados: { ...r, ...patch },
    });
  const updateTop = (patch: Partial<EjecucionHistorico>) =>
    onUpdateEjecucion(ejecucion.id, patch);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados</CardTitle>
        <CardDescription>
          Cifras obtenidas tras el procesamiento. Los valores derivados
          (porcentajes, totales) se recalculan al editar los tipos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EditableInfoItem
            label="Facturación neta"
            value={r.facturacionNeta}
            format="currency"
            readOnly
            hint={formatCurrencyCompact(r.facturacionNeta)}
          />
          <EditableInfoItem
            label="Ingreso reconocido"
            value={r.ingresoReconocido}
            format="currency"
            readOnly
            hint={formatPercent(r.ingresoPorcentaje)}
          />
          <EditableInfoItem
            label="% ingreso reconocido"
            value={r.ingresoPorcentaje}
            format="integer"
            readOnly
          />
          <EditableInfoItem
            label="Total comisiones"
            value={r.totalComisiones}
            format="currency"
            onCommit={(next) => updateResultado({ totalComisiones: next })}
            hint={formatCurrencyCompact(r.totalComisiones)}
          />
          <EditableInfoItem
            label="Comisión reconocida"
            value={r.comisionReconocida}
            format="currency"
            onCommit={(next) => {
              updateResultado({ comisionReconocida: next });
              updateTop({ comisionReconocida: next });
            }}
            hint={formatCurrencyCompact(r.comisionReconocida)}
          />
          <EditableInfoItem
            label="% comisión reconocida"
            value={r.comisionPorcentaje}
            format="integer"
            readOnly
          />
          <EditableInfoItem
            label="Saldo pendiente"
            value={r.saldoPendiente}
            format="currency"
            onCommit={(next) => updateResultado({ saldoPendiente: next })}
            hint={formatCurrencyCompact(r.saldoPendiente)}
          />
          <EditableInfoItem
            label="Diferencia"
            value={r.diferenciaPp}
            format="integer"
            readOnly
            hint={formatPp(r.diferenciaPp)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function EditableInfoItem({
  label,
  value,
  format,
  onCommit,
  readOnly,
  hint,
}: {
  label: string;
  value: number;
  format: "currency" | "integer";
  onCommit?: (next: number) => void;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-foreground">
        {readOnly || !onCommit ? (
          <span className="font-mono text-sm font-semibold tabular-nums">
            {format === "currency" ? formatCurrency(value) : value}
          </span>
        ) : (
          <EditableNumber
            value={value}
            onCommit={onCommit}
            format={format}
            min={0}
          />
        )}
      </dd>
      {hint && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

function AvanceCard({
  ingreso,
  comision,
}: {
  ingreso: number;
  comision: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avance</CardTitle>
        <CardDescription>
          Reconocimiento comparado entre ingreso y comisiones.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ProgressBar label="Ingreso" value={ingreso} />
        <ProgressBar label="Comisiones" value={comision} />
      </CardContent>
    </Card>
  );
}

function DetalleFacturacionCard({
  tipos,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
}: {
  tipos: TipoFacturacion[];
  onUpdateTipo: (codigo: string, patch: Partial<TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
}) {
  const totalFacturacion = sumFacturacion(tipos);
  const totalReconocido = sumReconocido(tipos);
  const totalPorcentaje =
    totalFacturacion > 0
      ? Math.round((totalReconocido / totalFacturacion) * 100)
      : 0;

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle>Detalle por tipo</CardTitle>
        <CardDescription>
          Distribución del reconocimiento por tipo de facturación. Edita cada
          fila o agrega un nuevo tipo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9">Tipo</TableHead>
              <TableHead className="h-9">Etiqueta</TableHead>
              <TableHead className="h-9 text-right">Facturación</TableHead>
              <TableHead className="h-9 text-right">Reconocido</TableHead>
              <TableHead className="h-9 text-right">%</TableHead>
              <TableHead className="h-9 w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                  No hay tipos registrados.
                </TableCell>
              </TableRow>
            )}
            {tipos.map((tipo) => {
              const pct = ratioTipo(tipo);
              return (
                <TableRow key={tipo.codigo}>
                  <TableCell className="w-20">
                    <EditableText
                      value={tipo.codigo}
                      onCommit={(next) =>
                        onUpdateTipo(tipo.codigo, {
                          codigo: next || tipo.codigo,
                        })
                      }
                      inputClassName="font-mono text-xs font-semibold"
                      maxLength={8}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableText
                      value={tipo.label}
                      onCommit={(next) =>
                        onUpdateTipo(tipo.codigo, { label: next })
                      }
                      inputClassName="text-sm"
                      placeholder="Etiqueta"
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
                      className="text-right"
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
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {formatPercent(pct)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onDelete={() => onRemoveTipo(tipo.codigo)}
                      confirmTitle={`Eliminar tipo ${tipo.codigo}`}
                      confirmDescription={`Se eliminará "${tipo.label}" del detalle de esta ejecución.`}
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
          <AddRowButton label="Agregar tipo" onClick={onAddTipo} />
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
          Alertas generadas durante esta ejecución. Editables.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {controles.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
            No hay controles. Agrega uno.
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
                    placeholder="Título"
                  />
                  <EditableText
                    value={control.descripcion}
                    onCommit={(descripcion) =>
                      onUpdate(control.id, { descripcion })
                    }
                    inputClassName="text-xs"
                    placeholder="Descripción"
                  />
                </div>
                <RowActions
                  onDelete={() => onRemove(control.id)}
                  confirmTitle="Eliminar control"
                  confirmDescription={`Se eliminará "${control.titulo}" de los controles de esta ejecución.`}
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

function ArchivoCard({
  ejecucion,
}: {
  ejecucion: EjecucionHistorico;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivo</CardTitle>
        <CardDescription>Archivo cargado para esta ejecución.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
              <FileSpreadsheet className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-mono text-xs text-foreground">
                {ejecucion.archivoNombre}
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  {formatDateTime(ejecucion.archivoFechaCarga)}
                </span>
                {" · "}
                <span className="font-mono tabular-nums">
                  {formatBytes(ejecucion.archivoTamano)}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
              <FolderArchive className="mr-1.5 size-3" />
              Disponible
            </Badge>
            <Button size="sm" variant="outline" onClick={() => undefined}>
              <Download className="size-4" />
              Descargar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
