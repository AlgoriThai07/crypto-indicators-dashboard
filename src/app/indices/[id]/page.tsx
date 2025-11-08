"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ChartView from "@/components/ChartView";

interface ChartData {
  date: string;
  price: number;
}

interface CoinInfo {
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
}

export default function IndicatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both current data and historical data in parallel
        const [indicesRes, historyRes] = await Promise.all([
          fetch("/api/indices"),
          fetch(`/api/indices/${id}/history`),
        ]);

        if (!indicesRes.ok || !historyRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const indicesData = await indicesRes.json();
        const historyData = await historyRes.json();

        // Find the current coin data
        const currentCoin = indicesData.data.find(
          (coin: any) => coin.id === id
        );

        if (currentCoin) {
          setCoinInfo({
            name: currentCoin.name,
            symbol: currentCoin.symbol.toUpperCase(),
            image: currentCoin.image,
            currentPrice: currentCoin.current_price,
            priceChange24h: currentCoin.price_change_percentage_24h,
            marketCap: currentCoin.market_cap,
            volume24h: currentCoin.total_volume,
          });
        }

        // API returns { prices: [ [timestamp, price], ... ] }
        const prices: [number, number][] = historyData.prices;

        // Map timestamps to formatted date strings (Nov 07, 2025) and store as { date, price }[]
        const formattedData = prices.map(([timestamp, price]) => {
          const date = new Date(timestamp);
          const month = date.toLocaleString("en-US", { month: "short" });
          const day = date.getDate().toString().padStart(2, "0");
          const year = date.getFullYear();
          return {
            date: `${month} ${day}, ${year}`,
            price: price,
          };
        });

        setChartData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Loading chart data...
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
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate 30-day change
  const thirtyDayChange =
    chartData.length > 0
      ? ((chartData[chartData.length - 1].price - chartData[0].price) /
          chartData[0].price) *
        100
      : 0;

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back to dashboard button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>

        {/* Coin Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Coin Info */}
            <div className="flex items-center gap-4">
              {coinInfo && (
                <>
                  <Image
                    src={coinInfo.image}
                    alt={`${coinInfo.name} logo`}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                      {coinInfo.name}
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      {coinInfo.symbol}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right: Price Info */}
            {coinInfo && (
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                  $
                  {coinInfo.currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`inline-flex items-center gap-2 text-lg font-semibold px-3 py-1 rounded-lg ${
                    coinInfo.priceChange24h >= 0
                      ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                      : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <span>{coinInfo.priceChange24h >= 0 ? "↑" : "↓"}</span>
                  <span>{Math.abs(coinInfo.priceChange24h).toFixed(2)}%</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    24h
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {coinInfo && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Market Cap
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  ${(coinInfo.marketCap / 1e9).toFixed(2)}B
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  24h Volume
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  ${(coinInfo.volume24h / 1e9).toFixed(2)}B
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  30-Day Change
                </p>
                <p
                  className={`text-lg font-bold ${
                    thirtyDayChange >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {thirtyDayChange >= 0 ? "+" : ""}
                  {thirtyDayChange.toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            30-Day Price History
          </h2>
          <ChartView data={chartData} />
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                Data Source
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                All price data is provided by CoinGecko API with 2-minute
                caching for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
