export function formatCurrency(value: string | number): string {
  if (typeof value === 'string') {
    // Remove any existing formatting
    const numericValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(numericValue);
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
