---
version: 1
slug: "src-app-app-ingresos-notas-credito-page-tsx"
primary_target: "src/app/(app)/ingresos/notas-credito/page.tsx"
related_targets: ["src/components/notas-credito/notas-credito-page.tsx","src/components/notas-credito/upload-card.tsx","src/components/notas-credito/result-card.tsx","src/components/notas-credito/history-list.tsx","src/components/notas-credito/types.ts","src/app/api/notas-credito/upload-url/route.ts","src/app/api/notas-credito/conciliar/route.ts","src/lib/notas-credito/conciliar.ts","src/lib/supabase/admin.ts","src/lib/env.ts"]
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
- **Out of scope:** `src/components/ui/attachment.tsx` y otros primitives compartidos. No edits a `PRODUCT.md` o `DESIGN.md`.

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
- **Límite de tamaño:** 10 MB (validado server-side tras la descarga; n8n acepta hasta 50 MB en su bucket).

## Typography roles on this surface

- **Title** (`text-base font-semibold tracking-tight text-foreground`): h1 de la superficie y títulos de tarjeta.
- **Body / Lede** (`text-sm text-muted-foreground`): descripción de la página, descripción de tarjeta.
- **Helper** (`text-xs text-muted-foreground`): pistas de uso, formato de archivo, código de error, descripción del Attachment.
- **Label / Eyebrow de grupo** (`text-[11px] font-medium uppercase tracking-wide text-muted-foreground`): rótulos de navegación y metadatos de sección. **No se usa como kicker encima del h1** — el encabezado carga su propio peso.
- **Value** (`font-mono text-sm tabular-nums`): tamaño de archivo, hora.
- **Status** (`text-xs font-medium uppercase tracking-wide`): verbos de estado.
- **Destructive** (`text-destructive/80`): errores, heredado del primitive `Attachment`.

## Architecture (post-deploy-failure fix)

El límite de 4.5 MB del body de las funciones serverless de Vercel impedía subir archivos de 7-8 MB. La superficie ahora sube directo a Supabase Storage vía URL firmada y el servidor sólo recibe la ruta:

1. **Bucket:** `notas-credito-uploads` (privado, 50 MB máx. por objeto, RLS activo).
2. **RLS:** un usuario autenticado sólo puede escribir en `{su_auth_uid}/*`; el servicio (service role) bypasea RLS para descargar y borrar.
3. **Three-step submit** (`src/components/notas-credito/notas-credito-page.tsx`):
   1. `POST /api/notas-credito/upload-url` con `{ filename, contentType, size }` → recibe `{ url, path, token }`.
   2. `PUT {url}` con el binario del archivo (`Content-Type` del archivo).
   3. `POST /api/notas-credito/conciliar` con `{ storagePath, originalName }` → recibe el blob procesado o un JSON de error.
4. **Cleanup:** el servidor borra el objeto de Storage tras una conciliación exitosa; lo conserva en caso de error y devuelve `storagePath` en la respuesta para soporte.
5. **Seguridad:** el servidor valida que `storagePath` empieza con `{auth.uid()}/` antes de descargar — un usuario A no puede conciliar un objeto en la carpeta del usuario B.

## Applied edits

### typeset pass

1. `notas-credito-page.tsx` — header pasa a h1 + lede + helper.
2. `result-card.tsx` — se quita la sobreescritura `busy` en `AttachmentDescription`. Mono inline a `text-sm`.
3. `upload-card.tsx` — `verbLabel` se promueve a rótulo de estado. Mono inline a `text-sm`.
4. `history-list.tsx` — mono inline a `text-sm`.

### layout pass

1-7. (omitted here for brevity; ver historial de git para los siete edits de spacing y la separación mono/sans del contador del historial).

### polish pass

1. **Fix de pérdida de datos en error.** `handleSubmit` y `handleRetry` ya no limpian `pendingFile`. El archivo se conserva durante toda la corrida, así los dos botones "Reintentar" resubmiten con el mismo archivo.
2. **Workaround eliminado.** `currentRunToFile` removido.
3. **Código muerto eliminado.** `setHistory((prev) => prev)` removido.

