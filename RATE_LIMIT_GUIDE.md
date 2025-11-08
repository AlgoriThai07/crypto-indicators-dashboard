# Rate Limit Handling Guide

## What Happened?

You've hit CoinGecko's API rate limits (HTTP 429). The free tier has strict limits:
- **10-30 requests per minute**
- **500 requests per month**

## What I've Fixed

### 1. **Increased Cache TTL**
- Changed from 120 seconds (2 minutes) to **300 seconds (5 minutes)**
- This reduces API calls from 30/hour to 12/hour per user

### 2. **Stale Data Fallback**
- Implemented a **permanent backup cache** (`STALE_CACHE_KEY`)
- When rate-limited, the app serves stale (old but valid) data
- Better than showing errors to users

### 3. **Better Error Messages**
- Shows yellow warning when using stale data
- Provides clear feedback about rate limits
- Displays helpful messages to users

## How It Works Now

```typescript
Request Flow:
1. Check normal cache (5-minute TTL) → Serve if available
2. If cache miss → Fetch from CoinGecko API
3. If API succeeds → Cache data in both:
   - Normal cache (5 min TTL)
   - Stale cache (never expires)
4. If API fails (429) → Serve from stale cache
5. If no stale cache → Show error with retry time
```

## Testing Steps

### 1. Clear Cache & Restart
```powershell
# Stop the server (Ctrl+C)
rm -r .next
npm run dev
```

### 2. Wait for Rate Limit to Reset
- CoinGecko resets rate limits every **1-2 minutes**
- Wait 2-3 minutes before testing

### 3. Test the Application
```
http://localhost:3000
```

You should see:
- ✅ Data loads successfully (from API)
- ✅ "📊 Cached data • Updates every 5 minutes" message
- ✅ On subsequent visits within 5 minutes → served from cache
- ✅ If rate-limited → yellow warning with stale data

## Avoiding Rate Limits

### During Development:

1. **Use the cache** - Don't refresh too often
2. **Increase cache TTL** - Already set to 5 minutes
3. **Mock data** (optional) - Create test data for development

### Production Tips:

1. **Get CoinGecko Pro** ($129/month)
   - 500 calls/minute
   - 10,000 calls/month
   - Better for production

2. **Use alternative APIs:**
   - CoinCap.io (free tier: 200 req/min)
   - CryptoCompare (free tier: 100k calls/month)
   - Binance API (higher limits)

3. **Implement request queuing**
4. **Use WebSocket for real-time data** (already implemented for BTC)

## Emergency: If Still Getting 429

### Option 1: Increase Cache Time
```typescript
// In src/app/api/indices/route.ts
const CACHE_TTL = 600; // 10 minutes instead of 5
```

### Option 2: Use Mock Data (Development Only)
Create a file: `src/app/api/indices/mock-data.ts`

```typescript
export const MOCK_CRYPTO_DATA = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 50000,
    market_cap: 950000000000,
    price_change_percentage_24h: 2.5,
    // ... more fields
  },
  // ... more coins
];
```

Then in route.ts:
```typescript
// DEV MODE ONLY
if (process.env.NODE_ENV === 'development') {
  return NextResponse.json({
    data: MOCK_CRYPTO_DATA,
    cached: true,
    mock: true,
  });
}
```

### Option 3: Switch to Different API
Use CoinCap (no API key needed):
```typescript
const COINCAP_API_URL = "https://api.coincap.io/v2/assets?limit=15";
```

## Current Status

✅ **Fixed:**
- Stale data fallback implemented
- Cache TTL increased to 5 minutes
- Better error messages
- Graceful degradation

⚠️ **Action Required:**
- Wait 2-3 minutes for CoinGecko rate limit to reset
- Restart your dev server
- Consider upgrading to CoinGecko Pro for production

## Monitoring

Check server logs for:
- `[API] Serving from cache` - Good! Using cache
- `[API] Cache miss, fetching from CoinGecko...` - API call made
- `[API] Serving stale data due to error` - Rate limited, serving backup

## Questions?

If you still see errors after waiting:
1. Check the diagnostics page: `http://localhost:3000/diagnostics`
2. Test the API directly: `http://localhost:3000/api/test-bitcoin`
3. Verify cache is working in server logs
