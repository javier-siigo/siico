"use client";

import { useState } from "react";
import { CopyPlus, EyeOff, MoreHorizontal, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { periodoLabel, shiftPeriodo } from "@/lib/comisiones/calculo";
import type { Concepto } from "@/lib/comisiones/types";

import { EditableNumber } from "./editable/editable-number";
import { EditableText } from "./editable/editable-text";
import { formatPesos } from "./format";

interface ConceptosCardProps {
  periodo: string;
  conceptos: Concepto[];
  valores: Map<string, number>;
  valoresAnterior: Map<string, number>;
  pool: number;
  onValor: (conceptoId: string, valor: number) => void;
  onCrear: (nombre: string) => Promise<boolean>;
  onRenombrar: (id: string, nombre: string) => void;
  onCuenta: (id: string, cuenta: string) => void;
  onActivo: (id: string, activo: boolean) => void;
  onCopiarAnterior: () => void;
}

export function ConceptosPanel({
  periodo,
  conceptos,
  valores,
  valoresAnterior,
  pool,
  onValor,
  onCrear,
  onRenombrar,
  onCuenta,
  onActivo,
  onCopiarAnterior,
}: ConceptosCardProps) {
  const [nuevo, setNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [verInactivos, setVerInactivos] = useState(false);

  // Un concepto inactivo con valor en el periodo sigue contando: se muestra.
  const visibles = conceptos.filter((c) => c.activo || (valores.get(c.id) ?? 0) !== 0);
  const inactivos = conceptos.filter((c) => !c.activo && !visibles.includes(c));
  const anterior = shiftPeriodo(periodo, -1);
  const totalAnterior = conceptos.reduce(
    (a, c) => a + (valoresAnterior.get(c.id) ?? 0),
    0,
  );
  const puedeCopiar = pool === 0 && totalAnterior > 0;

  const crear = async () => {
    const nombre = nuevo.trim();
    if (nombre.length < 2) return;
    setCreando(true);
    const ok = await onCrear(nombre);
    setCreando(false);
    if (ok) setNuevo("");
  };

  return (
    <div className="flex flex-col gap-3">
        {puedeCopiar && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Este periodo no tiene valores. {periodoLabel(anterior)} sumó{" "}
              <span className="font-mono tabular-nums text-foreground">
                {formatPesos(totalAnterior)}
              </span>
              .
            </span>
            <Button size="sm" variant="outline" onClick={onCopiarAnterior}>
              <CopyPlus className="size-3.5" />
              Copiar de {periodoLabel(anterior)}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-semibold">Concepto</th>
                <th className="w-28 px-3 py-2 text-left font-semibold">Cuenta</th>
                <th className="hidden px-3 py-2 text-right font-semibold xl:table-cell">
                  Mes anterior
                </th>
                <th className="w-44 px-3 py-2 text-right font-semibold">Valor</th>
                <th className="w-10" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Aún no hay conceptos. Agrega el primero abajo.
                  </td>
                </tr>
              )}
              {visibles.map((c) => (
                <tr key={c.id} className="group/row">
                  <td className="sticky left-0 z-10 max-w-36 bg-card px-2 py-1 sm:max-w-none">
                    <EditableText
                      value={c.nombre}
                      maxLength={80}
                      ariaLabel={`Renombrar ${c.nombre}`}
                      onCommit={(nombre) => onRenombrar(c.id, nombre)}
                    />
                    {!c.activo && (
                      <span className="px-1.5 text-xs text-muted-foreground">Inactivo</span>
                    )}
                  </td>
                  <td className="px-1 py-1">
                    <EditableText
                      value={c.cuenta ?? ""}
                      placeholder="Sin cuenta"
                      mono
                      maxLength={12}
                      ariaLabel={`Cuenta contable de ${c.nombre}`}
                      onCommit={(cuenta) => onCuenta(c.id, cuenta)}
                    />
                  </td>
                  <td className="hidden px-3 py-1 text-right font-mono text-xs tabular-nums text-muted-foreground xl:table-cell">
                    {valoresAnterior.has(c.id)
                      ? formatPesos(valoresAnterior.get(c.id) ?? 0)
                      : "—"}
                  </td>
                  <td className="px-2 py-1">
                    <EditableNumber
                      value={valores.get(c.id) ?? 0}
                      placeholder="0"
                      ariaLabel={`Valor de ${c.nombre}`}
                      onCommit={(v) => onValor(c.id, v)}
                    />
                  </td>
                  <td className="pr-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-60 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                          aria-label={`Acciones de ${c.nombre}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onActivo(c.id, false)}>
                          <EyeOff className="size-4" />
                          Desactivar concepto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
            {visibles.length > 0 && (
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="sticky left-0 z-10 bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </td>
                  <td />
                  <td className="hidden px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground xl:table-cell">
                    {formatPesos(totalAnterior)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                    {formatPesos(pool)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void crear();
          }}
        >
          <Input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Nuevo concepto…"
            maxLength={80}
            aria-label="Nombre del nuevo concepto"
            className="h-8"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={creando || nuevo.trim().length < 2}
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </form>

        {inactivos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setVerInactivos((v) => !v)}
              aria-expanded={verInactivos}
              className="self-start rounded-sm text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              {verInactivos ? "Ocultar" : "Ver"} {inactivos.length} concepto
              {inactivos.length === 1 ? "" : "s"} inactivo
              {inactivos.length === 1 ? "" : "s"}
            </button>
            {verInactivos && (
              <ul className="flex flex-col divide-y divide-border rounded-md border border-dashed border-border">
                {inactivos.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <span className="truncate">{c.nombre}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => onActivo(c.id, true)}
                    >
                      <RotateCcw className="size-3.5" />
                      Reactivar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
  );
}
