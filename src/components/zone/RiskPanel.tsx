'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle,
  FileQuestion,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { RiskEvaluation } from '@/types';

interface RiskPanelProps {
  riskEvaluation: RiskEvaluation;
  eventId?: string;
  zoneName: string;
}

export function RiskPanel({ riskEvaluation, eventId, zoneName }: RiskPanelProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{
    explanation: string;
    fieldDirectives: string[];
    regulatoryNote: string;
    modelUsed: string;
    isSimulatedFallback?: boolean;
    sourceLabel?: string;
  } | null>(null);

  const fetchAiExplanation = async () => {
    if (!eventId) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/bedrock/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (data.success) {
        setAiExplanation(data.data);
      }
    } catch {
      // Fallback
    } finally {
      setAiLoading(false);
    }
  };

  const isHold = riskEvaluation.action === 'HOLD';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
      {/* Risk Engine Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Deterministic Risk Engine Evaluation
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              v1.0 Rules Engine
            </span>
          </div>
          <div className="flex items-baseline space-x-3 mt-1.5">
            <span
              className={`text-2xl font-mono font-bold ${
                isHold ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ACTION: {riskEvaluation.action}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Risk Indicator Score: <span className="font-bold text-slate-200">{riskEvaluation.score}/100</span>
            </span>
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded font-mono text-xs font-bold border tracking-wider uppercase ${
              riskEvaluation.level === 'HIGH'
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : riskEvaluation.level === 'MEDIUM'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            {riskEvaluation.level} VULNERABILITY
          </span>
        </div>
      </div>

      {/* Missing Evidence Warning Callout */}
      {riskEvaluation.missingEvidence.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/60 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold">
            <FileQuestion className="w-4 h-4 shrink-0" />
            <span>CRITICAL MISSING EVIDENCE BLOCKS APPROVAL ({riskEvaluation.missingEvidence.length})</span>
          </div>
          <ul className="space-y-1 pl-6 list-disc text-xs text-amber-200/90 font-mono">
            {riskEvaluation.missingEvidence.map((item, idx) => (
              <li key={idx} className="capitalize">
                {item.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Identified Risk Contributors */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Contributing Risk Factors & Hydraulics</span>
        </h4>

        <div className="space-y-2 font-mono text-xs">
          {riskEvaluation.contributors.map((c, i) => (
            <div
              key={i}
              className={`p-3 rounded border flex items-start space-x-3 ${
                c.severity === 'HIGH'
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                  : c.severity === 'MEDIUM'
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300'
              }`}
            >
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 ${
                  c.severity === 'HIGH'
                    ? 'bg-rose-900 text-rose-100'
                    : c.severity === 'MEDIUM'
                    ? 'bg-amber-900 text-amber-100'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {c.severity}
              </span>
              <div className="space-y-0.5">
                <div className="font-semibold capitalize text-slate-200">
                  {c.factor.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] opacity-90 leading-relaxed">{c.explanation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Synthesis & Decision Directives */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-slate-200">
              Operator Synthesis (Bedrock-Ready Schema)
            </span>
          </div>

          <button
            onClick={fetchAiExplanation}
            disabled={aiLoading}
            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{aiLoading ? 'Synthesizing...' : 'Synthesize Directives'}</span>
          </button>
        </div>

        {aiExplanation && (
          <div className="bg-slate-950 border border-cyan-900/40 rounded-lg p-3.5 space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiExplanation.isSimulatedFallback ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-slate-300 font-semibold">
                  {aiExplanation.isSimulatedFallback ? 'Local Heuristics Engine' : 'AWS Bedrock Integration'}
                </span>
                <span className="text-slate-500 text-[10px]">({aiExplanation.modelUsed})</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  aiExplanation.isSimulatedFallback
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                }`}
              >
                {aiExplanation.sourceLabel || (aiExplanation.isSimulatedFallback ? 'Local explanation — Amazon Bedrock was not called' : 'AI-assisted explanation — review against recorded evidence')}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {aiExplanation.explanation}
            </p>

            {aiExplanation.fieldDirectives.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-200 text-[11px]">
                  Synthesized Directives for Field Technicians:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-400">
                  {aiExplanation.fieldDirectives.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic pt-1">
              {aiExplanation.regulatoryNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
