import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-600 mb-6 max-w-md">
        The requested water distribution zone, event, or report could not be found.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors shadow-sm"
      >
        Return to Field Worker Home
      </Link>
    </div>
  );
}
