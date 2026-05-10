import { parseCurrencyToNumber, formatCurrency } from "./currency";

/**
 * Calcula o número de meses entre duas datas
 */
export function calculateMonthsBetween(startDate: string, endDate: string): number {
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    
    // Try ISO format
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > 0) return parsed;
    } catch {}
    
    return null;
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) return 0;
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  // Se a data de término é no mesmo mês ou depois, conta esse mês também
  return Math.max(0, months + 1);
}

/**
 * Calcula o valor total de recorrência projetado até uma data final
 */
export function calculateRecurrenceTotal(
  monthlyValue: string,
  startDate: string,
  endDate: string
): number {
  if (!monthlyValue || !startDate || !endDate) return 0;
  
  const months = calculateMonthsBetween(startDate, endDate);
  const monthlyAmount = parseCurrencyToNumber(monthlyValue);
  
  return months * monthlyAmount;
}

/**
 * Formata o valor de recorrência calculado
 */
export function formatRecurrenceTotal(
  monthlyValue: string,
  startDate: string,
  endDate: string
): string {
  const total = calculateRecurrenceTotal(monthlyValue, startDate, endDate);
  return formatCurrency(total);
}
