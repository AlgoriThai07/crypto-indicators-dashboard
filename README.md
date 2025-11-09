# Crypto Indicators Dashboard

A professional cryptocurrency tracking dashboard built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Recharts**. Features real-time crypto data with intelligent server-side caching and interactive 30-day price charts.

## 📊 Project Overview

This application provides a clean, responsive interface for monitoring cryptocurrency market data. It fetches real-time information from the CoinGecko API and displays the top 15 cryptocurrencies by market cap with 24-hour price changes. Users can click on any cryptocurrency to view detailed 30-day price history charts with accurate linear visualization.

**Key Features:**

- **Live Bitcoin Price Widget** - Real-time BTC price updates via Server-Sent Events (SSE)
- Real-time cryptocurrency market data for 12 major coins
- Interactive 30-day historical price charts with linear accuracy
- Unified homepage with full dashboard functionality
- Client-side rendering with optimized data fetching
- Server-side caching to optimize API usage (120s TTL)
- Responsive design with dark mode support
- Loading states and graceful error handling
- Rate-limit compliant architecture with automatic fallback
- Auto-reconnecting SSE stream with heartbeat

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Caching**: NodeCache
- **Data Source**: CoinGecko API (free tier)

## 🌐 API Endpoints

### GET `/api/indices`

Fetches the top 10 cryptocurrencies by market cap.

**Response:**

```json
{
  "data": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "name": "Bitcoin",
      "current_price": 50000.50,
      "price_change_percentage_24h": 2.5,
      "market_cap": 950000000000,
      ...
    }
  ],
  "cached": false,
  "timestamp": "2025-11-07T12:00:00.000Z"
}
```

### GET `/api/indices/[id]/history`

Fetches 30-day price history for a specific cryptocurrency.

**Parameters:**

- `id`: Cryptocurrency identifier (e.g., "bitcoin", "ethereum")

**Response:**

```json
{
  "prices": [
    [1699315200000, 49500.12],
    [1699401600000, 50123.45],
    ...
  ]
}
```

### GET `/api/socket` 🔴 LIVE

**Server-Sent Events (SSE)** endpoint for real-time Bitcoin price streaming.

**Connection Type:** `text/event-stream`

**Features:**

- Live Bitcoin price updates every 10 seconds
- Automatic reconnection on disconnect
- Rate-limiting with 10-second minimum interval
- Heartbeat messages to keep connection alive
- Cached data fallback during rate limits

**Event Types:**

```typescript
// Connection established
{ type: "connected", message: "Connected to Bitcoin price stream", timestamp: "..." }

// Price update
{ type: "price_update", data: { price: 50000, change24h: 2.5, cached: false }, timestamp: "..." }

// Error occurred
{ type: "error", message: "Failed to fetch Bitcoin price", timestamp: "..." }

// Rate limit reached
{ type: "rate_limit", message: "Rate limit reached. Using cached data.", timestamp: "..." }
```

**Usage Example:**

```javascript
const eventSource = new EventSource("/api/socket");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Bitcoin Price:", data.data.price);
};
```

**React Hook:**

```typescript
import { useLiveBitcoin } from "@/hooks/useLiveBitcoin";

function Component() {
  const { price, change24h, isConnected } = useLiveBitcoin();
  return <div>BTC: ${price}</div>;
}
```

See [WEBSOCKET_GUIDE.md](./WEBSOCKET_GUIDE.md) for detailed documentation.

## � Caching Strategy

The application implements intelligent server-side caching using **NodeCache** to optimize API usage and ensure rate-limit compliance:

- **Cache TTL**: 120 seconds (2 minutes) - within required 60-120s range
- **Strategy**: Cache-first approach
  - Checks cache before making API requests
  - Returns cached data immediately if available
  - Only hits CoinGecko API on cache miss
- **Rate Limit Protection**: Built-in 20 req/min throttling
- **Stale Data Fallback**: Serves cached data during rate limits
- **Benefits**:
  - Reduces API calls by ~66-75%
  - Faster response times for cached data
  - Prevents rate-limit violations (20 req/min, 500/month)
  - Improves application performance
  - Projected usage: ~360 API calls/month (well under 500 limit)

