---
version: 1
slug: "src-app-app-ingresos-calculo-comisiones-page-tsx"
primary_target: "src/app/(app)/ingresos/calculo-comisiones/page.tsx"
related_targets: ["src/components/calculo-comisiones/calculo-comisiones-page.tsx"]
---

# Cálculo de Comisiones

Mode: Operate. Contadores del área contable cierran el mes: registran comisiones causadas, facturación F93/F94 de NetSuite y el Informe Diferido; revisan el gasto por cohorte y llevan los asientos a NetSuite. Frecuencia: mensual, sesión larga de revisión. Dolor reportado: no se entiende el orden, números ilegibles, mal uso del espacio, demasiada información junta. Restricciones: precisión al centavo, distinción visible entre ingreso (azul) y gasto (verde), identidad del portal (DESIGN.md) intacta.

## Direction contract

THESIS: El cierre como un recorrido señalizado: una banda fija dice siempre la única acción siguiente y cuánto falta, y la página es una sola columna de pasos en orden. Rechaza la cuadrícula de tarjetas que compiten y el tablero de KPIs como primera pantalla.

OWN-WORLD: Mundo del portal Siigo (canvas gris frío, tarjetas blancas, IBM Plex Sans/Mono). La banda "Siguiente" es tinta oscura (#1F2733) con una etiqueta ámbar; el ámbar se reserva solo para señalizar el paso actual. Cifras clave en Plex Mono grande, tabulares. Pasos con círculo numerado: verde hecho, ámbar actual, gris pendiente.

STORY: El contador ve qué falta, lo completa sin buscar, y al final ve el gasto del mes, la tabla por cohorte separada en ingreso y gasto, y los asientos para copiar.

FIRST VIEWPORT: Encabezado con título y selector de periodo; debajo la banda sticky "Siguiente" a ancho completo con mensaje, progreso 4 segmentos y botón de acción; luego paso 1 a 4 en columna; los pasos hechos colapsan a una fila con su cifra y "Editar"; el actual abierto con borde ámbar.

FORM: Cierre señalizado (challenger competitivo, wayfinding-cartography-signage-terminal-yellow-wayfinding), elegido por el usuario. seed:9e34862c8205a164. Signature move: la banda que se re-señaliza tras cada paso.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
