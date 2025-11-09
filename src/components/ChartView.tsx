"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface ChartViewProps {
  data: { date: string; price: number }[];
}

// Custom Tooltip Component - CoinMarketCap style
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const price = payload[0].value;
    const date = payload[0].payload.date;

    return (
      <div className="bg-[#1e293b] rounded-lg px-4 py-3 shadow-2xl border border-slate-700">
        <p className="text-slate-400 text-xs font-medium mb-1">{date}</p>
        <p className="text-white text-lg font-bold">
          $
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

export default function ChartView({ data }: ChartViewProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [data]);

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 min ago";
    return `${diffMins} mins ago`;
  };

  // Calculate price range for better visualization
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  // Add small padding (2%) to min/max for better visualization
  const yAxisMin = minPrice - priceRange * 0.02;
  const yAxisMax = maxPrice + priceRange * 0.02;

  // Debug: Log first few and last few data points
  if (data.length > 0) {
    console.log("Chart data - First 3 points:", data.slice(0, 3));
    console.log("Chart data - Last 3 points:", data.slice(-3));
    console.log("Y-axis domain:", [yAxisMin, yAxisMax]);
  }

  return (
    <div
      className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(148, 163, 184, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Chart Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          {/* Pulsing live indicator */}
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-100">
            30-Day Price Trend (USD)
          </h3>
        </div>
        <p className="text-sm text-gray-500 pl-5">
          Updated {getTimeSinceUpdate()}
        </p>
      </div>

      {/* Chart Container */}
      <div className="px-4 pb-6">
        <div className="w-full h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Cyan to Blue gradient for the line */}
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>

                {/* Gradient fill under the line */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Subtle grid lines */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                strokeOpacity={0.5}
                vertical={false}
              />

              {/* X-Axis */}
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />

              {/* Y-Axis */}
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(value) =>
                  `$${value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
                }
                width={70}
              />

              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#38bdf8",
                  strokeWidth: 1,
                  strokeDasharray: "5 5",
                }}
                animationDuration={200}
              />

              {/* Area fill with gradient */}
              <Area
                type="linear"
                dataKey="price"
                stroke="url(#lineGradient)"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={false}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Footer - subtle sublabel */}
      <div className="px-6 pb-5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Data from CoinGecko API</span>
          <span className="font-medium">{data.length} data points</span>
        </div>
      </div>
    </div>
  );
}
