"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Filter as FilterIcon, Loader2, Plus, RefreshCw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TABLAS, TABLA_LABEL, claveCampo, type CampoCatalogo } from "@/lib/netsuite/campos";
import {
  MAX_FILTROS,
  OP_TEXTO_LABEL,
  TIPO_FILTRO_LABEL,
  describirFiltro,
  errorRango,
  filtroActivo,
  filtroVacio,
  tiposFiltro,
  type Filtro,
  type TipoFiltro,
  type ValorLista,
  VENTANA_DIAS,
} from "@/lib/netsuite/filtros";
import { cn } from "@/lib/utils";

/** Campos con valores repetidos que más se usan para filtrar (vistos en el Excel real). */
const SUGERIDOS = [
  "a.accttype:valor",
  "tl.subsidiary:texto",
  "t.type:texto",
  "t.currency:valor",
  "a.accountsearchdisplaynamecopy:valor",
  "t.status:valor",
  "tl.location:valor",
  "tal.credit:valor",
];

const NUM = new Intl.NumberFormat("es-CO");

interface Opciones {
  opciones: { v: string | null; l: string; n: number }[];
  distintos: number;
  truncado: boolean;
  diasSinDatos: number;
  desde: string;
  hasta: string;
  actualizadoAt: string;
  /** La caché está vencida y se está refrescando en el servidor. */
  refrescando: boolean;
}

type EstadoOpciones =
  | { status: "loading" }
  | { status: "ok"; data: Opciones }
  | { status: "error"; error: string };

interface FiltrosCardProps {
  /** Campos habilitados del catálogo. */
  campos: CampoCatalogo[];
  filtros: Filtro[];
  onFiltrosChange: (next: Filtro[]) => void;
  disabled: boolean;
}

