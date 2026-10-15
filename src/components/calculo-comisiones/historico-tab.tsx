"use client";

import { useMemo, useState } from "react";
import { Eye, Inbox, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { DetalleEjecucionSheet } from "./detalle-ejecucion-sheet";
import { EditableNumber } from "./editable/editable-number";
import { EditableSelect } from "./editable/editable-select";
import { RowActions } from "./editable/row-actions";
import {
  formatPercent,
  formatPp,
  formatShortDateTime,
} from "./format";
import { StatusBadge } from "./status-badge";
import type {
  EjecucionHistorico,
  EstadoCalculo,
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

const ESTADO_FILTER_OPTIONS: { value: EstadoCalculo | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "correcto", label: "Correcto" },
  { value: "revision", label: "Requiere revisión" },
  { value: "procesando", label: "Procesando" },
  { value: "error", label: "Error" },
];

const DATE_RANGE_OPTIONS: { value: DateRange | "todos"; label: string }[] = [
  { value: "todos", label: "Todas las fechas" },
  { value: "ultimo_mes", label: "Último mes" },
  { value: "ultimos_3", label: "Últimos 3 meses" },
  { value: "ultimos_6", label: "Últimos 6 meses" },
  { value: "ultimo_anio", label: "Último año" },
];

type DateRange = "ultimo_mes" | "ultimos_3" | "ultimos_6" | "ultimo_anio";

interface HistoricoTabProps {
  ejecuciones: EjecucionHistorico[];
  periodos: { id: string; label: string }[];
  onUpdateEjecucion: (id: string, patch: Partial<EjecucionHistorico>) => void;
  onRemoveEjecucion: (id: string) => void;
  onUpdateConcepto: (id: string, patch: Partial<import("./types").ConceptoComision>) => void;
  onAddConcepto: () => void;
  onRemoveConcepto: (id: string) => void;
  onUpdateTipo: (codigo: string, patch: Partial<import("./types").TipoFacturacion>) => void;
  onAddTipo: () => void;
  onRemoveTipo: (codigo: string) => void;
  onUpdateControl: (id: string, patch: Partial<import("./types").ControlResultado>) => void;
  onAddControl: () => void;
  onRemoveControl: (id: string) => void;
}

export function HistoricoTab({
  ejecuciones,
  periodos,
  onUpdateEjecucion,
  onRemoveEjecucion,
  onUpdateConcepto,
  onAddConcepto,
  onRemoveConcepto,
  onUpdateTipo,
  onAddTipo,
  onRemoveTipo,
  onUpdateControl,
  onAddControl,
  onRemoveControl,
}: HistoricoTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoCalculo | "todos">("todos");
  const [periodoId, setPeriodoId] = useState<string>("todos");
  const [fecha, setFecha] = useState<DateRange | "todos">("todos");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const ejecucionDetalle = useMemo(
    () => ejecuciones.find((e) => e.id === detalleId) ?? null,
    [ejecuciones, detalleId],
  );

  const filtradas = useMemo(() => {
    const now = new Date();
    return ejecuciones.filter((ej) => {
      if (estado !== "todos" && ej.estado !== estado) return false;
      if (periodoId !== "todos" && ej.periodoId !== periodoId) return false;

      if (fecha !== "todos") {
        const ejDate = new Date(ej.fechaProcesamiento);
        if (Number.isNaN(ejDate.getTime())) return false;
        const diffMs = now.getTime() - ejDate.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
        if (fecha === "ultimo_mes" && diffMonths > 1) return false;
        if (fecha === "ultimos_3" && diffMonths > 3) return false;
        if (fecha === "ultimos_6" && diffMonths > 6) return false;
        if (fecha === "ultimo_anio" && diffMonths > 12) return false;
      }

      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const matches =
          ej.periodoLabel.toLowerCase().includes(q) ||
          ej.usuario.toLowerCase().includes(q) ||
          ej.archivoNombre.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [ejecuciones, busqueda, estado, periodoId, fecha]);

  const filtrosActivos =
    busqueda.trim() !== "" ||
    estado !== "todos" ||
    periodoId !== "todos" ||
    fecha !== "todos";

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("todos");
    setPeriodoId("todos");
    setFecha("todos");
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de cálculos</CardTitle>
          <CardDescription>
            Revisa ejecuciones previas, archivos y diferencias detectadas. Click
            en cualquier celda para editarla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5 lg:max-w-xs">
              <Label htmlFor="busqueda">Buscador</Label>
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="busqueda"
                  placeholder="Periodo, usuario o archivo"
                  className="pl-7"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="periodo">Periodo</Label>
              <Select value={periodoId} onValueChange={setPeriodoId}>
                <SelectTrigger id="periodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los periodos</SelectItem>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={estado}
                onValueChange={(v) => setEstado(v as EstadoCalculo | "todos")}
              >
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Select
                value={fecha}
                onValueChange={(v) => setFecha(v as DateRange | "todos")}
              >
                <SelectTrigger id="fecha">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filtrosActivos && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Limpiar filtros
              </Button>
              <span className="text-xs text-muted-foreground">
                {filtradas.length} de {ejecuciones.length} ejecuciones
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-border p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ejecuciones</CardTitle>
              <CardDescription>
                {filtradas.length === 0
                  ? "Sin ejecuciones que coincidan con los filtros."
                  : `${filtradas.length} ejecuciones encontradas.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtradas.length === 0 ? (
            <Empty className="border-0 rounded-none">
              <EmptyHeader>
                <EmptyMedia>
                  <Inbox aria-hidden />
                </EmptyMedia>
                <EmptyTitle>
                  {filtrosActivos
                    ? "No hay ejecuciones con esos filtros"
                    : "Aún no hay ejecuciones registradas"}
                </EmptyTitle>
                <EmptyDescription>
                  {filtrosActivos
                    ? "Prueba ajustando los filtros para encontrar más ejecuciones."
                    : "Cuando ejecutes un nuevo cálculo aparecerá en este listado."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9">Periodo</TableHead>
                  <TableHead className="h-9">Fecha</TableHead>
                  <TableHead className="h-9">Usuario</TableHead>
                  <TableHead className="h-9 text-right">Ingreso reconocido</TableHead>
                  <TableHead className="h-9 text-right">% ingreso</TableHead>
                  <TableHead className="h-9 text-right">Comisión reconocida</TableHead>
                  <TableHead className="h-9 text-right">% comisión</TableHead>
                  <TableHead className="h-9 text-right">Diferencia</TableHead>
                  <TableHead className="h-9">Estado</TableHead>
                  <TableHead className="h-9 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((ej) => (
                  <TableRow key={ej.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {ej.periodoLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatShortDateTime(ej.fechaProcesamiento)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {ej.usuario}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableNumber
                        value={ej.ingresoReconocido}
                        onCommit={(next) =>
                          onUpdateEjecucion(ej.id, {
                            ingresoReconocido: next,
                            resultados: {
                              ...ej.resultados,
                              ingresoReconocido: next,
                            },
                          })
                        }
                        format="currency"
                        min={0}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatPercent(ej.ingresoPorcentaje)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableNumber
                        value={ej.comisionReconocida}
                        onCommit={(next) =>
                          onUpdateEjecucion(ej.id, {
                            comisionReconocida: next,
                            resultados: {
                              ...ej.resultados,
                              comisionReconocida: next,
                            },
                          })
                        }
                        format="currency"
                        min={0}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatPercent(ej.comisionPorcentaje)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DiferenciaCell value={ej.diferenciaPp} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <EditableSelect
                          value={ej.estado}
                          onCommit={(estado) =>
                            onUpdateEjecucion(ej.id, { estado })
                          }
                          options={ESTADO_OPTIONS}
                          ariaLabel="Cambiar estado de la ejecución"
                          className="w-36"
                        />
                        <StatusBadge
                          variant={ej.estado}
                          label={ESTADO_LABELS[ej.estado]}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ver detalle de ${ej.periodoLabel}`}
                              onClick={() => setDetalleId(ej.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Ver detalle
                          </TooltipContent>
                        </Tooltip>
                        <RowActions
                          onDelete={() => onRemoveEjecucion(ej.id)}
                          confirmTitle={`Eliminar ejecución de ${ej.periodoLabel}`}
                          confirmDescription="Se eliminará esta ejecución del histórico. Esta acción no se puede deshacer."
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DetalleEjecucionSheet
        ejecucion={ejecucionDetalle}
        open={detalleId !== null}
        onOpenChange={(open) => {
          if (!open) setDetalleId(null);
        }}
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
    </div>
  );
}

function DiferenciaCell({ value }: { value: number }) {
  const zero = value === 0;
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums",
        zero ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
      )}
    >
      {formatPp(value)}
    </span>
  );
}
