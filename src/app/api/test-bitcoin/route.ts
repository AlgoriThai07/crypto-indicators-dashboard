import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Test endpoint to verify CoinGecko API connectivity
 * GET /api/test-bitcoin
 */
export async function GET() {
  try {
    const COINGECKO_BTC_URL =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";

    console.log("Testing CoinGecko API...");
    console.log("URL:", COINGECKO_BTC_URL);

    const response = await axios.get(COINGECKO_BTC_URL, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log("API Response:", response.data);
    console.log("Status:", response.status);

    // Validate response structure
    if (!response.data || !response.data.bitcoin) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API response structure",
          rawData: response.data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        price: response.data.bitcoin.usd,
        change24h: response.data.bitcoin.usd_24h_change,
      },
      rawData: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CoinGecko API Test Error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
