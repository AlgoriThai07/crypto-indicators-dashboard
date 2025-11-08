import { NextResponse } from "next/server";
import axios from "axios";
import cache from "@/lib/cache";

// Environment variable for API key (optional)
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const CACHE_TTL = 120; // 120 seconds (within 60-120s requirement)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const CACHE_KEY = `history_${id}`;
  const STALE_CACHE_KEY = `history_${id}_stale`;

  try {
    // Check cache first - return cached data if available
    const cachedData = cache.get(CACHE_KEY);
    if (cachedData) {
      console.log(`[History API] Serving from cache for ${id} (TTL: 120s)`);
      return NextResponse.json(cachedData);
    }

    console.log(
      `[History API] Cache miss, fetching 30-day history for ${id}...`
    );

    // Build API URL with optional API key
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30`;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add API key if available
    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }

    const response = await axios.get(url, {
      timeout: 10000,
      headers,
    });

    // Return prices in the format: { prices: [ [timestamp, price], ... ] }
    const result = {
      prices: response.data.prices,
    };

    // Store in both caches
    cache.set(CACHE_KEY, result, CACHE_TTL); // Normal cache with 120s TTL
    cache.set(STALE_CACHE_KEY, result, 0); // Stale cache (no expiry)

    console.log(`[History API] Successfully fetched and cached data for ${id}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching history for ${id}:`, error);

    // Try to serve stale data if available
    const staleData = cache.get(STALE_CACHE_KEY);
    if (staleData) {
      console.log(`[History API] Serving stale data for ${id} due to error`);
      return NextResponse.json(staleData);
    }

    // Handle rate limiting
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
