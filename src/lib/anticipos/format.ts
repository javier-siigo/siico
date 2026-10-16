const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const CEDULA_FORMATTER = new Intl.NumberFormat("es-CO");

export function formatAnticipoCurrency(value: number | null | undefined): string | null {
  if (value == null) return null;
  return CURRENCY_FORMATTER.format(value);
}

export function formatAnticipoCedula(value: number): string {
  return CEDULA_FORMATTER.format(value);
}
