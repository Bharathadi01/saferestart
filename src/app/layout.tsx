import type { Metadata } from 'next';
import './globals.css';
import { SafetyBanner } from '@/components/ui/SafetyBanner';

export const metadata: Metadata = {
  title: 'SafeRestart — Drinking-Water Restart Safety Support',
  description:
    'Field-first decision support tool for verifying safety and authorizing restart of intermittently supplied drinking-water networks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
        <SafetyBanner />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium text-slate-700">SafeRestart Decision Support Prototype</span>
            <span className="text-slate-400">Local demo mode • Simulated telemetry • Does not replace certified lab testing</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
