# WebSocket/SSE Implementation for Live Bitcoin Price Updates

## Overview

This implementation uses **Server-Sent Events (SSE)** instead of traditional WebSockets because Next.js App Router doesn't natively support WebSocket connections. SSE is perfect for one-way real-time communication from server to client (which is what we need for price updates).

## Architecture

### 1. **SSE Route**: `/api/socket`

Located at: `src/app/api/socket/route.ts`

**Features:**

- Streams Bitcoin price updates every 10 seconds
- Rate limiting: Minimum 10-second interval between API calls
- Automatic caching to reduce API requests
- Heartbeat messages every 30 seconds to keep connection alive
- Proper cleanup on client disconnect
- Error handling for rate limits and network issues

**Response Format:**

```json
{
  "type": "price_update",
  "data": {
    "price": 50000.5,
    "change24h": 2.5,
    "cached": false
  },
  "timestamp": "2025-11-07T12:00:00.000Z"
}
```

**Message Types:**

- `connected` - Initial connection success
- `price_update` - Bitcoin price update
- `error` - Error occurred while fetching data
- `rate_limit` - Rate limit reached, using cached data

### 2. **Custom Hook**: `useLiveBitcoin`

Located at: `src/hooks/useLiveBitcoin.ts`

**Features:**

- Automatic connection management
- Auto-reconnect on connection loss (5-second delay)
- Clean state management
- Proper cleanup on unmount

**Usage:**

```tsx
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";

function MyComponent() {
  const {
    price, // Current BTC price
    change24h, // 24h percentage change
    isConnected, // Connection status
    isCached, // Whether data is from cache
    error, // Error message if any
    lastUpdate, // Last update timestamp
    reconnect, // Manual reconnect function
  } = useLiveBitcoin();

  return (
    <div>
      {price && <p>Bitcoin: ${price.toFixed(2)}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 3. **UI Component**: `LiveBitcoinPrice`

Located at: `src/components/LiveBitcoinPrice.tsx`

**Features:**

- Real-time price display
- 24h change indicator with color coding
- Connection status indicator
- Cache status badge
- Error handling with manual reconnect
- Loading skeleton
- Last update timestamp

## Rate Limiting & Safety

### Built-in Protections:

1. **Minimum Fetch Interval**: 10 seconds between API calls
2. **Request Caching**: Stores last fetched data to reduce API load
3. **CoinGecko Rate Limits**:
   - Free tier: 10-30 requests/minute
   - Our implementation: ~6 requests/minute per client
4. **Automatic Fallback**: Uses cached data when rate limited
5. **Heartbeat System**: Keeps connection alive without API calls

### Client-Side Safety:

1. **Auto-Reconnect**: 5-second delay on connection loss
2. **Manual Reconnect**: User can force reconnect
3. **Cleanup**: Proper resource cleanup on component unmount
4. **Error Recovery**: Graceful error handling with user feedback

## Testing the Implementation

### 1. **Start the Development Server**

```bash
npm run dev
```

### 2. **Visit the Dashboard**

Navigate to: http://localhost:3000/dashboard

You should see the "Live Bitcoin Price" widget at the top displaying real-time updates.

### 3. **Test Connection**

- Watch for the "Connected" badge (green)
- Price should update every 10 seconds
- Check browser console for connection logs

### 4. **Test Error Handling**

- Disconnect from internet
- Watch for "Disconnected" status
- Reconnect and see auto-reconnect in action

### 5. **Manual Testing with EventSource**

```javascript
// Open browser console
const eventSource = new EventSource("/api/socket");

eventSource.onmessage = (event) => {
  console.log("Received:", JSON.parse(event.data));
};

eventSource.onerror = (error) => {
  console.error("Error:", error);
};

// Close connection
eventSource.close();
```

## Integration Examples

### Example 1: Simple Price Display

```tsx
"use client";
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";

export default function SimplePriceWidget() {
  const { price, change24h, isConnected } = useLiveBitcoin();

  if (!price) return <div>Loading...</div>;

  return (
    <div>
      <h2>Bitcoin: ${price.toLocaleString()}</h2>
      <p>24h Change: {change24h?.toFixed(2)}%</p>
      <span>Status: {isConnected ? "Live" : "Offline"}</span>
    </div>
  );
}
```

### Example 2: Price Alert System

```tsx
"use client";
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";
import { useEffect, useState } from "react";

