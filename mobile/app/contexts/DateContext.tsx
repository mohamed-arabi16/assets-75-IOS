import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DateContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getMonthOptions: () => { value: string; label: string }[];
  getFilteredDate: () => { start: Date; end: Date };
  isCurrentMonth: () => boolean;
  isLoading: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const useDate = () => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

interface DateProviderProps {
  children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load the selected month from AsyncStorage when the component mounts
  useEffect(() => {
    const loadSelectedMonth = async () => {
      try {
        const storedMonth = await AsyncStorage.getItem('selectedMonth');
        if (storedMonth !== null) {
          setSelectedMonth(storedMonth);
        }
      } catch (e) {
        console.error('Failed to load selected month from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedMonth();
  }, []);

  // Save the selected month to AsyncStorage whenever it changes
  useEffect(() => {
    const saveSelectedMonth = async () => {
      if (!isLoading) { // Don't save during initial load
        try {
          await AsyncStorage.setItem('selectedMonth', selectedMonth);
        } catch (e) {
          console.error('Failed to save selected month to storage', e);
        }
      }
    };

    saveSelectedMonth();
  }, [selectedMonth, isLoading]);

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Time' }];
    const currentDate = new Date();

    for (let i = 0; i < 36; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  };

  const getFilteredDate = () => {
    if (selectedMonth === 'all') {
      return { start: new Date(0), end: new Date() };
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const isCurrentMonth = () => {
    if (selectedMonth === 'all') return false;
    const now = new Date();
    const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === currentMonthValue;
  };

  return (
    <DateContext.Provider value={{
      selectedMonth,
      setSelectedMonth,
      getMonthOptions,
      getFilteredDate,
      isCurrentMonth,
      isLoading
    }}>
      {children}
    </DateContext.Provider>
  );
};
