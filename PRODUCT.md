# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, `src/`, TypeScript estricto), Tailwind CSS v4, shadcn/ui, lucide-react, next-themes. Supabase para autenticación, base de datos y storage. n8n como orquestador de automatizaciones accesible únicamente desde el servidor. Validación con zod, formularios con react-hook-form.

## Users

Contadores del área contable de Siigo. Operan principalmente desde portátiles con resoluciones entre 1366×768 y 1920×1080. Su trabajo diario consiste en disparar, supervisar y auditar automatizaciones contables (conciliaciones, cierres, reportes, procesamiento de documentos).

## Product Purpose

Centralizar en un único portal web las automatizaciones contables ejecutables vía n8n y las vistas de datos contables consultables (anticipos, ingresos), permitiendo a los contadores ejecutar flujos, consultar el historial de ejecuciones y operar sobre los datos desde un único punto, sin entrar al panel técnico de n8n.

## Positioning

Una capa de gobierno y operación que combina automatización (n8n) y vistas de datos curadas (anticipos, ingresos) con autenticación corporativa e historial auditable, en lugar de exponer el panel técnico de n8n a usuarios de negocio ni fragmentar la operación contable entre múltiples herramientas.

## Operating Context

Uso intensivo en jornada laboral, principalmente en escritorios con pantallas de portátil. Lectura frecuente de tablas y estados, tanto al consultar el catálogo de automatizaciones como al operar sobre vistas de datos (anticipos, ingresos). Necesidad de feedback inmediato cuando se dispara una automatización (éxito, error, duración). Idioma: español.

## Capabilities and Constraints

- Autenticación con email y contraseña contra Supabase.
- Catálogo navegable de automatizaciones registradas.
- Historial de ejecuciones por automatización y por usuario.
- Disparo de automatizaciones vía n8n sin exponer secretos al cliente.
- Vistas de datos contables consultables (anticipos, ingresos) con creación, edición y eliminación; conviven con el catálogo de automatizaciones pero no dependen de flujos n8n.
- Tema claro y oscuro.
- Tablas de Supabase para automatizaciones y ejecuciones aún no definidas (decisión abierta en esta fase).

## Brand Commitments

Producto interno de Siigo; estética sobria, profesional y orientada a densidad de información. Sin uso de gradientes llamativos, glassmorphism decorativo ni tipografías display en UI. Lenguaje de UI en español.

## Evidence on Hand

No hay assets de marca entregados en esta fase. La marca Siigo no se replica visualmente; el portal usa su propio lenguaje sobrio alineado con el modo "Operate" de impecable.

## Product Principles

- Densidad legible antes que respiración excesiva.
- Estados explícitos (cargando, error, vacío, éxito) en cada vista.
- Secretos y webhooks invisibles para el cliente.
- Consistencia visual entre todas las superficies autenticadas.

## Accessibility & Inclusion

Contraste mínimo WCAG AA en texto y elementos interactivos. Estados focus visibles. Navegación completa por teclado en formularios y menús.
