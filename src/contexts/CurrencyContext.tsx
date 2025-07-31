import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useExchangeRate } from '@/hooks/useExchangeRate';

export type Currency = 'USD' | 'TRY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, fromCurrency?: Currency) => string;
  convertCurrency: (amount: number, fromCurrency: Currency) => number;
  exchangeRate: number;
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
  const { session } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');

  const { data: rates, error: ratesError, isLoading: ratesLoading } = useExchangeRate('USD');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('default_currency')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          setCurrency(data.default_currency);
        }
        if (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [session]);

  const exchangeRate = rates?.TRY ?? 0;

  const convertCurrency = (amount: number, fromCurrency: Currency): number => {
    if (ratesError || ratesLoading || !rates || !rates.TRY) {
      return amount; // Return original amount if rates aren't available
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
    
    if (currency === 'USD') {
      return `$${convertedAmount.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })}`;
    } else {
      return `₺${convertedAmount.toLocaleString('tr-TR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatCurrency, 
      convertCurrency, 
      exchangeRate 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};