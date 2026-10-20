"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, ScanSearch, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TABLA_LABEL,
  TIPOS,
  TIPO_LABEL,
  claveCampo,
  type CampoCatalogo,
  type CampoDescubierto,
  type TipoCampo,
} from "@/lib/netsuite/campos";
import {
  actualizarCampo,
  agregarCampos,
  descubrirCamposAction,
  ordenarCampos,
} from "@/lib/netsuite/campos-actions";

interface CatalogoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campos: CampoCatalogo[];
}

function TipoSelect({
  value,
  onChange,
  disabled,
}: {
  value: TipoCampo;
  onChange: (t: TipoCampo) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TipoCampo)} disabled={disabled}>
      <SelectTrigger className="h-8 w-32 text-xs" aria-label="Tipo">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIPOS.map((t) => (
          <SelectItem key={t} value={t}>
            {TIPO_LABEL[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Referencia({ c }: { c: Pick<CampoCatalogo, "tabla" | "campo" | "modo"> }) {
  return (
    <span className="truncate font-mono text-[11px] text-muted-foreground">
      {c.modo === "texto" ? `BUILTIN.DF(${c.tabla}.${c.campo})` : `${c.tabla}.${c.campo}`}
    </span>
  );
}

export function CatalogoSheet({ open, onOpenChange, campos }: CatalogoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Catálogo de campos</SheetTitle>
          <SheetDescription>
            Campos que el equipo puede elegir en la exportación. El orden define el
            orden de las columnas del Excel.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="catalogo" className="min-h-0 flex-1 px-5 py-4">
          <TabsList>
            <TabsTrigger value="catalogo">Catálogo ({campos.length})</TabsTrigger>
            <TabsTrigger value="descubrir">Descubrir en NetSuite</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogo" className="min-h-0 flex-1 overflow-y-auto">
            <CatalogoLista campos={campos} />
          </TabsContent>
          <TabsContent value="descubrir" className="min-h-0 flex-1 overflow-y-auto">
            <Descubrir />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function CatalogoLista({ campos }: { campos: CampoCatalogo[] }) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "No se pudo guardar.");
    });

  const mover = (index: number, delta: -1 | 1) => {
    const ids = campos.map((c) => c.id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j]!, ids[index]!];
    run(() => ordenarCampos(ids));
  };

  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
      {campos.map((c, i) => (
        <li
          key={c.id}
          className={`flex flex-wrap items-center gap-2 px-2.5 py-2 ${c.habilitado ? "" : "bg-muted/40"}`}
        >
          <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {i + 1}
          </span>
          <Checkbox
            checked={c.habilitado}
            disabled={isPending}
            aria-label={c.habilitado ? `Deshabilitar ${c.etiqueta}` : `Habilitar ${c.etiqueta}`}
            onCheckedChange={(v) => run(() => actualizarCampo(c.id, { habilitado: v === true }))}
          />
          <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
            <Input
              key={c.etiqueta}
              defaultValue={c.etiqueta}
              maxLength={80}
              aria-label={`Etiqueta de ${c.tabla}.${c.campo}`}
              className="h-8"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== c.etiqueta) run(() => actualizarCampo(c.id, { etiqueta: v }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <span className="flex items-center gap-2">
              <Referencia c={c} />
              <span className="text-[11px] text-muted-foreground">· {TABLA_LABEL[c.tabla]}</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <TipoSelect
              value={c.tipo}
              disabled={isPending || c.modo === "texto"}
              onChange={(t) => run(() => actualizarCampo(c.id, { tipo: t }))}
            />
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Subir"
                disabled={isPending || i === 0}
                onClick={() => mover(i, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Bajar"
                disabled={isPending || i === campos.length - 1}
                onClick={() => mover(i, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

type Candidato = CampoDescubierto & { elegido: boolean };

function Descubrir() {
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [buscando, startBuscar] = useTransition();
  const [agregando, startAgregar] = useTransition();

  const descubrir = () =>
    startBuscar(async () => {
      const res = await descubrirCamposAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCandidatos(res.data.map((c) => ({ ...c, elegido: false })));
    });

  const q = busqueda.trim().toLowerCase();
  const visibles = useMemo(
    () =>
      (candidatos ?? []).filter(
        (c) => !q || c.campo.includes(q) || c.etiqueta.toLowerCase().includes(q),
      ),
    [candidatos, q],
  );
  const elegidos = (candidatos ?? []).filter((c) => c.elegido);

  const patch = (key: string, p: Partial<Candidato>) =>
    setCandidatos((prev) => prev?.map((c) => (claveCampo(c) === key ? { ...c, ...p } : c)) ?? null);

  const agregar = () =>
    startAgregar(async () => {
      const res = await agregarCampos(
        elegidos.map(({ tabla, campo, modo, etiqueta, tipo }) => ({ tabla, campo, modo, etiqueta, tipo })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const agregados = new Set(res.data.map(claveCampo));
      setCandidatos((prev) => prev?.filter((c) => !agregados.has(claveCampo(c))) ?? null);
      toast.success(`${res.data.length} campos agregados al catálogo`);
    });

  if (candidatos === null) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-5">
        <p className="max-w-xl text-sm text-muted-foreground">
          Toma una muestra de movimientos bancarios de tres días del mes anterior y lista
          los campos de transacción, línea, línea contable y cuenta que aún no están en
          el catálogo. Los campos personalizados traen su nombre y tipo de NetSuite.
          Un campo vacío en toda la muestra no aparece.
        </p>
        <Button onClick={descubrir} disabled={buscando}>
          {buscando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ScanSearch className="size-4" aria-hidden />
          )}
          {buscando ? "Consultando NetSuite… (hasta 1 min)" : "Descubrir campos"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-card pb-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder={`Buscar entre ${candidatos.length}…`}
            aria-label="Buscar campo descubierto"
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={descubrir} disabled={buscando}>
          {buscando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Volver a consultar
        </Button>
        <Button className="ml-auto" onClick={agregar} disabled={agregando || elegidos.length === 0}>
          {agregando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Agregar {elegidos.length > 0 ? elegidos.length : ""} al catálogo
        </Button>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {candidatos.length === 0
            ? "Todos los campos de la muestra ya están en el catálogo."
            : `Ningún campo coincide con “${busqueda}”.`}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {visibles.map((c) => {
            const key = claveCampo(c);
            return (
              <li key={key} className="flex flex-wrap items-center gap-2 px-2.5 py-2">
                <Checkbox
                  checked={c.elegido}
                  aria-label={`Elegir ${c.tabla}.${c.campo}`}
                  onCheckedChange={(v) => patch(key, { elegido: v === true })}
                />
                <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
                  <Input
                    value={c.etiqueta}
                    maxLength={80}
                    aria-label={`Etiqueta de ${c.tabla}.${c.campo}`}
                    className="h-8"
                    onChange={(e) => patch(key, { etiqueta: e.target.value, elegido: true })}
                  />
                  <span className="flex min-w-0 items-center gap-2">
                    <Referencia c={c} />
                    {c.personalizado && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        personalizado
                      </Badge>
                    )}
                    {c.ejemplo && (
                      <span className="truncate text-[11px] text-muted-foreground" title={c.ejemplo}>
                        ej. {c.ejemplo}
                      </span>
                    )}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <TipoSelect
                    value={c.tipo}
                    disabled={c.modo === "texto"}
                    onChange={(t) => patch(key, { tipo: t, elegido: true })}
                  />
                  {!c.personalizado && (
                    <label
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      title="Trae el nombre visible (BUILTIN.DF) en lugar del ID interno"
                    >
                      <Checkbox
                        checked={c.modo === "texto"}
                        onCheckedChange={(v) =>
                          patch(key, {
                            modo: v === true ? "texto" : "valor",
                            tipo: v === true ? "text" : c.tipo,
                            elegido: true,
                          })
                        }
                      />
                      Nombre
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
