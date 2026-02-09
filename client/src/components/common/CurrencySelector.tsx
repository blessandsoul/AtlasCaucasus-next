'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
} from '@/lib/utils/currency';
import type { Currency } from '@/lib/utils/currency';

export const CurrencySelector = (): React.ReactElement => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (c: Currency): void => {
    setCurrency(c);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        className="h-9 px-2 rounded-md text-sm font-semibold tabular-nums"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select currency"
      >
        {CURRENCY_SYMBOLS[currency]}
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-20 bg-background rounded-md shadow-lg border overflow-hidden z-50 flex flex-col p-1 gap-0.5"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={cn(
                'w-full h-8 flex items-center justify-center gap-1.5 rounded-sm text-xs font-medium transition-colors',
                c === currency
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-label={c}
            >
              <span className="font-semibold">{CURRENCY_SYMBOLS[c]}</span>
              <span>{c}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
