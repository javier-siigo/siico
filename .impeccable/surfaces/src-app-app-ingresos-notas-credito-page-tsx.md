---
version: 1
slug: "src-app-app-ingresos-notas-credito-page-tsx"
primary_target: "src/app/(app)/ingresos/notas-credito/page.tsx"
related_targets: ["src/components/notas-credito/notas-credito-page.tsx","src/components/notas-credito/upload-card.tsx","src/components/notas-credito/result-card.tsx","src/components/notas-credito/history-list.tsx","src/components/notas-credito/types.ts"]
---

# Surface brief — Notas crédito

<!-- impeccable:surface-brief 1 -->

## Scope and visitor mode

- **Surface:** `Ingresos › Notas crédito` — file upload → run → download → in-session history.
- **Mode:** Operate. The visitor is a contador on the Siigo team completing a single, bounded task per visit.
- **Primary target:** `src/app/(app)/ingresos/notas-credito/page.tsx`
- **Related targets:**
  - `src/components/notas-credito/notas-credito-page.tsx`
  - `src/components/notas-credito/upload-card.tsx`
  - `src/components/notas-credito/result-card.tsx`
  - `src/components/notas-credito/history-list.tsx`
  - `src/components/notas-credito/types.ts`
- **Out of scope:** `src/components/ui/attachment.tsx` and otros primitives compartidos. No edits a `PRODUCT.md` o `DESIGN.md`.

## Audience, job, action

- **Audience:** contadores del área contable de Siigo, sesión diurna, portátil 1366×768–1920×1080.
- **Job:** conciliar un archivo `INFORME` de notas crédito contra NetSuite y descargar el resultado.
- **Action por visita:** elegir archivo → ejecutar → leer estado → descargar (o reintentar) → opcionalmente revisar el historial de la sesión.
- **Proof/content:** el archivo subido, el nombre del resultado, el tamaño en bytes, el código de error cuando aplica. No se inventan claims ni números.

## Constraints

- Sistema visual fijado por `DESIGN.md`. Sin fuentes display, sin radios nuevos (4 / 6 / 8 / 12), sin gradientes, sin glassmorphism decorativo.
- Tipografías autorizadas: la familia sans ya cargada para todo el texto; IBM Plex Mono exclusivamente para tokens numéricos y de código.
- Idioma: español en todo el contenido visible.
- Estados a tipografiar: `idle`, `uploading`, `processing`, `done`, `error`. Mismas reglas de jerarquía en todos los estados.
- Regla del 768px Surface Flip: la página opera en el layout autenticado (`(app)`); no introduce un patrón modal propio.

## Typography roles on this surface

- **Title** (`text-base font-semibold tracking-tight text-foreground`): h1 de la superficie y títulos de tarjeta (h2 dentro de cada `<section>`).
- **Body / Lede** (`text-sm text-muted-foreground`): descripción de la página, descripción de tarjeta.
- **Helper** (`text-xs text-muted-foreground`): pistas de uso, formato de archivo, código de error, descripción del Attachment.
- **Label / Eyebrow de grupo** (`text-[11px] font-medium uppercase tracking-wide text-muted-foreground`): rótulos de navegación y metadatos de sección. **No se usa como kicker encima del h1** — el encabezado carga su propio peso.
- **Value** (`font-mono text-sm tabular-nums`): tamaño de archivo, hora. Coincide con el rol Mono de `DESIGN.md` (medium 500, 14px, tabular-nums).
- **Status** (`text-xs font-medium uppercase tracking-wide`, color heredado del estado del `Attachment`): verbos de estado (`Subiendo`, `Procesando`, `Enviado`, `Falló`).
- **Destructive** (`text-destructive/80`): errores, heredado del primitive `Attachment`.

## Applied edits

### typeset pass

1. `notas-credito-page.tsx` — header pasa de dos `<p>` consecutivos a h1 + lede (`text-sm`) + helper (`text-xs`).
2. `result-card.tsx` — se quita la sobreescritura condicional `busy` en `AttachmentDescription`. Mismas reglas en los cinco estados. Mono inline a `text-sm`.
3. `upload-card.tsx` — `verbLabel` se promueve a rótulo de estado (`font-medium uppercase tracking-wide`). Mono inline a `text-sm`.
4. `history-list.tsx` — mono inline (tamaño, hora) a `text-sm`.

