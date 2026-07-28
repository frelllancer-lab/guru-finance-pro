import { Currency } from '../types';

export function getCurrencySymbol(curr: Currency): string {
  return curr === 'UAH' ? '₴' : '$';
}

export function convertAmount(
  amount: number,
  origCurrency: Currency,
  targetCurrency: Currency,
  exchangeRate: number
): number {
  if (origCurrency === targetCurrency) return amount;
  if (origCurrency === 'UAH' && targetCurrency === 'USD') return amount / exchangeRate;
  if (origCurrency === 'USD' && targetCurrency === 'UAH') return amount * exchangeRate;
  return amount;
}

export function formatCurrency(amount: number, curr: Currency, decimals = 0): string {
  const symbol = getCurrencySymbol(curr);
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${symbol}`;
}
