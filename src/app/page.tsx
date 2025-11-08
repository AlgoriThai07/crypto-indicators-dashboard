import IndicatorCard from "@/components/IndicatorCard";
import type { CryptoIndex } from "@/types/crypto";

async function getIndices() {
  // Use absolute URL only in production, relative URL won't work for SSR
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";
  
  const res = await fetch(`${baseUrl}/api/indices`, {
    next: { revalidate: 90 }, // Revalidate every 90 seconds
  });

  if (!res.ok) {
    throw new Error("Failed to fetch indices");
  }

  return res.json();
}

export default async function Home() {
  const response = await getIndices();
  const indices: CryptoIndex[] = response.data;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Crypto Indicators Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Real-time cryptocurrency market data with 30-day historical charts
          </p>
          {response.cached && !response.stale && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              📊 Cached data • Updates every 2 minutes
            </p>
          )}
          {response.stale && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ {response.message || "Using cached data due to API rate limit"}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {indices.map((index) => (
            <IndicatorCard
              key={index.id}
              id={index.id}
              name={index.name}
              symbol={index.symbol}
              image={index.image}
              price={index.current_price}
              change24h={index.price_change_percentage_24h}
            />
          ))}
        </div>

        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Data provided by CoinGecko API</p>
          <p className="mt-1">
            Last updated: {new Date(response.timestamp).toLocaleString()}
          </p>
        </footer>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
