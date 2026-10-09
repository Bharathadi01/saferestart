import type { Metadata } from 'next';
import './globals.css';
import { SafetyBanner } from '@/components/ui/SafetyBanner';

export const metadata: Metadata = {
  title: 'SafeRestart — Intermittent Drinking-Water Distribution Decision Support',
  description:
    'Field-first operational decision-support prototype for evaluating hydraulic evidence and authorizing service restoration in intermittently supplied drinking-water networks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
        <SafetyBanner />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>SafeRestart Operational Prototype • AWS Environmental Hacks</span>
            <span>Simulated Telemetry Demonstration Environment • Not for Unverified Release</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
