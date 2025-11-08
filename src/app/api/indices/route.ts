import { NextResponse } from "next/server";
import axios from "axios";
import cache from "@/lib/cache";
import type { CryptoIndex } from "@/types/crypto";

// Environment variables for API key (optional for free tier)
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// Build API URL with optional API key
const buildApiUrl = () => {
  const baseUrl = "https://api.coingecko.com/api/v3/coins/markets";
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "15",
    page: "1",
  });

  // Add API key if available (for Pro/Enterprise tier)
  if (COINGECKO_API_KEY) {
    params.append("x_cg_pro_api_key", COINGECKO_API_KEY);
  }

  return `${baseUrl}?${params.toString()}`;
};

const COINGECKO_API_URL = buildApiUrl();
const CACHE_KEY = "crypto_indices";
const CACHE_TTL = 120; // 120 seconds (2 minutes) - within 60-120s requirement
const STALE_CACHE_KEY = "crypto_indices_stale"; // Backup cache that never expires

// Rate limiting tracking (20 req/min = 1 req per 3 seconds)
let requestCount = 0;
let requestWindowStart = Date.now();
const MAX_REQUESTS_PER_MINUTE = 20;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

export async function GET() {
  try {
    // Check cache first - return immediately if data exists
    const cachedData = cache.get<CryptoIndex[]>(CACHE_KEY);
    if (cachedData) {
      console.log("[API] ✅ Serving from cache (TTL: 120s)");
      return NextResponse.json({
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    console.log("[API] ⚠️ Cache miss, fetching from CoinGecko...");
    console.log("[API] Environment:", process.env.VERCEL ? "Vercel" : "Local");

    // Rate limiting check (20 req/min)
    const now = Date.now();
    if (now - requestWindowStart > RATE_LIMIT_WINDOW) {
      // Reset window
      requestCount = 0;
      requestWindowStart = now;
    }

    // Check if we've exceeded rate limit
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      console.warn("[API] Self-imposed rate limit reached, serving stale data");
      const staleData = cache.get<CryptoIndex[]>(STALE_CACHE_KEY);
      if (staleData) {
        return NextResponse.json({
          data: staleData,
          cached: true,
          stale: true,
          message: "Rate limit protection: serving cached data",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Increment request counter
    requestCount++;
    console.log(
      `[API] Request ${requestCount}/${MAX_REQUESTS_PER_MINUTE} in current window`
    );

    // Fetch from CoinGecko API
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add API key to headers if available (Pro tier)
    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
      console.log("[API] Using CoinGecko Pro API key");
    } else {
      console.log("[API] Using CoinGecko free tier (no API key)");
    }

    const response = await axios.get(COINGECKO_API_URL, {
      timeout: 10000, // 10 second timeout
      headers,
    });

    const data: CryptoIndex[] = response.data;

    // Store in both caches
    cache.set(CACHE_KEY, data, CACHE_TTL); // Normal cache with TTL
    cache.set(STALE_CACHE_KEY, data, 0); // Stale cache (no expiry)

    console.log("[API] ✅ Successfully fetched and cached", data.length, "coins");

    return NextResponse.json({
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [API] Error fetching crypto indices:", error);
    
    if (axios.isAxiosError(error)) {
      console.error("❌ [API] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Try to serve stale data when rate-limited or error occurs
    const staleData = cache.get<CryptoIndex[]>(STALE_CACHE_KEY);

    if (staleData) {
      console.log("[API] Serving stale data due to error");
      return NextResponse.json({
        data: staleData,
        cached: true,
        stale: true,
        message: "Serving cached data due to API rate limit",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle rate limiting - no stale data available
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. No cached data available. Please try again in a few minutes.",
          retryAfter: 60, // seconds
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch crypto data and no cached data available" },
      { status: 500 }
    );
  }
}
