export type Currency = 'GEL' | 'USD' | 'EUR';

/**
 * Approximate exchange rates with GEL as the base currency.
 * These are hardcoded fallback rates. In production, consider fetching
 * daily rates from a free API (e.g., exchangerate-api.com).
 */
const EXCHANGE_RATES: Record<Currency, number> = {
  GEL: 1,
  USD: 0.37,
  EUR: 0.34,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GEL: '₾',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  GEL: 'GEL (₾)',
  USD: 'USD ($)',
  EUR: 'EUR (€)',
};

export const SUPPORTED_CURRENCIES: Currency[] = ['GEL', 'USD', 'EUR'];

export const DEFAULT_CURRENCY: Currency = 'GEL';

/**
 * Convert an amount from one currency to another using approximate rates.
 */
export const convertCurrency = (
  amount: number,
  from: Currency,
  to: Currency
): number => {
  if (from === to) return amount;

  // Convert to GEL first (base), then to target
  const amountInGel = amount / EXCHANGE_RATES[from];
  return amountInGel * EXCHANGE_RATES[to];
};

/**
 * Format a number with thousand separators, stripping unnecessary decimals.
 */
const formatNumber = (value: number, maxDecimals: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
};

/**
 * Format a price in the display currency using our own symbol map.
 * If the display currency differs from the source currency,
 * the amount is converted automatically.
 */
export const formatDisplayPrice = (
  amount: number,
  sourceCurrency: string,
  displayCurrency: Currency
): string => {
  const source = (sourceCurrency || 'GEL') as Currency;
  const displayAmount = source !== displayCurrency
    ? convertCurrency(amount, source, displayCurrency)
    : amount;

  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const number = formatNumber(displayAmount, 0);

  return `${symbol}${number}`;
};
