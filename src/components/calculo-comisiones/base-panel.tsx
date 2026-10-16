"use client";

import { PREFIJOS_COMISION, type PrefijoComision } from "@/lib/comisiones/types";

import { EditableNumber } from "./editable/editable-number";
import { formatPesos } from "./format";

export type BaseMes = Record<PrefijoComision, { facturas: number; notasCredito: number }>;

interface BaseCardProps {
  base: BaseMes;
  onChange: (prefijo: PrefijoComision, campo: "facturas" | "notasCredito", valor: number) => void;
}

export function BasePanel({ base, onChange }: BaseCardProps) {
  const neto = (p: PrefijoComision) => base[p].facturas - base[p].notasCredito;
  const total = PREFIJOS_COMISION.reduce(
    (acc, p) => ({
      facturas: acc.facturas + base[p].facturas,
      notasCredito: acc.notasCredito + base[p].notasCredito,
    }),
    { facturas: 0, notasCredito: 0 },
  );
  const netoTotal = total.facturas - total.notasCredito;

  return (
    <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th className="px-3 py-2 text-right font-semibold">Facturas</th>
                <th className="px-3 py-2 text-right font-semibold">Notas crédito</th>
                <th className="px-3 py-2 text-right font-semibold">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PREFIJOS_COMISION.map((p) => (
                <tr key={p}>
                  <td className="px-3 py-1 font-mono font-medium">{p}</td>
                  <td className="px-1 py-1">
                    <EditableNumber
                      value={base[p].facturas}
                      min={0}
                      ariaLabel={`Facturas ${p} emitidas`}
                      onCommit={(v) => onChange(p, "facturas", v)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <EditableNumber
                      value={base[p].notasCredito}
                      min={0}
                      ariaLabel={`Notas crédito ${p} emitidas`}
                      onCommit={(v) => onChange(p, "notasCredito", v)}
                    />
                  </td>
                  <td className="px-3 py-1 text-right font-mono tabular-nums">
                    {formatPesos(neto(p))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/30">
              <tr>
                <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPesos(total.facturas)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPesos(total.notasCredito)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                  {formatPesos(netoTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {netoTotal < 0 && (
          <p role="alert" className="text-xs text-destructive">
            Las notas crédito superan las facturas: revisa los valores.
          </p>
        )}
      </div>
  );
}
