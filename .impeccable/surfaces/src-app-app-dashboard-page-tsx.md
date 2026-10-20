---
version: 1
slug: "src-app-app-dashboard-page-tsx"
primary_target: "src/app/(app)/dashboard/page.tsx"
related_targets: ["src/components/inicio"]
---

# Surface brief — Inicio (dashboard)

<!-- impeccable:surface-brief 1 -->

## Scope and visitor mode

- **Surface:** `/dashboard` — la primera pantalla tras iniciar sesión.
- **Mode:** Operate. El visitante es un contador que entra a trabajar y necesita saber qué atender hoy y llegar a su proceso en un clic.
- **Out of scope:** la lógica de los procesos, primitives compartidos, `PRODUCT.md`, `DESIGN.md`.

## Audience, job, action

- **Audience:** contadores con roles `ingresos`, `conciliaciones` y/o `admin`; portátil 1366×768–1920×1080.
- **Job:** ver de un vistazo lo que necesita atención según sus roles y abrir el proceso correcto.
- **Proof/content:** solo cifras reales de Supabase (anticipos, cierre de comisiones, bancos por país, usuarios sin rol). Nada inventado: lo que no se puede saber (p. ej. si ya se exportaron los movimientos del mes) no aparece como pendiente.

## Direction contract

- **FORM:** "Pendientes primero" (seed:e9220422bc5d7f07, opción elegida por el usuario en la ronda de decisión). Composición de referencia: `.impeccable/mocks/decision/pendientes.html`.
- **Estructura:** saludo con la fecha → bandeja "Necesita atención" ordenada por urgencia (rojo, ámbar, azul), cada fila con su cifra y una acción → procesos agrupados por área como tarjetas con su cifra en vivo.
- **Mundo:** el sistema de DESIGN.md sin cambios (tres zonas, Plex Sans/Mono, radios 6/8, sombras sm).
- **Movimiento firma:** la barra de 3px de color de urgencia en cada fila de la bandeja + la entrada escalonada (`kpi-tile-stagger`).
- **Estados:** bandeja vacía = "Todo al día" en verde; dato que falla = la tarjeta sigue con un texto neutro, sin fila en la bandeja; sin roles = estado vacío actual.
