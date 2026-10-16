import { aPesos, periodoLabel, totalesAsiento, type CierreCalculo } from "./calculo";
import type { Control, ResultadoArchivo } from "./types";

const nf = new Intl.NumberFormat("es-CO");
const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pesos = (centavos: number) => money.format(aPesos(centavos));
const lista = (xs: string[]) =>
  xs.length <= 3 ? xs.join(", ") : `${xs.slice(0, 3).join(", ")} y ${xs.length - 3} más`;

/**
 * Validaciones del cierre. Los controles en "error" impiden guardar: el
 * resultado no sería correcto.
 */
export function construirControles(
  cierre: CierreCalculo,
  archivo: ResultadoArchivo | null,
): Control[] {
  const c: Control[] = [];
  const { periodo } = cierre;
  const propia = cierre.cohortes.find((k) => k.esPropia);

  if (archivo) {
    if (archivo.periodoDetectado && archivo.periodoDetectado !== periodo) {
      c.push({
        id: "periodo",
        titulo: "Periodo del archivo",
        detalle: `El informe es de ${periodoLabel(archivo.periodoDetectado)} y el cierre es de ${periodoLabel(periodo)}.`,
        estado: "error",
      });
    } else {
      c.push({
        id: "periodo",
        titulo: "Periodo del archivo",
        detalle: archivo.periodoDetectado
          ? `FECHA_DIFERIDO corresponde a ${periodoLabel(periodo)}.`
          : "El archivo no trae FECHA_DIFERIDO; confirma que sea el informe del mes.",
        estado: archivo.periodoDetectado ? (archivo.periodosMezclados ? "warning" : "ok") : "warning",
      });
    }
    if (archivo.periodosMezclados) {
      c.push({
        id: "periodos-mezclados",
        titulo: "Varios meses en el archivo",
        detalle: "FECHA_DIFERIDO tiene más de un mes; se toma el más reciente.",
        estado: "warning",
      });
    }
    if (!archivo.usaDocOrigen) {
      c.push({
        id: "doc-origen",
        titulo: "Sin columna DOC ORIGEN",
        detalle:
          "Se clasificó por NO COMPROBANTE: las notas crédito y los ajustes no se asocian a su factura y el ingreso puede no cuadrar.",
        estado: "warning",
      });
    }
    if (archivo.sinFecha.lineas > 0) {
      c.push({
        id: "sin-fecha",
        titulo: "Líneas sin FECHAFACTURA",
        detalle: `${nf.format(archivo.sinFecha.lineas)} líneas F93/F94 (${money.format(archivo.sinFecha.cuota)} de cuota) no se pueden asignar a una cohorte.`,
        estado: "error",
      });
    }
    if (archivo.descuadresSaldo > 0) {
      c.push({
        id: "saldo",
        titulo: "Reconocido + pendiente = Total",
        detalle: `${nf.format(archivo.descuadresSaldo)} líneas no cuadran (tolerancia $1).`,
        estado: "warning",
      });
    }
  }

  if (!propia || propia.comisiones === 0) {
    c.push({
      id: "comisiones-mes",
      titulo: "Comisiones del mes",
      detalle: `Faltan las comisiones causadas en ${periodoLabel(periodo)}.`,
      estado: "error",
    });
  }
  if (!propia || propia.baseNeta <= 0) {
    c.push({
      id: "base-mes",
      titulo: "Facturación del mes",
      detalle: `Falta la facturación neta F93/F94 de ${periodoLabel(periodo)} (facturas − notas crédito).`,
      estado: "error",
    });
  }

  const sinBase = cierre.cohortes.filter((k) => !k.esPropia && k.alertas.includes("sin-base"));
  if (sinBase.length > 0) {
    c.push({
      id: "sin-base",
      titulo: "Cohortes sin facturación",
      detalle: `${lista(sinBase.map((k) => periodoLabel(k.cohorte)))}: sin facturación neta no se puede calcular el %.`,
      estado: "error",
    });
  }

  const sinCuenta = new Set<string>();
  for (const k of cierre.cohortes) {
    for (const x of k.conceptos) if (!x.cuenta) sinCuenta.add(x.nombre);
  }
  if (sinCuenta.size > 0) {
    c.push({
      id: "sin-cuenta",
      titulo: "Conceptos sin cuenta contable",
      detalle: `${lista([...sinCuenta])} no tienen cuenta; los asientos quedarían incompletos.`,
      estado: "error",
    });
  }

  const difiere = cierre.cohortes.filter((k) => k.ingresoRegistrado !== null);
  if (difiere.length > 0) {
    c.push({
      id: "difiere",
      titulo: "Ingreso distinto al registrado",
      detalle: difiere
        .map(
          (k) =>
            `${periodoLabel(k.cohorte)}: informe ${pesos(k.ingresoMes)}, registrado ${pesos(k.ingresoRegistrado!)}`,
        )
        .join(" · "),
      estado: "warning",
    });
  }

  const topadas = cierre.cohortes.filter(
    (k) => k.alertas.includes("tope") && k.gastoMes !== 0 && k.pendiente === 0,
  );
  if (topadas.length > 0) {
    c.push({
      id: "tope",
      titulo: "Cohortes que cierran este mes",
      detalle: `${lista(topadas.map((k) => periodoLabel(k.cohorte)))}: el % acumulado llega al 100 %; se registra solo el saldo pendiente y la cohorte queda en cero.`,
      estado: "info",
    });
  }

  const cerradas = cierre.cohortes.filter((k) => k.ajusteCierre !== 0);
  if (cerradas.length > 0) {
    c.push({
      id: "cierre",
      titulo: "Ajuste por cierre de cohorte",
      detalle: `${cerradas
        .map((k) => `${periodoLabel(k.cohorte)} ${pesos(k.ajusteCierre)}`)
        .join(" · ")}: sus facturas ya no tienen ingreso por diferir y la comisión que seguía diferida se lleva al gasto en un asiento aparte. Revisa el soporte antes de registrarlo.`,
      estado: "warning",
    });
  }

  const sinIngreso = cierre.cohortes.filter((k) => k.alertas.includes("sin-ingreso"));
  if (sinIngreso.length > 0) {
    c.push({
      id: "sin-ingreso",
      titulo: "Cohortes sin ingreso en el mes",
      detalle: `${lista(sinIngreso.map((k) => periodoLabel(k.cohorte)))} aún tienen comisión diferida pero el informe no trae ingreso de sus facturas. Si sus facturas ya terminaron, el saldo debe cerrarse con un ajuste.`,
      estado: "warning",
    });
  }

  const pequenas = cierre.cohortes.filter(
    (k) => !k.esPropia && k.pendiente > 0 && k.pendiente < k.gastoMes,
  );
  if (pequenas.length > 0) {
    c.push({
      id: "proximo-cierre",
      titulo: "Cohortes que cierran el próximo mes",
      detalle: `${lista(pequenas.map((k) => periodoLabel(k.cohorte)))}: el saldo diferido es menor que el gasto de este mes; el próximo mes se registrará solo el saldo.`,
      estado: "info",
    });
  }

  const negativas = cierre.cohortes.filter((k) => k.alertas.includes("ingreso-negativo"));
  if (negativas.length > 0) {
    c.push({
      id: "negativo",
      titulo: "Ingreso negativo",
      detalle: `${lista(negativas.map((k) => periodoLabel(k.cohorte)))}: las notas crédito superan el ingreso; el gasto del mes sale negativo (reversa).`,
      estado: "warning",
    });
  }

  const descuadrados = cierre.asientos.filter((a) => {
    const t = totalesAsiento(a);
    return t.debito !== t.credito;
  });
  c.push({
    id: "asientos",
    titulo: "Asientos cuadrados",
    detalle:
      descuadrados.length === 0
        ? `${nf.format(cierre.asientos.length)} asientos con débitos = créditos.`
        : `${nf.format(descuadrados.length)} asientos no cuadran.`,
    estado: descuadrados.length === 0 ? "ok" : "error",
  });

  if (cierre.sinSeguimiento.length > 0) {
    const total = cierre.sinSeguimiento.reduce((a, s) => a + s.ingreso, 0);
    c.push({
      id: "sin-seguimiento",
      titulo: "Ingreso de cohortes sin comisiones",
      detalle: `${pesos(total)} de ingreso F93/F94 corresponde a facturas de meses sin comisiones registradas (${lista(
        cierre.sinSeguimiento.map((s) => s.cohorte),
      )}); no genera gasto.`,
      estado: "info",
    });
  }

  if (archivo && archivo.excluidas.length > 0) {
    const lineas = archivo.excluidas.reduce((a, e) => a + e.lineas, 0);
    c.push({
      id: "excluidas",
      titulo: "Líneas que no son base",
      detalle: `${nf.format(lineas)} líneas con DOC ORIGEN ${lista(archivo.excluidas.map((e) => e.prefijo))} no entran al cálculo.`,
      estado: "info",
    });
  }

  return c;
}
