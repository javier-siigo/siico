import { aPesos, periodoLabel, totalesAsiento, type CierreCalculo } from "./calculo";
import type { Control, ResultadoArchivo } from "./types";
import { escribirXlsx, type CeldaXlsx, type HojaXlsx } from "./xlsx-writer";

export interface ExportarOpciones {
  cierre: CierreCalculo;
  controles: Control[];
}

/** Centavos → celda en pesos. */
const money = (centavos: number): CeldaXlsx => ({ v: aPesos(centavos), fmt: "money" });
const moneyPesos = (v: number): CeldaXlsx => ({ v, fmt: "money" });
const pct = (v: number): CeldaXlsx => ({ v, fmt: "pct" });

const ESTADO_CONTROL: Record<Control["estado"], string> = {
  ok: "OK",
  warning: "Revisar",
  error: "Error",
  info: "Info",
};

const TIPO_DOC = { factura: "Factura", "nota-credito": "Nota crédito", ajuste: "Ajuste" } as const;

/** Libro del cierre: resumen por cohorte, asientos, conceptos, ingreso y documentos. */
export function construirExcel(
  r: ResultadoArchivo | null,
  { cierre, controles }: ExportarOpciones,
): Promise<ArrayBuffer> {
  const resumen: CeldaXlsx[][] = [
    ["Reconocimiento gasto de comisiones", periodoLabel(cierre.periodo)],
    ["Informe diferido", r?.archivoNombre ?? "Ingreso registrado"],
    [],
    ["Gasto de comisiones del mes", money(cierre.gastoMes)],
    ["  de ello, ajustes por cierre de cohorte", money(cierre.ajustesCierre)],
    ["Comisiones diferidas del mes", money(cierre.diferidoNuevo)],
    ["Saldo comisiones diferidas (17109501)", money(cierre.saldoDiferido)],
    [],
    ["% del mes = ingreso F93+F94 de la cohorte en el mes ÷ facturación neta F93+F94 de la cohorte"],
    ["Gasto del mes = comisiones de la cohorte × % del mes"],
    [],
    [
      "Cohorte",
      "Facturación neta F93+F94",
      "Ingreso F94 del mes",
      "Ingreso F93 del mes",
      "Ingreso F93+F94 del mes",
      "% del mes",
      "Comisiones",
      "Gasto del mes",
      "Ajuste de cierre",
      "Reconocido acumulado",
      "% acumulado",
      "Pendiente",
    ],
    ...cierre.cohortes.map((c) => [
      periodoLabel(c.cohorte),
      money(c.baseNeta),
      money(c.ingresoPorPrefijo.F94),
      money(c.ingresoPorPrefijo.F93),
      money(c.ingresoMes),
      pct(c.pctMes),
      money(c.comisiones),
      money(c.gastoMes),
      money(c.ajusteCierre),
      money(c.acumulado),
      pct(c.pctAcumulado),
      money(c.pendiente),
    ]),
    [
      "Total",
      null,
      null,
      null,
      money(cierre.cohortes.reduce((a, c) => a + c.ingresoMes, 0)),
      null,
      money(cierre.cohortes.reduce((a, c) => a + c.comisiones, 0)),
      money(cierre.gastoMes - cierre.ajustesCierre),
      money(cierre.ajustesCierre),
      money(cierre.cohortes.reduce((a, c) => a + c.acumulado, 0)),
      null,
      money(cierre.saldoDiferido),
    ],
    [],
    ["Control", "Estado", "Detalle"],
    ...controles.map((c) => [c.titulo, ESTADO_CONTROL[c.estado], c.detalle]),
  ];

  const asientos: CeldaXlsx[][] = [["Asiento", "Cuenta", "Nombre", "Débito", "Crédito"]];
  for (const a of cierre.asientos) {
    for (const l of a.lineas) {
      asientos.push([a.descripcion, l.cuenta, l.nombre, money(l.debito), money(l.credito)]);
    }
    const t = totalesAsiento(a);
    asientos.push([`Total ${a.descripcion}`, null, null, money(t.debito), money(t.credito)]);
    asientos.push([]);
  }

  const conceptos: CeldaXlsx[][] = [
    [
      "Cohorte",
      "Concepto",
      "Cuenta",
      "Comisiones",
      "Reconocido antes",
      "Gasto del mes",
      "Ajuste de cierre",
      "Reconocido acumulado",
      "Pendiente",
      "Nota",
    ],
  ];
  for (const c of cierre.cohortes) {
    for (const k of c.conceptos) {
      conceptos.push([
        periodoLabel(c.cohorte),
        k.nombre,
        k.cuenta,
        money(k.valor),
        money(k.previo),
        money(k.gastoMes),
        money(k.ajusteCierre),
        money(k.acumulado),
        money(k.pendiente),
        k.registrado ?? "",
      ]);
    }
  }

  const hojas: HojaXlsx[] = [
    { nombre: "Resumen", filas: resumen, anchos: [40, 22, 20, 20, 22, 12, 20, 20, 22, 12, 20] },
    { nombre: "Asientos", filas: asientos, anchos: [56, 12, 34, 20, 20] },
    { nombre: "Conceptos", filas: conceptos, anchos: [16, 32, 12, 20, 20, 20, 22, 20] },
  ];

  if (r) {
    const ingreso: CeldaXlsx[][] = [
      ["Cohorte", "Prefijo", "Facturas", "Notas crédito", "Ajustes", "Ingreso del mes", "Pendiente por diferir", "Líneas"],
      ...r.ingresos.map((i) => [
        i.cohorte,
        i.prefijo,
        moneyPesos(i.facturas),
        moneyPesos(i.notasCredito),
        moneyPesos(i.ajustes),
        moneyPesos(i.ingreso),
        moneyPesos(i.pendiente),
        i.lineas,
      ]),
    ];

    function* documentos(): Generator<CeldaXlsx[]> {
      yield [
        "Comprobante",
        "Doc. origen",
        "Tipo",
        "Prefijo",
        "Cohorte",
        "NIT",
        "Fecha factura",
        "Inicio reconocimiento",
        "Fin reconocimiento",
        "Plazo (meses)",
        "Total",
        "Cuota del mes",
        "Reconocido acumulado",
        "Pendiente por diferir",
      ];
      for (const d of r!.documentos) {
        yield [
          d.numero,
          d.origen,
          TIPO_DOC[d.tipo],
          d.prefijo,
          d.cohorte,
          d.nit,
          d.fechaFactura,
          d.inicio,
          d.fin,
          d.veces,
          moneyPesos(d.total),
          moneyPesos(d.cuota),
          moneyPesos(d.reconocido),
          moneyPesos(d.pendiente),
        ];
      }
    }

    hojas.push(
      { nombre: "Ingreso por cohorte", filas: ingreso, anchos: [10, 8, 20, 20, 20, 20, 10] },
      {
        nombre: "Documentos",
        filas: documentos(),
        anchos: [16, 16, 12, 8, 9, 14, 13, 13, 13, 9, 16, 16, 18, 18],
      },
    );
  }

  return escribirXlsx(hojas);
}
