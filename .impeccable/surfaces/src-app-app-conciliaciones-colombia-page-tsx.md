---
version: 1
slug: "src-app-app-conciliaciones-colombia-page-tsx"
primary_target: "src/app/(app)/conciliaciones/colombia/page.tsx"
related_targets:
  [
    "src/components/conciliaciones/conciliaciones-page.tsx",
    "src/components/conciliaciones/bank-combobox.tsx",
    "src/components/conciliaciones/dual-upload-card.tsx",
    "src/components/conciliaciones/file-slot.tsx",
    "src/components/conciliaciones/types.ts",
  ]
---

# Surface brief — Conciliaciones › Colombia

<!-- impeccable:surface-brief 1 -->

## Scope and visitor mode

- **Surface:** `Conciliaciones › Colombia` — selección de banco → carga de reporte SIIGO (y reporte previo opcional) → conciliación vía n8n → descarga del resultado desde el botón junto a Procesar.
- **Mode:** Operate. La visita resuelve una tarea contable concreta y termina cuando el contador descarga el resultado.
- **Primary target:** `src/app/(app)/conciliaciones/colombia/page.tsx`
- **Related targets:** (ver `related_targets` arriba).
- **Out of scope:** `src/components/ui/attachment.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/button.tsx`, `src/components/ui/command.tsx`, `src/components/ui/popover.tsx` y demás primitives compartidos. No edits a `PRODUCT.md` o `DESIGN.md`. Sin cambios en API routes ni en `lib/conciliaciones/`.

## Audience, job, action

- **Audience:** contadores del área contable de Siigo, sesión diurna, portátil 1366×768–1920×1080. Mismo público que las otras superficies contables.
- **Job:** conciliar el reporte SIIGO de un banco colombiano contra el reporte del banco y, opcionalmente, contra un reporte previo.
- **Action por visita:** elegir banco → subir reporte SIIGO → (opcional) subir reporte previo → ejecutar → descargar.
- **Proof/content:** el archivo subido, el nombre del resultado, el tamaño en bytes, el código de error cuando aplica. No se inventan claims ni números.

## Constraints

- Sistema visual fijado por `DESIGN.md`. Sin fuentes display, sin radios nuevos (4 / 6 / 8 / 12), sin gradientes, sin glassmorphism decorativo.
- Tipografías autorizadas: IBM Plex Sans para todo el texto, IBM Plex Mono exclusivamente para tokens numéricos y de código.
- Idioma: español en todo el contenido visible.
- Estados a tipografiar: `idle`, `uploading`, `processing`, `done`, `error`. Mismas reglas de jerarquía en todos los estados.
- Regla del 768px Surface Flip: la página opera en el layout autenticado (`(app)`); no introduce un patrón modal propio.
- **Límite de tamaño:** 10 MB (validado server-side; el flujo `conciliaciones-uploads` recibe hasta 50 MB en el bucket).
- **One-Voice Rule:** Siigo azul ≤10 % del viewport (más el sidebar). El chip "Obligatorio" usa un *tint* primary, no un fill, para no romper la regla.

## Typography roles on this surface

- **Title** (`text-base font-semibold tracking-tight text-foreground`): h1 de la superficie y títulos de tarjeta (`Conciliación Colombia`, `Banco a conciliar`, `Archivos a conciliar`).
- **Body / Lede** (`text-sm text-muted-foreground`): descripción de la página, descripción de tarjeta.
- **Helper** (`text-xs text-muted-foreground`): pistas de uso, formato de archivo, código de error, descripción del slot.
- **Label / Chip** (`text-[11px] font-medium uppercase tracking-wide`): rótulos de los chips `Obligatorio` / `Opcional`. Los chips van en pill **outlined** (`border bg-…`), no en fill primary.
- **Status** (`font-medium uppercase tracking-wide`): verbos de estado en `SelectedFileChip` (`subiendo…`, `procesando…`, `enviado`, `falló`).
- **Destructive** (`text-destructive/80`): errores en descripción del slot.

## Architecture (informativo — no editado en este pass)

- Tres pasos en el cliente: `POST /api/conciliaciones/upload-url` → `PUT {url}` con el binario → `POST /api/conciliaciones/conciliar`. Mismo patrón que `notas-credito` (adaptado del deploy-failure-fix allí documentado).
- `bucket = "conciliaciones-uploads"`, RLS `{uid}/*`, service role para descargar/borrar en el servidor.
- Webhook por banco en `conciliacion_bancos.webhook_url`, consultado vía `getBancoPorSlug(pais, slug)`.

## Applied edits (result-section removal)

1. **`conciliaciones-page.tsx` — Eliminar `<ResultCard>` y `<HistoryList>` del JSX.**
   - Antes: tras el botón Procesar se renderizaba `<ResultCard run={currentRun} onDownload onRetry />` (con su propio botón Descargar / Reintentar) seguido de `<HistoryList runs={history} onDownload />` (lista de corridas previas con descarga individual).
   - Después: solo el botón Procesar (más el botón Descargar condicional descrito abajo). Sin tarjeta de resultado, sin lista de historial, sin reintento inline. Los errores se notifican por `toast` (única señal visible de fallo).
   - Archivos eliminados (quedan huérfanos al no tener otros consumidores en `conciliaciones/`): `src/components/conciliaciones/result-card.tsx`, `src/components/conciliaciones/history-list.tsx`. `notas-credito/` mantiene sus propias copias intactas.

