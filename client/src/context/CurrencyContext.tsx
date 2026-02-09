'use client';

import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  formatDisplayPrice,
  DEFAULT_CURRENCY,
} from '@/lib/utils/currency';
import type { Currency } from '@/lib/utils/currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number, sourceCurrency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [currency, setCurrency] = useLocalStorage<Currency>('preferredCurrency', DEFAULT_CURRENCY);

  const formatPrice = useCallback(
    (amount: number, sourceCurrency: string): string => {
      return formatDisplayPrice(amount, sourceCurrency, currency);
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