### deploy-failure pass

Problema: archivos de 7+ MB eran rechazados con 413 por el límite de 4.5 MB de Vercel serverless, antes de que el route handler corriera.

1. **Nueva migración Supabase** — crea el bucket `notas-credito-uploads` (privado, 50 MB cap) y las políticas RLS.
2. **`src/lib/env.ts`** — añadido `SUPABASE_SERVICE_ROLE_KEY` al schema del servidor.
3. **`src/lib/supabase/admin.ts`** (nuevo) — cliente service-role cacheado.
4. **`src/app/api/notas-credito/upload-url/route.ts`** (nuevo) — endpoint autenticado que crea signed upload URLs.
5. **`src/app/api/notas-credito/conciliar/route.ts`** — multipart → JSON `{ storagePath, originalName }`. Valida path contra `auth.uid()`, descarga del bucket vía service role, re-valida size/tipo, llama `conciliarNotasCredito`. Borra el objeto en éxito; lo conserva y devuelve `storagePath` en error.
6. **`src/lib/notas-credito/conciliar.ts`** — type union gana `storage_unauthorized` y `storage_not_found`.
7. **`src/components/notas-credito/notas-credito-page.tsx`** — `runConciliacion` ahora hace el three-step (presign → PUT → POST). Tipo de `ERROR_MESSAGES` ahora es `Record<ErrorCode, string>` con un helper `asErrorCode` para narrowing.
8. **`.env.example`** — `SUPABASE_SERVICE_ROLE_KEY` descomentado con documentación inline.

## Verification

- `impeccable detect --json --scope type` sobre los archivos relevantes: `[]`.
- `impeccable detect --json --scope layout`: `[]`.
- `bun run typecheck`: limpio.
- `bun run lint`: limpio.
- `bun run build`: compila, registra las dos rutas (`/api/notas-credito/conciliar` y `/api/notas-credito/upload-url`).
- Walkthrough manual de los ocho estados y los tres pasos de submit.

## Manual walkthrough (post-deploy-failure-fix)

| Paso | Cliente | Servidor | Estado UI |
|---|---|---|---|
| 1. Presign | `POST /api/notas-credito/upload-url` | Auth, valida body, genera `{url, path, token}` | `uploading` |
| 2. Upload | `PUT {url}` con binario | Supabase Storage RLS permite `{user_id}/*` | `uploading` |
| 3. Conciliate | `POST /api/notas-credito/conciliar` `{storagePath, originalName}` | Valida path, descarga, valida, llama n8n | `processing` → `done` |

Cancelación (clic en X en cualquier paso): el AbortController cancela el fetch activo; el server puede dejar un objeto parcial en Storage (limpieza eventual vía TTL o job manual).

## Known debt

- **Doble h1 en la página.** El topbar (`src/components/layout/topbar.tsx`) y la superficie renderizan `<h1>Notas crédito</h1>` cada uno. Decisión consciente del usuario al elegir "Add h1 on the surface"; el lado limpio sería demorar el h1 del topbar a `<span>` o `aria-hidden`. Sigue siendo un follow-up; no se aborda aquí por estar fuera del scope acordado.
- **`formatBytes` duplicado en `upload-card.tsx`, `result-card.tsx` e `history-list.tsx`.** Cinco líneas cada uno. Consolidación a `src/lib/notas-credito/format.ts` queda fuera del scope acordado.
- **Objetos huérfanos en Storage.** Si el usuario cancela mid-upload o el conciliador falla, el objeto se queda en el bucket hasta que un job de limpieza lo retire. El servidor lo borra tras un éxito; tras un error lo conserva para debug y devuelve `storagePath`. Sin TTL ni cron configurado por ahora.
- **`SUPABASE_SERVICE_ROLE_KEY` debe estar en producción.** Sin la clave en el entorno de deploy, el endpoint `/api/notas-credito/upload-url` devuelve 500 con `upload_failed` y el flujo no avanza. Verificar antes de hacer deploy.
