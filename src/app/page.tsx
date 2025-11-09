"use client";

import { useEffect, useState } from "react";
import IndicatorCard from "@/components/IndicatorCard";
import LiveBitcoinPrice from "@/components/LiveBitcoinPrice";

interface CryptoIndicator {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function Home() {
  const [indicators, setIndicators] = useState<CryptoIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIndicators() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/indices");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch crypto indicators"
          );
        }

        const result = await response.json();

        // Even if data is stale, still show it
        if (result.data && result.data.length > 0) {
          setIndicators(result.data);
          if (result.stale) {
            setError(result.message || "Using cached data");
          }
        } else {
          throw new Error("No data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchIndicators();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Loading crypto indicators...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && indicators.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main page
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Crypto Indicators Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Real-time cryptocurrency market data with 30-day historical charts
          </p>
          {error && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ {error}
            </p>
          )}
        </header>

        {/* Live Bitcoin Price Widget */}
        <div className="mb-8">
          <LiveBitcoinPrice />
        </div>

        {/* Grid of IndicatorCard components */}
        {indicators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">
              No crypto indicators available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {indicators.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                id={indicator.id}
                name={indicator.name}
                symbol={indicator.symbol}
                image={indicator.image}
                price={indicator.current_price}
                change24h={indicator.price_change_percentage_24h}
              />
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Data provided by CoinGecko API</p>
        </footer>
      </div>
    </main>
  );
}
