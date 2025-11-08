"use client";

import { useState } from "react";

export default function DiagnosticsPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sseStatus, setSSEStatus] = useState<string>("Not connected");
  const [sseMessages, setSSEMessages] = useState<any[]>([]);

  const testCoinGeckoAPI = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/test-bitcoin");
      const data = await response.json();
      setTestResult({ success: response.ok, ...data });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSSEConnection = () => {
    setSSEMessages([]);
    setSSEStatus("Connecting...");

    try {
      const eventSource = new EventSource("/api/socket");

      eventSource.onopen = () => {
        setSSEStatus("✅ Connected");
        setSSEMessages((prev) => [
          ...prev,
          {
            time: new Date().toISOString(),
            type: "connection",
            message: "Connected",
          },
        ]);
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setSSEMessages((prev) => [
          ...prev,
          { time: new Date().toISOString(), ...data },
        ]);
      };

      eventSource.onerror = (error) => {
        setSSEStatus("❌ Error");
        setSSEMessages((prev) => [
          ...prev,
          {
            time: new Date().toISOString(),
            type: "error",
            message: "Connection error",
          },
        ]);
      };

      // Auto-close after 30 seconds
      setTimeout(() => {
        eventSource.close();
        setSSEStatus("Closed (30s timeout)");
      }, 30000);
    } catch (error) {
      setSSEStatus("❌ Failed to connect");
      setSSEMessages((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          🔧 Diagnostics
        </h1>

        {/* Test CoinGecko API */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Test CoinGecko API
          </h2>

          <button
            onClick={testCoinGeckoAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {loading ? "Testing..." : "Test API Connection"}
          </button>

          {testResult && (
            <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {testResult.success ? "✅" : "❌"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testResult.success ? "Success" : "Failed"}
                </span>
              </div>
              <pre className="text-xs overflow-auto text-slate-700 dark:text-slate-300">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test SSE Connection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Test SSE Connection
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={testSSEConnection}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start SSE Test
            </button>
            <span className="text-slate-900 dark:text-white font-medium">
              Status: {sseStatus}
            </span>
          </div>

          {sseMessages.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-auto">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Messages Received:
              </h3>
              <div className="space-y-2">
                {sseMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {new Date(msg.time).toLocaleTimeString()}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          msg.type === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : msg.type === "price_update"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {msg.type}
                      </span>
                    </div>
                    <pre className="text-xs overflow-auto text-slate-700 dark:text-slate-300">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            📋 Troubleshooting Steps
          </h3>
          <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
            <li>Test CoinGecko API first to verify connectivity</li>
            <li>If API test fails, check your internet connection</li>
            <li>Check browser console for detailed error messages</li>
            <li>Check server terminal logs for API response details</li>
            <li>If rate-limited, wait a few minutes and try again</li>
            <li>
              Try accessing
              https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
              directly in browser
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
