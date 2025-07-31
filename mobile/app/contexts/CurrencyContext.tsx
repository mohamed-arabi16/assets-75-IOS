import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useExchangeRate } from '../hooks/useExchangeRate';

export type Currency = 'USD' | 'TRY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, fromCurrency?: Currency) => string;
  convertCurrency: (amount: number, fromCurrency: Currency) => number;
  exchangeRate: number;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(true);

  const { data: rates, error: ratesError, isLoading: ratesLoading } = useExchangeRate('USD');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user?.id) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_settings')
          .select('default_currency')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setCurrency(data.default_currency);
        }
        if (error) {
          console.error('Error fetching user settings:', error);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const exchangeRate = rates?.TRY ?? 0;

  const convertCurrency = (amount: number, fromCurrency: Currency): number => {
    if (ratesError || ratesLoading || !rates || !rates.TRY) {
      return amount;
    }
    if (fromCurrency === currency) return amount;

    if (fromCurrency === 'USD' && currency === 'TRY') {
      return amount * rates.TRY;
    } else if (fromCurrency === 'TRY' && currency === 'USD') {
      return amount / rates.TRY;
    }

    return amount;
  };

  const formatCurrency = (amount: number, fromCurrency: Currency = 'USD'): string => {
    const convertedAmount = convertCurrency(amount, fromCurrency);

    // Use a simpler formatting for React Native without relying on 'tr-TR' locale initially
    if (currency === 'USD') {
      return `$${convertedAmount.toFixed(0)}`;
    } else {
      return `₺${convertedAmount.toFixed(0)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatCurrency,
      convertCurrency,
      exchangeRate,
      isLoading: isLoading || ratesLoading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
