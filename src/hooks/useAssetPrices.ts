import { useState, useEffect } from 'react';

interface AssetPrices {
  bitcoin?: number;
  ethereum?: number;
  cardano?: number;
  gold?: number;
  silver?: number;
  error?: string;
}

const MOCK_GOLD_PRICE = 2300; // Mock price per ounce
const MOCK_SILVER_PRICE = 28; // Mock price per ounce

export const useAssetPrices = () => {
  const [prices, setPrices] = useState<AssetPrices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssetPrices = async () => {
      setLoading(true);
      try {
        // Fetch crypto prices from CoinGecko
        const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd');
        if (!cryptoResponse.ok) {
          throw new Error(`Crypto API request failed with status ${cryptoResponse.status}`);
        }
        const cryptoData = await cryptoResponse.json();

        // Fetch metal prices from metalpriceapi.com
        const apiKey = import.meta.env.VITE_METALPRICEAPI_API_KEY;
        if (!apiKey) {
          throw new Error('MetalpriceAPI key is not set in the environment variables.');
        }
        const metalResponse = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG`);
        if (!metalResponse.ok) {
          throw new Error(`Metal API request failed with status ${metalResponse.status}`);
        }
        const metalData = await metalResponse.json();

        if (!metalData.success) {
          throw new Error(`Metal API returned an error: ${metalData.error?.info}`);
        }

        setPrices({
          bitcoin: cryptoData.bitcoin?.usd,
          ethereum: cryptoData.ethereum?.usd,
          cardano: cryptoData.cardano?.usd,
          gold: metalData.rates?.USDXAU,
          silver: metalData.rates?.USDXAG,
        });

      } catch (error) {
        if (error instanceof Error) {
          console.error('Failed to fetch asset prices:', error.message);
          setPrices({
            // Still provide mock prices even if crypto API fails, as per original design
            gold: MOCK_GOLD_PRICE,
            silver: MOCK_SILVER_PRICE,
            error: 'Failed to fetch some prices. Displayed values may be outdated or estimates.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssetPrices();

    // Refresh prices every minute
    const interval = setInterval(fetchAssetPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
};
