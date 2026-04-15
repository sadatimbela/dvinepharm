export function formatCurrency(value: number, currency = 'TZS'): string {
  return `${currency} ${Math.round(value).toLocaleString('en-US')}`;
}