### layout pass

1. `upload-card.tsx:90` — section header `gap-1` → `gap-1.5`.
2. `upload-card.tsx:164` — DropZone `min-h-[180px]` → `min-h-44` (alineado al token).
3. `upload-card.tsx:176` — DropZone text stack `gap-1` → `gap-1.5`.
4. `result-card.tsx:83` — section header `gap-1` → `gap-1.5`.
5. `history-list.tsx:36-40` — contador: el número se queda en mono; la palabra (`corrida` / `corridas`) vuelve a sans.
6. `history-list.tsx:74` — `gap-0.5` → `gap-1`.
7. `notas-credito-page.tsx:230` — grid de tarjetas `gap-6` → `gap-5` (regla DESIGN.md para feature surface).

### polish pass

1. **Fix de pérdida de datos en error.** Antes: `handleSubmit` y `handleRetry` hacían `setPendingFile(null)` antes de pedir, así que en error el usuario perdía el archivo que había subido y los dos botones "Reintentar" (en UploadCard y en ResultCard) sólo limpiaban el estado sin volver a enviar nada. Después: el `File` se conserva en `pendingFile` durante todo el ciclo de la corrida; `handleSubmit` y `handleRetry` ya no lo limpian. El doble-submit sigue prevenido porque `canSubmit = status === "idle"` esconde el botón "Procesar" durante `uploading` / `processing`.
2. **Workaround eliminado.** `currentRunToFile` creaba un `File` sintético con blob vacío para mostrar el archivo en UploadCard durante uploading/processing. Con el fix #1 ya no hace falta — la derivación del prop `file` es simplemente `pendingFile`.
3. **Código muerto eliminado.** `setHistory((prev) => prev)` dentro de `runConciliacion` era un no-op que se eliminó.

## States walkthrough (post-polish)

| Estado | `pendingFile` | `currentRun` | UploadCard | ResultCard |
|---|---|---|---|---|
| Inicial | `null` | `null` | DropZone | "Sin resultado aún" |
| Archivo seleccionado | `file` | `null` | File + Procesar | "Sin resultado aún" |
| Subiendo | `file` | `uploading` | File + shimmer, sin botones de acción | "Subiendo archivo…" |
| Procesando | `file` | `processing` | File + shimmer | "Conciliando con NetSuite…" |
| Listo | `file` | `done` | File + X | Resultado + Descargar |
| **Error (fix principal)** | **`file`** | `error` | **File + Reintentar + X** | Error + Reintentar |
| Cancelado por usuario | `null` | `null` | DropZone | "Sin resultado aún" |
| Archivo nuevo tras error | `new file` | `null` | File nuevo + Procesar | "Sin resultado aún" |

## Verification

- `impeccable detect --json --scope type` sobre los cinco archivos: `[]`.
- `impeccable detect --json --scope layout` sobre los mismos: `[]`.
- `impeccable detect --json` (todos los scopes): `[]`.
- `bun run typecheck`: limpio.
- `bun run lint`: limpio.
- Walkthrough manual de los ocho estados, transiciones y atajos de teclado (Enter/Space en DropZone, Tab + activación de botones): consistente.

## Known debt

- **Doble h1 en la página.** El topbar (`src/components/layout/topbar.tsx`) y la superficie renderizan `<h1>Notas crédito</h1>` cada uno. Es una decisión consciente del usuario al elegir "Add h1 on the surface" sobre "Keep topbar-only"; el lado limpio sería demorar el h1 del topbar a `<span>` o `aria-hidden`. Sigue siendo un follow-up; no se aborda aquí por estar fuera del scope acordado.
- **El `Attachment` primitive es `text-xs` por descripción.** El mono inline (`text-sm`) es deliberadamente mayor que la descripción que lo rodea para alinearse con el rol Mono de `DESIGN.md`. Visualmente queda como un dato ligeramente levantado sobre la prosa — el mismo patrón que el KPI tile value sobre el KPI label.
- **`formatBytes` duplicado en `upload-card.tsx`, `result-card.tsx` e `history-list.tsx`.** Cinco líneas, sin lógica. La consolidación a `src/lib/notas-credito/format.ts` queda fuera del scope acordado de la superficie; vale la pena si la superficie crece.
