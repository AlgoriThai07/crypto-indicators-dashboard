export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded w-1/2 animate-pulse mb-2"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-3/4 animate-pulse mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-full animate-pulse mb-3"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
