import Link from "next/link";
import Image from "next/image";

interface IndicatorCardProps {
  id: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  change24h: number;
}

export default function IndicatorCard({
  id,
  name,
  symbol,
  image,
  price,
  change24h,
}: IndicatorCardProps) {
  return (
    <Link href={`/indices/${id}`} className="block group">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-400">
        {/* Coin Name and Symbol */}
        <div className="flex items-center gap-3 mb-4">
          <Image
            src={image}
            alt={`${name} logo`}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase">
              {symbol}
            </p>
          </div>
        </div>

        {/* Price in USD */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            $
            {price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* 24h Change (%) - Green if positive, Red if negative */}
        <div
          className={`flex items-center gap-2 text-sm font-semibold mb-4 ${
            change24h >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          <span>{change24h >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(change24h).toFixed(2)}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (24h)
          </span>
        </div>

        {/* View 30-day button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
            View 30-day
          </button>
        </div>
      </div>
    </Link>
  );
}
