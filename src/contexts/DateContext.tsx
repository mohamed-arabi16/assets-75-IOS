import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DateContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getMonthOptions: () => { value: string; label: string }[];
  getFilteredDate: () => { start: Date; end: Date };
  isCurrentMonth: () => boolean;
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem('selectedMonth') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('selectedMonth', selectedMonth);
  }, [selectedMonth]);

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Date' }];
    const currentDate = new Date();
    
    // Generate last 36 months
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
      isCurrentMonth
    }}>
      {children}
    </DateContext.Provider>
  );
};