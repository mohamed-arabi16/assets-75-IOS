import { useQuery } from '@tanstack/react-query';

const fetchExchangeRates = async (baseCurrency: string) => {
  // Using a free, public API. In a real-world app, this would be a more robust, authenticated service.
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
  if (!response.ok) {
    // A real app should have better error handling and logging.
    // For this case, we'll throw an error which React Query will catch.
    throw new Error('Failed to fetch exchange rates.');
  }
  const data = await response.json();
  // We can add validation here (e.g., with Zod) to ensure the API response is what we expect.
  return data.rates as Record<string, number>;
};

export const useExchangeRate = (baseCurrency: string = 'USD') => {
  return useQuery({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: () => fetchExchangeRates(baseCurrency),
    // Cache the data for 1 hour to avoid excessive API calls.
    staleTime: 1000 * 60 * 60,
    // These options prevent refetching on window focus or component mount if data is not stale.
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Keep the data in cache for 24 hours.
    gcTime: 1000 * 60 * 60 * 24,
  });
};
