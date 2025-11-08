"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong!
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {error.message || "Failed to load crypto data"}
          </p>
        </div>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
