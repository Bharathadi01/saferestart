'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Copy,
  Info,
} from 'lucide-react';
import { CopilotStructuredReportOutput } from '@/lib/copilot';

const SAMPLE_REPORTS = [
  {
    title: 'Zone 2 Suspected Leak & Missing Residual',
    text: 'Zone 2 had an unpredicted pressure drop overnight. A technician reports a possible leak near valve V-04. No current chlorine reading has been recorded.',
  },
  {
    title: 'Zone 5 Terminal Flush Completed',
    text: 'Zone 5 technician Rivera completed a 15-minute scour flush at hydrant H-501. Pressure recovered to 28.5 psi. Free chlorine residual unverified.',
  },
  {
    title: 'Zone 1 Repaired Fracture with Passing Sample',
    text: 'Zone 1 main repair clamp secured on pipe P-104. Terminal tap chlorine is 0.45 mg/L and pressure is 32 psi. No leaks observed.',
  },
];

export function FieldReportCopilot() {
  const [inputText, setInputText] = useState(SAMPLE_REPORTS[0].text);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotStructuredReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStructureReport = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/copilot/structure-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawReport: inputText }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setError(json.error || 'Failed to extract structured representation.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              SafeRestart Evidence Copilot — Field Note Structuring
            </h3>
            <p className="text-[11px] text-slate-400">
              Converts unstructured operator briefings into structured drafts while preserving uncertainty
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Advisory Only — Human In The Loop
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-slate-400">Load Example Field Briefing:</span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_REPORTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(preset.text);
                setResult(null);
                setError(null);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700 flex items-center space-x-1"
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Textarea */}
      <div className="space-y-2">
        <label htmlFor="field-notes-input" className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
          <span>Unstructured Technician / Dispatcher Field Note:</span>
          <span className="text-[10px] text-slate-500">{inputText.length}/1000 chars</span>
        </label>
        <textarea
          id="field-notes-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Paste or type field observation notes here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStructureReport}
            disabled={loading || !inputText.trim()}
            className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Structuring with Copilot...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Structure Field Report with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Output Card */}
      {result && (
        <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-cyan-900/50 space-y-4 animate-in fade-in duration-200">
          {/* Source Attribution & Cloud Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-[11px]">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  result.isSimulatedFallback ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span className="font-semibold text-slate-300">
                {result.isSimulatedFallback ? 'Local Fallback Engine' : 'AWS Bedrock Integration'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({result.modelUsed})</span>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                result.isSimulatedFallback
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              }`}
            >
              {result.sourceLabel}
            </span>
          </div>

          {/* Structured Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Zone & Event */}
            <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Water Zone</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-sm">
                  {result.zoneReference || 'Unspecified / Not Matched'}
                </span>
                {result.zoneMatched && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    Matched Zone Schema
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 pt-1">Event: {result.reportedEvent}</p>
            </div>

            {/* Suspected Fault (Preserving Uncertainty) */}
            <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Suspected Fault Status</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    result.suspectedFault.status === 'SUSPECTED'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : result.suspectedFault.status === 'CONFIRMED'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {result.suspectedFault.status}
                </span>
                <span className="font-semibold text-slate-200">{result.suspectedFault.description}</span>
              </div>
              {result.suspectedFault.location && (
                <p className="text-[11px] text-slate-400">Location: near {result.suspectedFault.location}</p>
              )}
            </div>

            {/* Extracted Evidence */}
            <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Explicitly Mentioned Evidence</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Free Chlorine:</span>
                  <span className={result.explicitEvidence.freeChlorineMgL !== null ? 'text-cyan-300 font-bold' : 'text-amber-400 italic'}>
                    {result.explicitEvidence.freeChlorineMgL !== null ? `${result.explicitEvidence.freeChlorineMgL} mg/L` : 'Unreported (NULL)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gauge Pressure:</span>
                  <span className={result.explicitEvidence.pressurePsi !== null ? 'text-cyan-300 font-bold' : 'text-amber-400 italic'}>
                    {result.explicitEvidence.pressurePsi !== null ? `${result.explicitEvidence.pressurePsi} psi` : 'Unreported (NULL)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Missing Info Callout */}
            <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Missing Information Identified</span>
              {result.missingInformation.length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300/90">
                  {result.missingInformation.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-400">All standard baseline parameters explicitly documented.</p>
              )}
            </div>
          </div>

          {/* Recommended Next Tasks */}
          {result.suggestedFollowUpTasks.length > 0 && (
            <div className="p-3 rounded bg-cyan-950/20 border border-cyan-900/40 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Suggested Follow-Up Field Tasks
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                {result.suggestedFollowUpTasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Disclaimer Banner */}
          <div className="p-2.5 rounded bg-slate-900 border border-amber-900/40 flex items-start space-x-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Operational Guardrail:</strong> This structured representation is a draft prepared for human operator review. It does not alter official state machine transitions, certify water quality, or authorize service release.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
