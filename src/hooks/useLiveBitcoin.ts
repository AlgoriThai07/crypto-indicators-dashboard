import { useEffect, useState, useCallback, useRef } from "react";

interface BitcoinPrice {
  price: number;
  change24h: number;
  cached: boolean;
}

interface SSEMessage {
  type: "connected" | "price_update" | "error" | "rate_limit" | "warning";
  data?: BitcoinPrice;
  message?: string;
  timestamp: string;
}

interface UseLiveBitcoinReturn {
  price: number | null;
  change24h: number | null;
  isConnected: boolean;
  isCached: boolean;
  error: string | null;
  lastUpdate: string | null;
  reconnect: () => void;
}

/**
 * Custom hook to connect to the Bitcoin price SSE stream
 *
 * @example
 * const { price, change24h, isConnected } = useLiveBitcoin();
 */
export function useLiveBitcoin(): UseLiveBitcoinReturn {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectFnRef = useRef<(() => void) | null>(null);

  // Define connect function
  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create new EventSource connection
      const eventSource = new EventSource("/api/socket");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Connected to Bitcoin price stream");
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case "connected":
              console.log(message.message);
              break;

            case "price_update":
              if (message.data) {
                setPrice(message.data.price);
                setChange24h(message.data.change24h);
                setIsCached(message.data.cached);
                setLastUpdate(message.timestamp);
                // Clear error if we received valid data
                if (!message.data.cached) {
                  setError(null);
                }
              }
              break;

            case "warning":
              console.warn("Stream warning:", message.message);
              // Don't set as error, just log it
              break;

            case "error":
              console.error("Stream error:", message.message);
              // Always set error state, but it won't show if we have price data (handled in component)
              setError(message.message || "Unable to fetch price data");
              break;

            case "rate_limit":
              console.warn("Rate limit:", message.message);
              // Set rate limit message
              setError("Rate limit reached. Waiting for next update...");
              break;
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource error:", err);
        setIsConnected(false);
        setError("Connection lost. Reconnecting...");

        // Close the connection
        eventSource.close();

        // Attempt to reconnect after 5 seconds using the ref
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectFnRef.current?.();
        }, 5000);
      };
    } catch (err) {
      console.error("Error creating EventSource:", err);
      setError("Failed to establish connection");
      setIsConnected(false);
    }
  }, []);

  // Store connect function in ref so it can be called recursively
  connectFnRef.current = connect;

  const reconnect = useCallback(() => {
    connectFnRef.current?.();
  }, []);

  useEffect(() => {
    connect();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    price,
    change24h,
    isConnected,
    isCached,
    error,
    lastUpdate,
    reconnect,
  };
}
