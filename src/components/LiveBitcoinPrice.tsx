"use client";

import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";

export default function LiveBitcoinPrice() {
  const {
    price,
    change24h,
    isConnected,
    isCached,
    error,
    lastUpdate,
    reconnect,
  } = useLiveBitcoin();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            {isConnected && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Live Bitcoin Price
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isCached && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-semibold">
              Cached
            </span>
          )}
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full font-semibold ${
              isConnected
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Price Display */}
      {price !== null ? (
        <div className="mb-4">
          <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 font-mono">
            $
            {price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          {change24h !== null && (
            <div
              className={`inline-flex items-center gap-2 text-lg font-semibold px-3 py-1 rounded-lg ${
                change24h >= 0
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <span>{change24h >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(change24h).toFixed(2)}%</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                24h
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                {error}
              </p>
              {!isConnected && (
                <button
                  onClick={reconnect}
                  className="mt-2 text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
                >
                  Reconnect Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="font-medium">Updates every 10 seconds</span>
          </div>
          {lastUpdate && (
            <span className="text-slate-500 dark:text-slate-500">
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
