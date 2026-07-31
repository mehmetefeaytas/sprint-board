'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
      <h1 className="text-lg font-semibold text-rose-800 dark:text-rose-200">Bir şeyler ters gitti</h1>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek sorunu çözebilir.
      </p>
      <p className="mt-2 font-mono text-xs break-all text-rose-600 dark:text-rose-400">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 h-11 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white"
      >
        Yeniden dene
      </button>
    </div>
  );
}