export default function PriceAlert() {
  const { price } = useLiveBitcoin();
  const [alert, setAlert] = useState<string | null>(null);
  const targetPrice = 60000;

  useEffect(() => {
    if (price && price > targetPrice) {
      setAlert(`Bitcoin reached $${price}! 🚀`);
    }
  }, [price]);

  return alert ? <div className="alert">{alert}</div> : null;
}
```

### Example 3: Price History Tracker

```tsx
"use client";
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";
import { useEffect, useState } from "react";

export default function PriceHistory() {
  const { price, lastUpdate } = useLiveBitcoin();
  const [history, setHistory] = useState<
    Array<{ price: number; time: string }>
  >([]);

  useEffect(() => {
    if (price && lastUpdate) {
      setHistory((prev) => [...prev, { price, time: lastUpdate }].slice(-10));
    }
  }, [price, lastUpdate]);

  return (
    <div>
      <h3>Recent Prices</h3>
      <ul>
        {history.map((entry, i) => (
          <li key={i}>
            ${entry.price.toFixed(2)} at{" "}
            {new Date(entry.time).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## API Endpoints

### GET /api/socket

**Description**: SSE endpoint for real-time Bitcoin price updates

**Response Type**: `text/event-stream`

**Headers**:

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

**Connection Flow**:

1. Client connects via EventSource
2. Server sends "connected" message
3. Server sends initial price update
4. Server sends updates every 10 seconds
5. Server sends heartbeat every 30 seconds
6. Client or server can close connection

## Performance Considerations

### Server-Side:

- **Memory**: Minimal - only stores last fetched data
- **CPU**: Low - periodic fetch every 10 seconds
- **Network**: ~6 requests/minute to CoinGecko
- **Scalability**: Can handle multiple concurrent connections

### Client-Side:

- **Memory**: Very low - just the hook state
- **CPU**: Minimal - only JSON parsing
- **Network**: Persistent SSE connection (~1KB/update)
- **Battery**: Efficient - no polling, server pushes updates

## Troubleshooting

### Connection Issues:

1. **Connection not established**:

   - Check if `/api/socket` route exists
   - Verify CORS settings if using custom domain
   - Check browser console for errors

2. **Frequent disconnections**:

   - Network instability
   - Server timeout settings
   - Firewall/proxy blocking SSE

3. **Rate limit errors**:
   - Too many concurrent connections
   - CoinGecko API limits reached
   - Check cache is working properly

### Debugging:

```typescript
// Enable verbose logging in useLiveBitcoin hook
console.log("Connection state:", isConnected);
console.log("Current price:", price);
console.log("Last error:", error);
console.log("Is cached:", isCached);
```

## Alternatives & Upgrades

### WebSocket with Custom Server:

If you need bidirectional communication, you can add a custom WebSocket server:

```typescript
// server.js (Custom Node.js server)
import { createServer } from "http";
import { WebSocketServer } from "ws";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    const interval = setInterval(() => {
      // Send price updates
      ws.send(JSON.stringify({ price: 50000 }));
    }, 10000);

    ws.on("close", () => {
      clearInterval(interval);
      console.log("Client disconnected");
    });
  });

  server.listen(3000);
});
```

### Third-Party WebSocket APIs:

- **Binance WebSocket**: Real-time trading data
- **Coinbase WebSocket**: Professional trading feeds
- **CryptoCompare**: Multi-source price feeds

## Security Considerations

1. **Rate Limiting**: Already implemented
2. **DDoS Protection**: Consider adding rate limiting per IP
3. **Authentication**: Add JWT/API key if needed for production
4. **Data Validation**: Validate incoming data from CoinGecko
5. **Error Exposure**: Don't expose internal errors to clients

## Production Deployment

### Environment Variables:

```env
# Optional: Add API keys for higher rate limits
COINGECKO_API_KEY=your_api_key_here
```

### Vercel Deployment:

SSE works perfectly on Vercel. No special configuration needed.

### Self-Hosted:

Ensure your server/proxy supports SSE:

- Disable response buffering
- Set proper timeout values
- Configure keep-alive settings

## Conclusion

This SSE implementation provides a robust, production-ready solution for streaming live Bitcoin prices to your Next.js application. It includes:

✅ Real-time price updates (10-second intervals)
✅ Rate limiting and caching
✅ Automatic reconnection
✅ Error handling
✅ Clean UI components
✅ Easy-to-use React hooks
✅ Production-ready safety features

The system is designed to be reliable, efficient, and scalable for multiple concurrent users.
