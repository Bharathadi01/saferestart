'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  FileQuestion,
  Sparkles,
  FileText,
  Search,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { RiskEvaluation, IncidentIntelligenceBrief, InvestigationHypothesis } from '@/types';

interface RiskPanelProps {
  riskEvaluation: RiskEvaluation;
  eventId?: string;
  zoneName: string;
}

export function RiskPanel({ riskEvaluation, eventId, zoneName }: RiskPanelProps) {
  const [activeTab, setActiveTab] = useState<'DECISION' | 'BRIEF' | 'INVESTIGATION'>('DECISION');

  // Plain Explanation states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{
    explanation: string;
    fieldDirectives: string[];
    regulatoryNote: string;
    modelUsed: string;
    isSimulatedFallback?: boolean;
    sourceLabel?: string;
  } | null>(null);

  // Operational Intelligence states
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState<IncidentIntelligenceBrief | null>(null);

  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [investigation, setInvestigation] = useState<{
    hypotheses: InvestigationHypothesis[];
    standardProcedures: string[];
    sourceLabel: string;
    modelUsed: string;
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

  const fetchIncidentBrief = async () => {
    if (!eventId) return;
    setBriefLoading(true);
    try {
      const res = await fetch('/api/bedrock/incident-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBrief(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch incident brief:', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const fetchInvestigation = async () => {
    if (!eventId) return;
    setInvestigationLoading(true);
    try {
      const res = await fetch('/api/bedrock/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setInvestigation(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch investigation:', err);
    } finally {
      setInvestigationLoading(false);
    }
  };

  const isHold = riskEvaluation.action === 'HOLD';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      {/* Header Tabs: Deterministic vs AI Intelligence */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
            Safety Engine & Decision Support
          </span>
          <h3 className="text-base font-bold text-slate-900">{zoneName} Risk Assessment</h3>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('DECISION')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'DECISION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Safety Rule Engine
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('BRIEF');
              if (!brief) fetchIncidentBrief();
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'BRIEF'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Incident Brief</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('INVESTIGATION');
              if (!investigation) fetchInvestigation();
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'INVESTIGATION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-600" />
            <span>Root-Cause</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DETERMINISTIC SAFETY RULE EVALUATION */}
      {activeTab === 'DECISION' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Main Decision Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Sole Operational Authority
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  Deterministic Engine
                </span>
              </div>
              <div className="flex items-baseline space-x-3 mt-1.5">
                <span
                  className={`text-2xl font-bold tracking-tight ${
                    isHold ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  DECISION: {riskEvaluation.action === 'HOLD' ? 'HOLD (Do Not Restart)' : 'PROCEED TO REVIEW'}
                </span>
                <span className="text-xs text-slate-500">
                  Risk Score: <span className="font-bold text-slate-800">{riskEvaluation.score}/100</span>
                </span>
              </div>
            </div>

            {/* Level Badge */}
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold border tracking-wider uppercase ${
                  riskEvaluation.level === 'HIGH'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : riskEvaluation.level === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {riskEvaluation.level} VULNERABILITY
              </span>
            </div>
          </div>

          {/* Missing Evidence Warning Callout */}
          {riskEvaluation.missingEvidence.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 text-xs font-bold">
                <FileQuestion className="w-4 h-4 shrink-0 text-amber-700" />
                <span>CRITICAL MISSING EVIDENCE BLOCKS APPROVAL ({riskEvaluation.missingEvidence.length})</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-xs text-amber-800 font-medium">
                {riskEvaluation.missingEvidence.map((item, idx) => (
                  <li key={idx} className="capitalize">
                    {item.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Identified Risk Contributors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Contributing Safety Factors</span>
            </h4>

            <div className="space-y-2 text-xs">
              {riskEvaluation.contributors.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border flex items-start space-x-3 ${
                    c.severity === 'HIGH'
                      ? 'bg-rose-50/60 border-rose-200 text-slate-800'
                      : c.severity === 'MEDIUM'
                      ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 ${
                      c.severity === 'HIGH'
                        ? 'bg-rose-200 text-rose-900'
                        : c.severity === 'MEDIUM'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {c.severity}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-semibold capitalize text-slate-900">
                      {c.factor.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">{c.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plain-Language Explanation Section */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold text-slate-800">
                  Plain-Language Assessment Explanation
                </span>
              </div>

              <button
                type="button"
                onClick={fetchAiExplanation}
                disabled={aiLoading}
                className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>{aiLoading ? 'Explaining...' : 'Explain Risk Result'}</span>
              </button>
            </div>

            {aiExplanation && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        aiExplanation.isSimulatedFallback ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-slate-800 font-semibold">
                      {aiExplanation.isSimulatedFallback ? 'Local Explanation Engine' : 'AWS Bedrock Integration'}
                    </span>
                    <span className="text-slate-500 text-[11px]">({aiExplanation.modelUsed})</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      aiExplanation.isSimulatedFallback
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {aiExplanation.sourceLabel || (aiExplanation.isSimulatedFallback ? 'Local explanation — Bedrock was not called' : 'AI-assisted explanation')}
                  </span>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  {aiExplanation.explanation}
                </p>

                {aiExplanation.fieldDirectives.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-900 text-xs">
                      Recommended Actions for Field Technicians:
                    </span>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-slate-600">
                      {aiExplanation.fieldDirectives.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 italic pt-1">
                  {aiExplanation.regulatoryNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROUNDED INCIDENT INTELLIGENCE BRIEF */}
      {activeTab === 'BRIEF' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Grounded Incident Intelligence Brief
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchIncidentBrief}
              disabled={briefLoading}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {briefLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-sky-600" />}
              <span>{briefLoading ? 'Generating...' : 'Refresh Brief'}</span>
            </button>
          </div>

          {briefLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse bg-slate-50 border border-slate-200 rounded-xl">
              Synthesizing telemetry history, field directives, and verified evidence via Amazon Bedrock...
            </div>
          ) : brief ? (
            <div className="space-y-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-800">{brief.incidentSummary}</span>
                <span className="text-[10px] px-2 py-0.5 rounded border bg-sky-100 text-sky-900 border-sky-300 font-medium">
                  {brief.sourceLabel}
                </span>
              </div>

              {brief.timeline && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Operational Timeline:</span>
                  <p className="text-slate-700 leading-relaxed font-mono text-[11px]">{brief.timeline}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Physical Facts</span>
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                    {brief.verifiedObservations.map((obs: string, i: number) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
                    <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing or Contradictory Evidence</span>
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                    {brief.missingOrContradictoryEvidence.map((gap: string, i: number) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {brief.suspectedUnconfirmedCauses.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <span className="font-bold flex items-center space-x-1 text-[11px]">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Suspected / Unconfirmed Causes:</span>
                  </span>
                  <ul className="space-y-0.5 pl-4 list-disc text-[11px]">
                    {brief.suspectedUnconfirmedCauses.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.outstandingActions.length > 0 && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-1 text-sky-950">
                  <span className="font-bold text-[11px]">Recommended Next Actions:</span>
                  <ul className="space-y-0.5 pl-4 list-disc text-[11px]">
                    {brief.outstandingActions.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
              Click &quot;Refresh Brief&quot; above to synthesize an AI incident intelligence summary.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROOT-CAUSE INVESTIGATION ASSISTANT */}
      {activeTab === 'INVESTIGATION' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Root-Cause Investigation Assistant
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchInvestigation}
              disabled={investigationLoading}
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {investigationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
              <span>{investigationLoading ? 'Analyzing...' : 'Analyze Causes'}</span>
            </button>
          </div>

          {investigationLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse bg-slate-50 border border-slate-200 rounded-xl">
              Evaluating failure modes, transient patterns, and contradictory observations...
            </div>
          ) : investigation ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex items-center justify-between">
                <span className="font-semibold text-purple-950 text-xs">
                  Competing Failure Mode Hypotheses ({investigation.hypotheses.length})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-medium">
                  {investigation.sourceLabel}
                </span>
              </div>

              <div className="space-y-3">
                {investigation.hypotheses.map((h: InvestigationHypothesis) => (
                  <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{h.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          h.likelihood === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : h.likelihood === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Likelihood: {h.likelihood}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">{h.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200">
                        <span className="font-bold text-emerald-900 block mb-1">Supporting Evidence:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-emerald-800">
                          {h.supportingEvidence.map((se: string, i: number) => (
                            <li key={i}>{se}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded bg-rose-50/50 border border-rose-200">
                        <span className="font-bold text-rose-900 block mb-1">Contradicting Evidence:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                          {h.contradictingEvidence.map((ce: string, i: number) => (
                            <li key={i}>{ce}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {h.limitations && (
                      <div className="text-[10px] text-slate-500 italic flex items-center space-x-1 pt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Limitations: {h.limitations}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {investigation.standardProcedures.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-800 text-xs">Standard Diagnostic Procedures:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    {investigation.standardProcedures.map((sop, i) => (
                      <li key={i}>{sop}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
              Click &quot;Analyze Causes&quot; above to evaluate failure mode hypotheses and contradictory evidence.
            </div>
          )}
        </div>
      )}

      {/* Safety Invariant Guardrail Footer */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2 text-[11px] text-slate-600">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">Safety Invariant #1:</strong> The deterministic risk engine maintains sole authority over HOLD and PROCEED transitions. AI briefs and hypotheses are strictly decision support and can never override safety hold or authorize water restoration.
        </p>
      </div>
    </div>
  );
}
