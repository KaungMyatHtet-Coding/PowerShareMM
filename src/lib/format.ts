/** Format a number as Myanmar Kyat (MMK) with thousands separators. */
export function formatMMK(value: number): string {
  return `${value.toLocaleString('en-US')} MMK`;
}

/** Format a decimal as a percentage string. */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/** Format a kWh value. */
export function formatKWh(value: number): string {
  return `${value} kWh`;
}
