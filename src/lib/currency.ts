export function formatCurrency(value: string | number): string {
  if (typeof value === 'string') {
    // Remove currency symbol and spaces
    const cleaned = value.replace(/[R$\s]/g, '');
    // Handle Brazilian format: remove thousand separators (dots) and replace decimal comma
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  // Remove currency symbol and spaces
  const cleaned = value.replace(/[R$\s]/g, '');
  // Handle Brazilian format: remove thousand separators (dots) and replace decimal comma
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

export function parseCurrencyInput(value: string): string {
  // Remove non-numeric characters except comma and dot
  const cleaned = value.replace(/[^\d,]/g, '');
  return cleaned;
}

export function formatCurrencyInput(value: string): string {
  // Format as currency while typing
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  
  const num = parseInt(numericValue, 10) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}
