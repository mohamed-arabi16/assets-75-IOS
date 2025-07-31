import { useMemo } from 'react';
import { useDate } from '@/contexts/DateContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFilteredData = <T extends { [key: string]: any }>(
  data: T[],
  dateKey = 'date'
) => {
  const { selectedMonth } = useDate();

  const filteredData = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') return data;

    const [year, month] = selectedMonth.split('-');
    return data.filter(item => {
      if (!item[dateKey]) return false;
      const itemDate = new Date(item[dateKey]);
      const itemYear = itemDate.getFullYear().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');

      return itemYear === year && itemMonth === month;
    });
  }, [data, selectedMonth, dateKey]);

  return filteredData;
};

export const useMonthlyStats = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { amount: number; [key: string]: any }
>(
  data: T[],
  filterFn?: (item: T) => boolean,
  dateKey = 'date'
) => {
  const { selectedMonth } = useDate();

  const stats = useMemo(() => {
    let filteredData = data;

    if (selectedMonth && selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-');
      filteredData = data.filter(item => {
        if (!item[dateKey]) return false;
        const itemDate = new Date(item[dateKey]);
        const itemYear = itemDate.getFullYear().toString();
        const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');

        return itemYear === year && itemMonth === month;
      });
    }

    if (filterFn) {
      filteredData = filteredData.filter(filterFn);
    }

    const total = filteredData.reduce((sum, item) => sum + item.amount, 0);
    const count = filteredData.length;
    const average = count > 0 ? total / count : 0;

    return { total, count, average, items: filteredData };
  }, [data, selectedMonth, filterFn, dateKey]);

  return stats;
};