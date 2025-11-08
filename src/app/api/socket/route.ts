import { NextRequest } from "next/server";
import axios from "axios";

// Environment variable for API key (optional)
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// CoinGecko API endpoint for Bitcoin price
const buildBitcoinUrl = () => {
  const baseUrl = "https://api.coingecko.com/api/v3/simple/price";
  const params = new URLSearchParams({
    ids: "bitcoin",
    vs_currencies: "usd",
    include_24hr_change: "true",
  });

  if (COINGECKO_API_KEY) {
    params.append("x_cg_pro_api_key", COINGECKO_API_KEY);
  }

  return `${baseUrl}?${params.toString()}`;
};

const COINGECKO_BTC_URL = buildBitcoinUrl();

// Rate limiting - track last fetch time
let lastFetchTime = 0;
let cachedBTCData: any = null;
const MIN_FETCH_INTERVAL = 10000; // 10 seconds minimum between API calls

/**
 * Server-Sent Events (SSE) endpoint for real-time Bitcoin price updates
 * Streams BTC price to connected clients every 10 seconds
 *
 * Usage: new EventSource('/api/socket')
 */
export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  let intervalId: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const welcome = `data: ${JSON.stringify({
        type: "connected",
        message: "Connected to Bitcoin price stream",
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(welcome));

      // Function to fetch and send Bitcoin price
      const fetchAndSendPrice = async () => {
        if (isClosed) return;

        try {
          const now = Date.now();

          // Rate limiting: Use cached data if fetched recently
          if (now - lastFetchTime < MIN_FETCH_INTERVAL && cachedBTCData) {
            const cachedMessage = `data: ${JSON.stringify({
              type: "price_update",
              data: {
                ...cachedBTCData,
                cached: true,
              },
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(cachedMessage));
            return;
          }

          // Fetch fresh Bitcoin price from CoinGecko
          console.log("[SSE] Fetching Bitcoin price from CoinGecko...");
          const response = await axios.get(COINGECKO_BTC_URL, {
            timeout: 8000,
            headers: {
              Accept: "application/json",
            },
          });

          console.log("[SSE] API Response status:", response.status);
          console.log("[SSE] API Response data:", response.data);

          // Validate response data
          if (!response.data || !response.data.bitcoin) {
            console.error(
              "[SSE] Invalid API response structure:",
              response.data
            );
            throw new Error("Invalid API response structure");
          }

          const btcData = {
            price: response.data.bitcoin.usd || 0,
            change24h: response.data.bitcoin.usd_24h_change || 0,
            cached: false,
          };

          // Update cache
          cachedBTCData = btcData;
          lastFetchTime = now;

          console.log("[SSE] Successfully fetched Bitcoin price:", btcData);

          // Send price update to client
          const message = `data: ${JSON.stringify({
            type: "price_update",
            data: btcData,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error fetching Bitcoin price:", error);

          // If we have cached data, send it instead of error
          if (cachedBTCData) {
            const cachedMessage = `data: ${JSON.stringify({
              type: "price_update",
              data: {
                ...cachedBTCData,
                cached: true,
              },
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(cachedMessage));

            // Also send a warning message
            const warningMessage = `data: ${JSON.stringify({
              type: "warning",
              message: "Using cached data due to API error",
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(warningMessage));
          } else {
            // No cached data available, send error
            const errorMessage = `data: ${JSON.stringify({
              type: "error",
              message: axios.isAxiosError(error)
                ? `API Error: ${error.message}`
                : "Failed to fetch Bitcoin price",
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(errorMessage));
          }

          // If rate limited (429), send specific message
          if (axios.isAxiosError(error) && error.response?.status === 429) {
            const rateLimitMessage = `data: ${JSON.stringify({
              type: "rate_limit",
              message: "Rate limit reached. Using cached data.",
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(rateLimitMessage));
          }
        }
      };

      // Send initial price immediately
      await fetchAndSendPrice();

      // Set up interval to send updates every 10 seconds
      intervalId = setInterval(fetchAndSendPrice, 10000);

      // Keep connection alive with heartbeat every 30 seconds
      const heartbeatId = setInterval(() => {
        if (!isClosed) {
          const heartbeat = `: heartbeat\n\n`;
          try {
            controller.enqueue(encoder.encode(heartbeat));
          } catch (error) {
            // Connection closed
            isClosed = true;
            clearInterval(heartbeatId);
          }
        } else {
          clearInterval(heartbeatId);
        }
      }, 30000);
    },

    cancel() {
      // Cleanup when client disconnects
      isClosed = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log("Client disconnected from Bitcoin price stream");
    },
  });

  // Return SSE response with appropriate headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx
    },
  });
}

// Prevent caching of this endpoint
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