export function FiltrosCard({
  campos,
  filtros,
  onFiltrosChange,
  disabled,
}: FiltrosCardProps) {
  const porId = useMemo(() => new Map(campos.map((c) => [c.id, c])), [campos]);
  const [abierto, setAbierto] = useState<number | null>(null);
  // Valores por campo: reabrir un filtro no vuelve al servidor.
  const cache = useRef(new Map<string, Opciones>());

  const sugeridos = useMemo(
    () =>
      SUGERIDOS.map((k) => campos.find((c) => claveCampo(c) === k)).filter(
        (c): c is CampoCatalogo => c !== undefined && !filtros.some((f) => f.campoId === c.id),
      ),
    [campos, filtros],
  );

  const agregar = (campo: CampoCatalogo) => {
    onFiltrosChange([...filtros, filtroVacio(campo)]);
    setAbierto(filtros.length);
  };
  const cambiar = (i: number, f: Filtro) => onFiltrosChange(filtros.map((x, j) => (j === i ? f : x)));
  const quitar = (i: number) => {
    onFiltrosChange(filtros.filter((_, j) => j !== i));
    setAbierto(null);
  };

  const activos = filtros.filter(filtroActivo).length;
  // Igual que en el servidor: un filtro de Tipo Cuenta cambia de bancos a contabilidad.
  const porTipoCuenta = filtros.some((f) => {
    const c = porId.get(f.campoId);
    return filtroActivo(f) && c?.tabla === "a" && c.campo === "accttype";
  });

  return (
    <section
      aria-labelledby="filtros-title"
      data-tour="filtros"
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 id="filtros-title" className="text-base font-semibold tracking-tight text-foreground">
            Filtros
          </h2>
          <p className="text-sm text-muted-foreground">
            {activos === 0
              ? filtros.length > 0
                ? "Completa el filtro para aplicarlo; mientras tanto se exportan todas las líneas."
                : "Sin filtros: se exportan todas las líneas del periodo."
              : `Solo se exportan las líneas que cumplen ${activos === 1 ? "el filtro" : `los ${activos} filtros`}.`}{" "}
            {porTipoCuenta
              ? "Con Tipo Cuenta se incluyen todos los documentos contables de esas cuentas, diarios incluidos."
              : "Sin un filtro de Tipo Cuenta solo salen cuentas bancarias, sin diarios."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtros.length > 0 && (
            <Button variant="ghost" disabled={disabled} onClick={() => onFiltrosChange([])}>
              Quitar todos
            </Button>
          )}
          <SelectorCampo
            campos={campos}
            usados={new Set(filtros.map((f) => f.campoId))}
            disabled={disabled || filtros.length >= MAX_FILTROS}
            onSelect={agregar}
          />
        </div>
      </header>

      {filtros.length === 0 ? (
        sugeridos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" data-tour="filtros-sugeridos">
            <span className="text-xs text-muted-foreground">Sugeridos</span>
            {sugeridos.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => agregar(c)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-input px-2.5 text-xs text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50"
              >
                <Plus className="size-3" aria-hidden />
                {c.etiqueta}
              </button>
            ))}
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-2" data-tour="filtros-lista">
          {filtros.map((f, i) => {
            const campo = porId.get(f.campoId);
            if (!campo) return null;
            const activo = filtroActivo(f);
            return (
              <li
                key={`${f.campoId}-${i}`}
                className={cn(
                  "flex min-w-0 items-center gap-1 rounded-md border bg-background pl-3",
                  activo ? "border-border" : "border-dashed border-input",
                )}
              >
                <span className="shrink-0 text-sm font-medium text-foreground">{campo.etiqueta}</span>
                <Popover open={abierto === i} onOpenChange={(v) => setAbierto(v ? i : null)}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={disabled}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        activo ? "text-foreground" : "text-muted-foreground",
                      )}
                      title={activo ? describirFiltro(f, campo) : undefined}
                    >
                      {activo ? describirFiltro(f, campo) : "Sin definir: no se aplica"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))] p-0">
                    <EditorFiltro
                      campo={campo}
                      filtro={f}
                      onChange={(nf) => cambiar(i, nf)}
                      cache={cache.current}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  disabled={disabled}
                  onClick={() => quitar(i)}
                  aria-label={`Quitar filtro de ${campo.etiqueta}`}
                >
                  <X aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SelectorCampo({
  campos,
  usados,
  disabled,
  onSelect,
}: {
  campos: CampoCatalogo[];
  usados: Set<string>;
  disabled: boolean;
  onSelect: (c: CampoCatalogo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const visibles = campos.filter(
    (c) => !usados.has(c.id) && (!query || c.etiqueta.toLowerCase().includes(query) || c.campo.includes(query)),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQ("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} data-tour="agregar-filtro">
          <FilterIcon aria-hidden />
          Agregar filtro
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="relative border-b border-border p-2">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar campo…"
            aria-label="Buscar campo para filtrar"
            className="h-8 pl-7"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {TABLAS.map((tabla) => {
            const grupo = visibles.filter((c) => c.tabla === tabla);
            if (grupo.length === 0) return null;
            return (
              <div key={tabla} className="py-1">
                <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {TABLA_LABEL[tabla]}
                </p>
                {grupo.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <span className="truncate">{c.etiqueta}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {TIPO_FILTRO_LABEL[tiposFiltro(c.tipo)[0]!]}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          {visibles.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Ningún campo coincide.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditorFiltro({
  campo,
  filtro,
  onChange,
  cache,
}: {
  campo: CampoCatalogo;
  filtro: Filtro;
  onChange: (f: Filtro) => void;
  cache: Map<string, Opciones>;
}) {
  const tipos = tiposFiltro(campo.tipo);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="truncate text-sm font-semibold text-foreground">{campo.etiqueta}</span>
        {tipos.length > 1 && (
          <Select
            value={filtro.tipo}
            onValueChange={(t) => onChange(filtroVacio(campo, t as TipoFiltro))}
          >
            <SelectTrigger className="h-7 w-auto gap-1.5 text-xs" aria-label="Tipo de filtro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {tipos.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TIPO_FILTRO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtro.tipo === "lista" && (
        <EditorLista
          campo={campo}
          filtro={filtro}
          onChange={onChange}
          cache={cache}
        />
      )}
      {filtro.tipo === "texto" && (
        <div className="flex flex-col gap-2 p-3">
          <div className="flex gap-2">
            <Select
              value={filtro.op}
              onValueChange={(op) => onChange({ ...filtro, op: op as typeof filtro.op })}
            >
              <SelectTrigger className="h-9 w-36 shrink-0" aria-label="Condición">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OP_TEXTO_LABEL).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              autoFocus
              maxLength={200}
              value={filtro.valor}
              placeholder="Texto…"
              aria-label={`Texto a buscar en ${campo.etiqueta}`}
              onChange={(e) => onChange({ ...filtro, valor: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">No distingue mayúsculas de minúsculas.</p>
        </div>
      )}
      {filtro.tipo === "rango" && <EditorRango campo={campo} filtro={filtro} onChange={onChange} />}
      {filtro.tipo === "presencia" && (
        <div role="radiogroup" aria-label="Condición" className="grid grid-cols-2 gap-2 p-3">
          {(["con_valor", "vacio"] as const).map((op) => (
            <button
              key={op}
              type="button"
              role="radio"
              aria-checked={filtro.op === op}
              onClick={() => onChange({ ...filtro, op })}
              className={cn(
                "h-9 rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                filtro.op === op
                  ? "border-primary/40 bg-primary/10 font-medium text-primary"
                  : "border-input bg-background text-foreground hover:bg-accent",
              )}
            >
              {op === "con_valor" ? "Tiene valor" : "Está vacío"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditorRango({
  campo,
  filtro,
  onChange,
}: {
  campo: CampoCatalogo;
  filtro: Extract<Filtro, { tipo: "rango" }>;
  onChange: (f: Filtro) => void;
}) {
  const tipoInput = campo.tipo === "number" ? "text" : "date";
  const set = (k: "min" | "max", v: string) => onChange({ ...filtro, [k]: v.trim() === "" ? null : v.trim() });
  const errMin = errorRango(campo.tipo, filtro.min);
  const errMax = errorRango(campo.tipo, filtro.max);
  const invertido =
    !errMin &&
    !errMax &&
    filtro.min !== null &&
    filtro.max !== null &&
    (campo.tipo === "number" ? Number(filtro.min) > Number(filtro.max) : filtro.min > filtro.max);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        {(["min", "max"] as const).map((k) => (
          <label key={k} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{k === "min" ? "Desde" : "Hasta"}</span>
            <Input
              type={tipoInput}
              inputMode={campo.tipo === "number" ? "decimal" : undefined}
              autoFocus={k === "min"}
              className="h-9 font-mono tabular-nums"
              placeholder={campo.tipo === "number" ? (k === "min" ? "sin mínimo" : "sin máximo") : undefined}
              value={filtro[k] ?? ""}
              aria-invalid={(k === "min" ? errMin : errMax) ? true : undefined}
              onChange={(e) => set(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      {(errMin || errMax || invertido) && (
        <p role="alert" className="text-xs text-destructive">
          {errMin ?? errMax ?? "“Desde” es mayor que “Hasta”: no saldrá ninguna fila."}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {campo.tipo === "number"
          ? "Usa punto para decimales. Deja un extremo vacío para no limitarlo."
          : "Incluye los dos días. Deja un extremo vacío para no limitarlo."}
      </p>
    </div>
  );
}

function EditorLista({
  campo,
  filtro,
  onChange,
  cache,
}: {
  campo: CampoCatalogo;
  filtro: Extract<Filtro, { tipo: "lista" }>;
  onChange: (f: Filtro) => void;
  cache: Map<string, Opciones>;
}) {
  const [estado, setEstado] = useState<EstadoOpciones>(() => {
    const hit = cache.get(campo.id);
    return hit ? { status: "ok", data: hit } : { status: "loading" };
  });
  // 0 = usar la caché; cada clic en Actualizar o Reintentar la incrementa.
  const [pedido, setPedido] = useState<{ n: number; actualizar: boolean }>({ n: 0, actualizar: false });
  const [q, setQ] = useState("");

  useEffect(() => {
    const hit = pedido.actualizar ? undefined : cache.get(campo.id);
    if (hit) {
      setEstado({ status: "ok", data: hit });
      return;
    }
    const ctrl = new AbortController();
    setEstado({ status: "loading" });
    fetch("/api/export-bancos/opciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campoId: campo.id, actualizar: pedido.actualizar }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? `No se pudieron leer los valores (HTTP ${res.status}).`);
        cache.set(campo.id, json as Opciones);
        setEstado({ status: "ok", data: json as Opciones });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setEstado({ status: "error", error: err.message || "No se pudo contactar el servidor." });
      });
    return () => ctrl.abort();
  }, [campo.id, cache, pedido]);

  const elegidos = new Set(filtro.valores.map((x) => x.v));
  const toggle = (op: ValorLista, checked: boolean) =>
    onChange({
      ...filtro,
      valores: checked ? [...filtro.valores, op] : filtro.valores.filter((x) => x.v !== op.v),
    });

  const opciones = estado.status === "ok" ? estado.data.opciones : [];
  // Valores guardados (p. ej. de una plantilla) que no salen en este periodo.
  const ausentes = filtro.valores.filter((x) => !opciones.some((o) => o.v === x.v));
  const query = q.trim().toLowerCase();
  const visibles = query
    ? opciones.filter((o) => (o.l || "").toLowerCase().includes(query) || (o.v ?? "").toLowerCase().includes(query))
    : opciones;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div role="radiogroup" aria-label="Modo" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5">
          {(["incluir", "excluir"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={filtro.modo === m}
              onClick={() => onChange({ ...filtro, modo: m })}
              className={cn(
                "h-7 rounded-[4px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filtro.modo === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "incluir" ? "Solo estos" : "Todos menos estos"}
            </button>
          ))}
        </div>
        {opciones.length > 8 && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar en ${NUM.format(opciones.length)} valores…`}
              aria-label="Buscar valor"
              className="h-8 pl-7"
            />
          </div>
        )}
      </div>

      {estado.status === "loading" && (
        <div className="flex flex-col gap-2 p-3" aria-busy="true">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {pedido.actualizar
              ? "Actualizando los valores desde NetSuite (hasta 30 s)…"
              : "Leyendo los valores de NetSuite por primera vez (hasta 30 s)…"}
          </p>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      )}

      {estado.status === "error" && (
        <div className="flex flex-col items-start gap-2 p-3">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            {estado.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPedido((p) => ({ n: p.n + 1, actualizar: p.actualizar }))}
          >
            <RefreshCw aria-hidden />
            Reintentar
          </Button>
        </div>
      )}

      {estado.status === "ok" && (
        <>
          {filtro.valores.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-3 pt-2 text-xs text-muted-foreground">
              <span>
                {filtro.valores.length} {filtro.valores.length === 1 ? "elegido" : "elegidos"}
              </span>
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onChange({ ...filtro, valores: [] })}
              >
                Limpiar
              </button>
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto p-1" aria-label={`Valores de ${campo.etiqueta}`}>
            {ausentes.map((x) => (
              <FilaValor
                key={`ausente-${x.v}`}
                label={x.v === null ? "(vacío)" : x.l || x.v}
                checked
                onCheckedChange={(c) => toggle(x, c)}
              />
            ))}
            {visibles.map((o) => (
              <FilaValor
                key={o.v ?? "__null__"}
                label={o.v === null ? "(vacío)" : o.l || o.v}
                codigo={o.v !== null && o.l && o.l !== o.v ? o.v : undefined}
                checked={elegidos.has(o.v)}
                onCheckedChange={(c) => toggle({ v: o.v, l: o.l }, c)}
              />
            ))}
            {visibles.length === 0 && ausentes.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                {opciones.length === 0 ? `Sin movimientos en los últimos ${VENTANA_DIAS} días.` : "Ningún valor coincide."}
              </li>
            )}
          </ul>
          {estado.data.truncado && (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              Se muestran los {NUM.format(opciones.length)} valores con más filas. Para uno en particular
              cambia a <span className="font-medium text-foreground">Buscar texto</span>.
            </p>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span>
              {estado.data.refrescando ? (
                "Actualizando en segundo plano…"
              ) : (
                <>
                  Actualizado <Hace iso={estado.data.actualizadoAt} />
                </>
              )}
              {estado.data.diasSinDatos > 0 && ` · faltan ${estado.data.diasSinDatos} días`}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setPedido((p) => ({ n: p.n + 1, actualizar: true }))}
            >
              <RefreshCw className="size-3" aria-hidden />
              Actualizar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FilaValor({
  label,
  codigo,
  checked,
  onCheckedChange,
}: {
  label: string;
  codigo?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <li>
      <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent">
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={codigo ? `${label} (${codigo})` : label}>
          {label}
          {codigo && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{codigo}</span>}
        </span>
      </label>
    </li>
  );
}

const RTF = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 3 días"; se calcula después de montar para no desfasar la hidratación. */
function Hace({ iso }: { iso: string }) {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (min < 60) setTexto(min < 1 ? "hace un momento" : RTF.format(-min, "minute"));
    else if (min < 1440) setTexto(RTF.format(-Math.round(min / 60), "hour"));
    else setTexto(RTF.format(-Math.round(min / 1440), "day"));
  }, [iso]);
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString("es-CO")}>
      {texto ?? ""}
    </time>
  );
}
