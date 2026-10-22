/**
 * Tipo de documento (`t.type`) en el filtro de lista.
 *
 * Todos los tipos personalizados comparten `t.type = 'Custom'`, así que se
 * distinguen por `t.recordtype` (`customtransaction_…`). Los estándar se
 * filtran por su código de `t.type`, el mismo de la columna "Código Tipo".
 */
import type { CampoCatalogo } from "./campos";

export const PREFIJO_PERSONALIZADO = "customtransaction_";

export function esCampoTipo(c: Pick<CampoCatalogo, "tabla" | "campo">): boolean {
  return c.tabla === "t" && c.campo === "type";
}

export function esTipoPersonalizado(v: string): boolean {
  return v.startsWith(PREFIJO_PERSONALIZADO);
}

/** Tipos estándar de NetSuite con el nombre que muestra la cuenta. */
export const TIPOS_ESTANDAR: { v: string; l: string }[] = [
  { v: "InvAdjst", l: "Ajuste de inventario" },
  { v: "DepAppl", l: "Aplicación de depósito" },
  { v: "Check", l: "Cheque" },
  { v: "PurchCon", l: "Contrato de compra" },
  { v: "FinChrg", l: "Costo financiero" },
  { v: "VendCred", l: "Crédito de factura" },
  { v: "CustDep", l: "Depósito de cliente" },
  { v: "Journal", l: "Diario" },
  { v: "PEJrnl", l: "Diario de finalización del período" },
  { v: "SysJrnl", l: "Diario del sistema" },
  { v: "RevArrng", l: "Disposición de ingresos" },
  { v: "InvDistr", l: "Distribución de inventario" },
  { v: "ItemShip", l: "Ejecución de pedido de artículo" },
  { v: "VendBill", l: "Factura de compra" },
  { v: "CustInvc", l: "Factura de venta" },
  { v: "CustCred", l: "Nota de crédito" },
  { v: "PurchOrd", l: "Orden de compra" },
  { v: "SalesOrd", l: "Orden de venta" },
  { v: "BlankOrd", l: "Orden general de compra" },
  { v: "CustPymt", l: "Pago" },
  { v: "VPrep", l: "Pago anticipado al proveedor" },
  { v: "VendPymt", l: "Pago de factura" },
  { v: "ItemRcpt", l: "Recepción de artículo" },
  { v: "CashRfnd", l: "Reembolso de efectivo" },
  { v: "FxReval", l: "Revaluación de moneda" },
  { v: "PurchReq", l: "Solicitud" },
  { v: "InvTrnfr", l: "Traslado de inventario" },
  { v: "CashSale", l: "Venta de Contado" },
  { v: "ExpRept", l: "Viáticos / Legalización" },
];

/**
 * Nombres de tipos personalizados sin transacciones: NetSuite no los expone
 * por API, solo el id del registro.
 */
export const NOMBRES_PERSONALIZADOS: Record<string, string> = {
  customtransaction_l598_anul_resguardo: "URU-Anulacion Resguardo",
};
