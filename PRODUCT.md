# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, `src/`, TypeScript estricto), Tailwind CSS v4, shadcn/ui, lucide-react, next-themes. Supabase para autenticación, base de datos y storage. n8n como orquestador de automatizaciones accesible únicamente desde el servidor. Validación con zod, formularios con react-hook-form.

## Users

Contadores del área contable de Siigo. Operan principalmente desde portátiles con resoluciones entre 1366×768 y 1920×1080. Su trabajo diario consiste en disparar, supervisar y auditar automatizaciones contables (conciliaciones, cierres, reportes, procesamiento de documentos).

## Product Purpose

Centralizar las automatizaciones contables en un único portal web que permita a los contadores ejecutar flujos desde n8n, consultar el historial de ejecuciones y monitorear el estado de los procesos sin tener que entrar al panel de n8n directamente.

## Positioning

Una capa de gobierno y operación sobre n8n con autenticación corporativa, historial auditable y catálogo curado de automatizaciones contables, en lugar de exponer el panel técnico de n8n a usuarios de negocio.

## Operating Context

Uso intensivo en jornada laboral, principalmente en escritorios con pantallas de portátil. Lectura frecuente de tablas y estados. Necesidad de feedback inmediato cuando se dispara una automatización (éxito, error, duración). Idioma: español.

## Capabilities and Constraints

- Autenticación con email y contraseña contra Supabase.
- Catálogo navegable de automatizaciones registradas.
- Historial de ejecuciones por automatización y por usuario.
- Disparo de automatizaciones vía n8n sin exponer secretos al cliente.
- Tema claro y oscuro.
- Sin dependencias de base de datos o esquemas definidos en esta fase.

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