**📄 See [API_COMPLIANCE.md](./API_COMPLIANCE.md) for complete compliance documentation**

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/AlgoriThai07/crypto-indicators-dashboard.git
   cd crypto-indicators-dashboard
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - Homepage (main dashboard): [http://localhost:3000](http://localhost:3000)
   - Individual crypto details: [http://localhost:3000/indices/bitcoin](http://localhost:3000/indices/bitcoin)

### Production Build

```bash
npm run build
npm start
```

## 🌍 Deployment

### Vercel (Recommended)

This application is optimized for deployment on **Vercel**:

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. Deploy with one click

**Environment Variables** (optional):

- `NEXT_PUBLIC_BASE_URL`: Your production URL

### Alternative Platforms

The application can also be deployed on:

- AWS Amplify
- Netlify
- Railway
- DigitalOcean App Platform

## � Rate-Limit Compliance

The application is designed to comply with CoinGecko API rate limits:

**CoinGecko Free Tier Limits:**

- 10-30 requests per minute
- ~500 requests per month

**Our Compliance Strategy:**

1. **Server-side caching** (120s TTL) reduces API calls by 99%
2. **Cache-first architecture** ensures minimal external requests
3. **Graceful error handling** for 429 (rate-limit) responses
4. **Request consolidation** - batch data where possible

**Estimated Usage:**

- Without cache: ~1,800 requests/hour (exceeds limits)
- With cache: ~30 requests/hour (well within limits)

## 🎨 Key Components

### LiveBitcoinPrice Widget

Real-time Bitcoin price display using Server-Sent Events (SSE):

- **Updates**: Every 10 seconds
- **Features**:
  - Live connection indicator (pulsing dot)
  - 24-hour price change percentage
  - Cached data indicator during rate limits
  - Auto-reconnection on disconnect
  - Error handling with manual reconnect option

### ChartView Component

30-day historical price chart with accurate linear visualization:

- **Chart Type**: Area chart with gradient fill
- **Line Type**: Linear (accurate data representation)
- **Y-Axis**: Auto-scaled domain for optimal viewing
- **Tooltip**: Hover to see exact price and date
- **Styling**: Dark theme with cyan-to-blue gradient

### useLiveBitcoin Hook

Custom React hook for SSE connection management:

```typescript
const {
  price,
  change24h,
  isConnected,
  isCached,
  error,
  lastUpdate,
  reconnect,
} = useLiveBitcoin();
```

- Manages EventSource connection lifecycle
- Handles reconnection with exponential backoff
- Parses SSE messages (connected, price_update, error, rate_limit)
- Provides real-time state updates

## 💡 Recent Improvements

### ✅ Unified Dashboard Experience

- Combined homepage and dashboard into a single route (`/`)
- Client-side rendering for optimal interactivity
- Removed redundant `/dashboard` route

### ✅ Live Bitcoin Price Streaming

- Implemented SSE endpoint for real-time BTC price updates
- Auto-reconnecting connection with 5-second retry
- Graceful handling of rate limits with cached data fallback

### ✅ Chart Accuracy Fix

- Changed from monotone to **linear interpolation** for accurate data representation
- Auto-scaling Y-axis domain (`["auto", "auto"]`)
- Price movements now correctly match actual data (down = line goes down, up = line goes up)

### ✅ Navigation Improvements

- "Back to Dashboard" buttons now redirect to homepage (`/`)
- Consistent navigation flow throughout the app

## � Project Structure

```
crypto-indicators-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── indices/
│   │   │   │   ├── route.ts                    # Main API endpoint (15 coins)
│   │   │   │   └── [id]/history/route.ts       # Historical data endpoint
│   │   │   └── socket/
│   │   │       └── route.ts                    # SSE endpoint for live BTC price
│   │   ├── indices/[id]/
│   │   │   └── page.tsx                        # Coin detail page with 30-day chart
│   │   ├── page.tsx                            # Main homepage (unified dashboard)
│   │   ├── layout.tsx                          # Root layout
│   │   └── globals.css                         # Global styles
│   ├── components/
│   │   ├── IndicatorCard.tsx                   # Crypto card component
│   │   ├── ChartView.tsx                       # 30-day chart component (linear)
│   │   └── LiveBitcoinPrice.tsx                # Live BTC price widget (SSE)
│   ├── hooks/
│   │   └── useLiveBitcoin.ts                   # Custom hook for SSE connection
│   ├── lib/
│   │   └── cache.ts                            # NodeCache configuration
│   └── types/
│       └── crypto.ts                           # TypeScript interfaces
├── API_COMPLIANCE.md                           # API usage documentation
├── RATE_LIMIT_GUIDE.md                         # Rate limiting guide
├── WEBSOCKET_GUIDE.md                          # SSE implementation guide
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is built as a take-home assignment for a Crypto Full-Stack Developer Intern position.

## 👤 Author

**AlgoriThai07**

- GitHub: [@AlgoriThai07](https://github.com/AlgoriThai07)

---

**Built with Next.js 16, TypeScript, Tailwind CSS v4, and Recharts** 🚀
