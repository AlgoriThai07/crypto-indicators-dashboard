"use client";

import LiveBitcoinPrice from "@/components/LiveBitcoinPrice";
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";

export default function WebSocketTestPage() {
  const { price, change24h, isConnected, isCached, error, lastUpdate } =
    useLiveBitcoin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            WebSocket/SSE Test Page
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Live Bitcoin price streaming via Server-Sent Events
          </p>
        </header>

        {/* Live Bitcoin Price Widget */}
        <div className="mb-8">
          <LiveBitcoinPrice />
        </div>

        {/* Debug Information */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Debug Information
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Connection Status:
              </span>
              <span className={`font-bold ${
                isConnected 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {isConnected ? "✓ Connected" : "✗ Disconnected"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Current Price:
              </span>
              <span className="text-slate-900 dark:text-white font-bold">
                {price ? `$${price.toLocaleString()}` : "Loading..."}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                24h Change:
              </span>
              <span className={`font-bold ${
                change24h && change24h >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {change24h ? `${change24h.toFixed(2)}%` : "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Data Source:
              </span>
              <span className="text-slate-900 dark:text-white font-bold">
                {isCached ? "Cached" : "Fresh API"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Last Update:
              </span>
              <span className="text-slate-900 dark:text-white font-mono text-sm">
                {lastUpdate
                  ? new Date(lastUpdate).toLocaleTimeString()
                  : "N/A"}
              </span>
            </div>

            {error && (
              <div className="py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium block mb-2">
                  Error:
                </span>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <span className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            📡 Testing Instructions
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Watch the price update every 10 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Check connection status (should be green/connected)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Open browser DevTools → Network tab to see SSE stream</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Try disconnecting internet to test reconnection logic</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>View console logs for detailed connection info</span>
            </li>
          </ul>
        </div>

        {/* API Endpoint Info */}
        <div className="mt-6 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            🔌 API Endpoint
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Endpoint:
            </p>
            <p className="text-blue-600 dark:text-blue-400 mb-4">
              GET /api/socket
            </p>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Test in browser console:
            </p>
            <code className="text-green-600 dark:text-green-400 block whitespace-pre-wrap">
              {`const es = new EventSource('/api/socket');
es.onmessage = (e) => console.log(JSON.parse(e.data));`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
