import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-mono">
      <h2 className="text-2xl font-bold text-cyan-400 mb-2">404 — Distribution Sector Not Found</h2>
      <p className="text-xs text-slate-400 mb-6 max-w-md">
        The requested water distribution zone, event identifier, or telemetry transducer could not be found in the current topology.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold transition-colors"
      >
        Return to Command Center
      </Link>
    </div>
  );
}