2. **`conciliaciones-page.tsx` — Botón Descargar inline en la fila de acciones.**
   - Antes: la descarga vivía dentro de `<ResultCard>`, accesible solo cuando esa sección estaba montada.
   - Después: el botón Procesar y el nuevo botón Descargar comparten el contenedor `flex items-center justify-end gap-2`. El botón Descargar solo se monta cuando `currentRun?.status === "done"`. Mismo `variant="default"` que Procesar: la culminación exitosa del flujo es una CTA principal al mismo nivel.
   - `onClick={() => triggerDownload(currentRun)}` reusa la misma helper que servía al result card y al historial, así que la lógica de blob URL, `URL.revokeObjectURL` en unmount, y nombre de archivo (`Content-Disposition` decodificado) se mantiene intacta.
   - Icono: `Download` (`size-4`, hereda el gap/alineación del primitive `Button`).

3. **`conciliaciones-page.tsx` — Reducción de estado.**
   - Antes: `history: ConciliacionRun[]`, `finalizeRun(run)` que hacía `setHistory(...)` + `setCurrentRun(run)`, constante `HISTORY_LIMIT = 10`, `handleRetry`.
   - Después: solo `currentRun`. `finalizeRun` se inlinea (`setCurrentRun(failed)` / `setCurrentRun(done)`). Se eliminan `history`, `HISTORY_LIMIT`, `handleRetry` y las dependencias relacionadas en los `useCallback`. El `blobUrlsRef` y su cleanup se mantienen porque el resultado del run actual sigue viviendo en memoria mientras la página está montada.

4. **`conciliaciones-page.tsx` — Errores solo por toast.**
   - Antes: `ResultCard` mostraba título `No se pudo conciliar {banco}` + descripción con `run.error` + botón `Reintentar`.
   - Después: `toast.error(message)` sigue siendo la única señal visible. Sin affordance inline de reintento: el usuario re-sube archivos o reintenta manualmente con Procesar. Decisión de scope explícita: mantener la UI limpia.

## Verification

- `impeccable detect --json --scope type --target src/components/conciliaciones`: `[]`.
- `impeccable detect --json --scope layout --target src/components/conciliaciones`: `[]`.
- `impeccable detect --json --scope type --target src/app/(app)/conciliaciones`: `[]`.
- `impeccable detect --json --scope layout --target src/app/(app)/conciliaciones`: `[]`.
- `bun run typecheck`: limpio.
- `bun run lint`: limpio.
- `bun run build`: compila; `/conciliaciones/colombia` queda registrada como ruta dinámica (`ƒ`). Sin warnings sobre exports muertos.

## Walkthrough manual

| Estado | Light (1440) | Dark (1440) | Mobile (390) | Tablet (768) |
|---|---|---|---|---|
| Inicial, sin selección | ✓ | ✓ | ✓ | ✓ |
| Banco seleccionado | ✓ | ✓ | — | — |
| Reporte SIIGO seleccionado | ✓ | ✓ | — | — |
| Procesando (`Procesando…`) | ✓ | ✓ | — | — |
| Resultado listo, botón Descargar | ✓ | ✓ | — | — |
| Error (toast, sin sección) | ✓ | ✓ | — | — |

Detalle del walkthrough: la página termina en el botón Procesar (más Descargar condicional). No hay tarjeta inferior, no hay lista de historial. La transición de estado idle → uploading → processing se sigue reflejando en el chip del slot del archivo principal y del previo (status: `previoStatus` cableado en el pass anterior, sigue vigente).

## Known debt

- **Doble h1 en la página.** El topbar (`src/components/layout/topbar.tsx`) y la superficie renderizan `<h1>` cada uno: topbar muestra "Colombia" (label del proceso), la superficie muestra "Conciliación Colombia". Mismo patrón que el known debt en `.impeccable/surfaces/src-app-app-ingresos-notas-credito-page-tsx.md`. La solución limpia es demorar el h1 del topbar a `<span>` o `aria-hidden`, pero requiere tocar el topbar compartido y sale del scope del pass.
- **Espacio entre upload card y botón submit.** El botón está separado del upload card por `gap-6` (24 px) del contenedor padre. Es consistente con el resto de las separaciones entre cards, pero podría acercarse al footer del upload card para acortar la distancia visual al "go" del flujo. Decisión: no se mueve para mantener el ritmo de la página.
- **Chip "Obligatorio" sigue siendo brand-tinted.** El outlined primary/30 + primary/5 + text-primary sigue ocupando algo del 10 % del viewport asignado a Siigo azul. Es correcto — la marca debe decir "este es el archivo importante". No es un fix necesario.
- **Sin retry UI inline.** El error se comunica solo por toast. Si en el futuro se quiere recuperar el affordance, el lugar natural es el slot del botón Procesar (un tercer botón a la derecha cuando `currentRun?.status === "error"`). Decisión de scope actual: toast-only.
