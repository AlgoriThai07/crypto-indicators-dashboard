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

export default function Dashboard() {
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
          throw new Error(errorData.error || "Failed to fetch crypto indicators");
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Loading crypto indicators...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Crypto Indicators Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time cryptocurrency market data
          </p>
        </header>

        {/* Live Bitcoin Price Widget */}
        <div className="mb-8">
          <LiveBitcoinPrice />
        </div>

        {/* Grid of IndicatorCard components (2-3 per row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Empty state */}
        {indicators.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No crypto indicators available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
