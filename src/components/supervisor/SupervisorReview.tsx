'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  Lock,
  Unlock,
  AlertTriangle,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Gauge,
  FlaskConical,
  UserCheck,
  Clock,
  ArrowRight,
  Info,
  Sparkles,
  Search,
  HelpCircle,
  FileText,
  Check,
  Loader2,
} from 'lucide-react';
import { FieldReportCopilot } from '@/components/copilot/FieldReportCopilot';
import { NextActionCard } from '@/components/ui/NextActionCard';
import { WaterZone, RestartEvent, SupervisorDecision, IncidentIntelligenceBrief, InvestigationHypothesis } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';

interface SupervisorReviewProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onDecisionSubmitted?: (
    decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' }
  ) => Promise<{ success: boolean; data?: RestartEvent; error?: string } | void>;
}

export function SupervisorReview({
  zones,
  events,
  onDecisionSubmitted,
}: SupervisorReviewProps) {
  const allEvents = Object.values(events);

  // Filter queues
  const [activeTab, setActiveTab] = useState<'APPROVAL' | 'HOLD' | 'ALL'>('APPROVAL');

  const awaitingEvents = allEvents.filter((e) => e.state === 'AWAITING_APPROVAL');
  const holdEvents = allEvents.filter((e) => e.state === 'HOLD' || e.state === 'VERIFICATION_REQUIRED');

  const displayedEvents =
    activeTab === 'APPROVAL'
      ? awaitingEvents
      : activeTab === 'HOLD'
      ? holdEvents
      : allEvents;

  // Selected event
  const [selectedEventId, setSelectedEventId] = useState<string>(
    awaitingEvents[0]?.id || holdEvents[0]?.id || allEvents[0]?.id || 'EVT-2026-004'
  );

  const currentEvent = events[selectedEventId];
  const currentZone = currentEvent ? zones.find((z) => z.id === currentEvent.zoneId) : undefined;

  // Sign-off form states
  const [supervisorName, setSupervisorName] = useState('Chief Engineer Helena Miller, P.E.');
  const [supervisorRole, setSupervisorRole] = useState<'SUPERVISOR' | 'CHIEF_WATER_ENGINEER'>('CHIEF_WATER_ENGINEER');
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [rationale, setRationale] = useState(
    'All statutory checklists satisfied. Free chlorine residual >= 0.20 mg/L verified at terminal point. Main scouring completed.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Technical detail drawer toggle
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);

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

  const fetchIncidentBrief = async () => {
    if (!currentEvent) return;
    setBriefLoading(true);
    try {
      const res = await fetch('/api/bedrock/incident-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: currentEvent.id }),
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
    if (!currentEvent) return;
    setInvestigationLoading(true);
    try {
      const res = await fetch('/api/bedrock/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: currentEvent.id }),
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

  // Verification checks
  const sub = currentEvent?.verificationSubmission;
  const chlorinePassing = (sub?.freeChlorineMgL ?? 0) >= DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;
  const pressurePassing = (sub?.observedPressurePsi ?? 0) >= DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI;
  const flushingPassing = !!sub?.flushingCompleted;
  const leakPassing = !!sub?.leakInspectedAndSecured;
  const photoPassing = !!sub?.photoProofAttached;

  const isEligibleForApproval =
    currentEvent?.state === 'AWAITING_APPROVAL' &&
    !!sub &&
    chlorinePassing &&
    pressurePassing &&
    flushingPassing &&
    leakPassing;

  const handleDecision = async (actionType: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION') => {
    if (!currentEvent || !onDecisionSubmitted) return;
    setIsSubmitting(true);
    setFeedback(null);

    const decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' } = {
      eventId: currentEvent.id,
      supervisorName,
      supervisorRole,
      decision: actionType === 'APPROVE' ? 'APPROVE' : 'HOLD',
      rationale:
        rationale ||
        (actionType === 'APPROVE'
          ? 'Field parameters verified. Statutory flushing and residual safety protocol documented.'
          : actionType === 'REQUEST_MORE_VERIFICATION'
          ? 'Supervisor ordered additional secondary sampling before release.'
          : 'Service restoration rejected; operational HOLD enforced.'),
      timestamp: new Date().toISOString(),
      complianceChecksVerified: complianceChecked,
      actionType,
    };

    try {
      const result = await onDecisionSubmitted(decision);
      if (result && !result.success) {
        setFeedback({
          type: 'error',
          message: result.error || 'Decision rejected by authorization policy engine.',
        });
      } else {
        setFeedback({
          type: 'success',
          message:
            actionType === 'APPROVE'
              ? 'Zone service RESTORED! Safe drinking water released to network.'
              : actionType === 'REQUEST_MORE_VERIFICATION'
              ? 'Additional field verification directive dispatched to field crew.'
              : 'Water supply maintained on operational HOLD. Remediation required.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Supervisor Verification & Authorization Gate
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Review submitted field evidence and authorize water restoration
            </p>
          </div>
        </div>

        {/* Action Queue Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('APPROVAL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'APPROVAL'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Awaiting Approval ({awaitingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HOLD')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'HOLD'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Safety Holds & Checks ({holdEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-slate-100 text-slate-900 border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Events ({allEvents.length})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Select a sector to review evidence
          </span>
        </div>

        {/* Sector Queue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
          {displayedEvents.length === 0 ? (
            <div className="col-span-full p-5 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              No distribution sectors currently in this review queue.
            </div>
          ) : (
            displayedEvents.map((evt) => {
              const z = zones.find((item) => item.id === evt.zoneId);
              const isSelected = selectedEventId === evt.id;
              const isAwaiting = evt.state === 'AWAITING_APPROVAL';
              const isHold = evt.state === 'HOLD';

              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setFeedback(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-50 border-sky-600 ring-2 ring-sky-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{z?.name || evt.zoneId}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        isAwaiting
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : isHold
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {isAwaiting ? 'Needs Approval' : isHold ? 'On Hold' : evt.state}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    ID: {evt.id} • {z?.code}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {currentEvent && currentZone ? (
        <div className="space-y-6">
          {/* 1. TOP NEXT ACTION CARD */}
          <NextActionCard
            situation={
              isEligibleForApproval
                ? `${currentZone.name} (${currentZone.code}) has completed all physical scouring and chlorine residual tests. Drinking water restoration is held pending authorized supervisor sign-off.`
                : currentEvent.state === 'RESTORED'
                ? `${currentZone.name} (${currentZone.code}) is operating normally with continuous pressurized drinking water supply.`
                : `${currentZone.name} (${currentZone.code}) experienced pressure loss (< 15 psi). Contamination may have entered distribution mains via negative-pressure back-siphonage.`
            }
            safetyStatus={
              isEligibleForApproval
                ? 'PROCEED'
                : currentEvent.state === 'RESTORED'
                ? 'STABLE'
                : 'HOLD'
            }
            safetyLabel={
              isEligibleForApproval
                ? 'READY FOR SUPERVISOR SIGN-OFF'
                : currentEvent.state === 'RESTORED'
                ? 'SERVICE RESTORED & SAFE'
                : 'RESTRICTION: OPERATIONAL HOLD ACTIVE'
            }
            responsibleRole={
              isEligibleForApproval
                ? 'Chief Water Works Engineer / Operations Supervisor'
                : currentEvent.state === 'RESTORED'
                ? 'Routine Operations & Continuous Quality Monitoring'
                : 'Certified Field Crew & Water Quality Inspector'
            }
            evidenceNotes={
              isEligibleForApproval
                ? [
                    `Free chlorine residual: ${sub?.freeChlorineMgL !== undefined ? sub.freeChlorineMgL.toFixed(2) : '0.44'} mg/L (>= 0.20 mg/L statutory floor verified)`,
                    'Terminal scour flush: 15 minutes completed',
                    'Physical pipe integrity: Repair secured, zero leakage observed',
                    sub?.photoProofAttached ? 'Photographic proof: Water sample clarity verified' : 'Photographic chain of custody saved',
                  ]
                : currentEvent.state === 'RESTORED'
                ? [
                    'Statutory restoration sign-off completed by Operations Supervisor',
                    'Hydraulic pressure maintained above 15 psi minimum floor',
                    'Chlorine disinfectant barrier actively protected',
                  ]
                : [
                    chlorinePassing
                      ? `Free chlorine residual: ${sub?.freeChlorineMgL?.toFixed(2)} mg/L`
                      : 'Free chlorine residual: Missing or below 0.20 mg/L statutory safety floor',
                    flushingPassing ? 'Terminal scour flush: Verified' : 'Terminal scour flush: 15-min scour pending',
                    leakPassing ? 'Pipe integrity: Repair secured' : 'Pipe integrity: Breach or leak suspected',
                  ]
            }
            nextAction={
              isEligibleForApproval
                ? 'Review statutory compliance below and sign authorization to restore water supply to network.'
                : currentEvent.state === 'RESTORED'
                ? 'No emergency intervention needed. Maintain continuous SCADA pressure monitoring.'
                : 'Keep supply valves closed. Field crew must complete scouring and verify >= 0.20 mg/L chlorine residual before release.'
            }
            actionButton={
              isEligibleForApproval
                ? {
                    label: 'Review & Sign Authorization',
                    onClick: () => {
                      const el = document.getElementById('authorization-sign-off');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    },
                    variant: 'teal',
                  }
                : currentEvent.state !== 'RESTORED'
                ? {
                    label: 'Request More Field Checks',
                    onClick: () => handleDecision('REQUEST_MORE_VERIFICATION'),
                    variant: 'secondary',
                  }
                : undefined
            }
          />

          {/* SUBMITTED FIELD EVIDENCE CHECKLIST */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-sky-600" />
                <span>Field Evidence Compliance Status</span>
              </h3>
              <span className="text-xs text-slate-500">
                Sector: {currentZone.name} ({currentZone.code})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Check 1: Chlorine */}
              <div
                className={`p-3.5 rounded-lg border ${
                  chlorinePassing ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">1. Free Chlorine Residual</span>
                  <span className={chlorinePassing ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                    {chlorinePassing ? 'PASS (>= 0.20 mg/L)' : 'FAIL / MISSING'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {sub?.freeChlorineMgL !== undefined ? `${sub.freeChlorineMgL.toFixed(2)} mg/L` : 'No reading recorded'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Required safety floor to protect against coliform
                </p>
              </div>

              {/* Check 2: Scour Flush */}
              <div
                className={`p-3.5 rounded-lg border ${
                  flushingPassing ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">2. 15-Min Scour Flush</span>
                  <span className={flushingPassing ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                    {flushingPassing ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {flushingPassing ? 'Completed by field crew' : 'Not recorded'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Purges stagnant sediment and biofilm
                </p>
              </div>

              {/* Check 3: Pipe Repair */}
              <div
                className={`p-3.5 rounded-lg border ${
                  leakPassing ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">3. Pipe Leak Secured</span>
                  <span className={leakPassing ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                    {leakPassing ? 'SECURED' : 'BREACH SUSPECTED'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {leakPassing ? 'Repair sleeve verified' : 'Active ingress hazard'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prevents groundwater infiltration during recharge
                </p>
              </div>

              {/* Check 4: Photo Proof */}
              <div
                className={`p-3.5 rounded-lg border ${
                  photoPassing ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">4. Photographic Proof</span>
                  <span className={photoPassing ? 'text-emerald-800 font-bold' : 'text-amber-800 font-bold'}>
                    {photoPassing ? 'ATTACHED' : 'MISSING'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {photoPassing ? 'Clear water sample verified' : 'No photo uploaded'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visual proof of water clarity
                </p>
              </div>
            </div>

            {sub?.notes && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800">Technician Note: </span>
                <span className="text-slate-600 italic">&quot;{sub.notes}&quot;</span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Submitted by: {sub.submittedBy} at {new Date(sub.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* CONFIRMED FIELD REPORTS LEDGER (IF ANY) */}
            {currentEvent.fieldReports && currentEvent.fieldReports.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>Human-Confirmed Field Observation Reports ({currentEvent.fieldReports.length})</span>
                </h4>
                <div className="space-y-2">
                  {currentEvent.fieldReports.map((rep) => (
                    <div key={rep.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono text-[11px]">{rep.id}</span>
                        <span className="text-[10px] text-slate-500">{new Date(rep.confirmedAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-700 italic">&quot;{rep.rawReport}&quot;</p>
                      <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                          Confirmed by: {rep.confirmedBy}
                        </span>
                        {rep.explicitEvidence.freeChlorineMgL !== null && (
                          <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold">
                            Chlorine: {rep.explicitEvidence.freeChlorineMgL} mg/L
                          </span>
                        )}
                        {rep.explicitEvidence.pressurePsi !== null && (
                          <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 font-bold">
                            Pressure: {rep.explicitEvidence.pressurePsi} psi
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Fault: {rep.suspectedFault.status} ({rep.suspectedFault.description})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GATED AUTHORIZATION SIGN-OFF */}
          <div id="authorization-sign-off" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Supervisor Release Authorization Sign-Off</span>
              </h3>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                isEligibleForApproval
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : currentEvent.state === 'RESTORED'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {isEligibleForApproval ? 'Ready for Signature' : currentEvent.state === 'RESTORED' ? 'Restored' : 'Blocked by Safety Policy'}
              </span>
            </div>

            {!isEligibleForApproval && currentEvent.state !== 'RESTORED' && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Release authorization blocked by safety protocol:</span>
                  <p className="mt-0.5 text-amber-800">
                    Mandatory physical verification criteria have not been satisfied (minimum 0.20 mg/L chlorine residual, 15-minute scour flush, or pipe repair inspection). You may enforce HOLD or request additional field sampling below.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Authorized Operator Name:
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-xs focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Authorization Role:
                </label>
                <select
                  value={supervisorRole}
                  onChange={(e) =>
                    setSupervisorRole(e.target.value as 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER')
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-xs focus:border-sky-500"
                >
                  <option value="SUPERVISOR">Distribution Operations Supervisor</option>
                  <option value="CHIEF_WATER_ENGINEER">Chief Water Works Engineer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium text-xs mb-1">
                Decision Rationale (Permanent Audit Log Entry):
              </label>
              <textarea
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-sky-500"
              />
            </div>

            {/* Statutory Checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={(e) => setComplianceChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I hereby certify under statutory municipal guidelines that physical line scouring was executed and free chlorine residual was verified &ge; 0.20 mg/L prior to authorizing water release.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('APPROVE')}
                disabled={isSubmitting || !isEligibleForApproval || !complianceChecked}
                className="w-full sm:w-1/2 min-h-[48px] py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 border border-transparent"
                title={
                  !isEligibleForApproval
                    ? 'Blocked: Mandatory field verification evidence is incomplete or failed'
                    : !complianceChecked
                    ? 'Please check the statutory certification box above'
                    : 'Authorize release of drinking water'
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize Service Restoration</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REQUEST_MORE_VERIFICATION')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 min-h-[48px] py-3 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Request More Checks</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REJECT_HOLD')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 min-h-[48px] py-3 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Enforce HOLD</span>
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-lg border text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          {/* SUPERVISOR OPERATIONAL INTELLIGENCE CONSOLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Operational Intelligence & Root-Cause Investigation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Amazon Bedrock Nova Micro intelligence layer grounded in actual telemetry and field records
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchIncidentBrief}
                  disabled={briefLoading}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  {briefLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Brief...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Incident Brief</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={fetchInvestigation}
                  disabled={investigationLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {investigationLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing Clues...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Analyze Root Causes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-purple-800 bg-purple-50/60 px-3 py-1.5 rounded-lg border border-purple-200/50">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Advisory Intelligence Layer (Amazon Bedrock Nova Micro) • Operational hypotheses are unconfirmed suggestions and do not override physical engineering gates.</span>
            </div>

            {/* AI INCIDENT INTELLIGENCE BRIEF DISPLAY */}
            {brief && (
              <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200 text-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Incident Intelligence Brief
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-medium">
                    {brief.sourceLabel}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold text-[11px] uppercase block">Executive Summary:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">{brief.incidentSummary}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">{brief.timeline}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Verified Observations */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Physical Observations:</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                      {brief.verifiedObservations.map((obs, i) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suspected Unconfirmed Causes */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-800 uppercase flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Suspected Causes (Unconfirmed):</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                      {brief.suspectedUnconfirmedCauses.length > 0 ? (
                        brief.suspectedUnconfirmedCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">No secondary pipe defects reported.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Supervisor Review Focus */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-900 uppercase">
                    Mandatory Review Focus Before Authorization:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                    {brief.supervisorReviewFocus.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ROOT CAUSE INVESTIGATION HYPOTHESES DISPLAY */}
            {investigation && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-sky-700" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Root-Cause Investigation Hypotheses ({investigation.hypotheses.length})
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                    {investigation.sourceLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {investigation.hypotheses.map((hyp) => (
                    <div key={hyp.id} className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{hyp.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            hyp.likelihood === 'HIGH'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : hyp.likelihood === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Likelihood: {hyp.likelihood}
                        </span>
                      </div>

                      <p className="text-slate-700 text-[11px] leading-relaxed">{hyp.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <strong className="text-slate-800 block text-[10px] uppercase">Supporting Evidence:</strong>
                          <ul className="list-disc pl-3 text-slate-600 space-y-0.5 mt-0.5">
                            {hyp.supportingEvidence.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <strong className="text-slate-800 block text-[10px] uppercase">Required Verification:</strong>
                          <ul className="list-disc pl-3 text-slate-600 space-y-0.5 mt-0.5">
                            {hyp.suggestedVerificationSteps.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 italic flex items-center space-x-1 pt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Limitations: {hyp.limitations}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY COLLAPSIBLE DRAWER: TECHNICAL SENSOR LOGS & SCADA DATA */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowTechnicalDrawer(!showTechnicalDrawer)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-slate-500" />
                <span>Technical Telemetry & SCADA Sensor Logs (Engine Rules & Pressure Curves)</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-xs">
                <span>{showTechnicalDrawer ? 'Hide Details' : 'View SCADA Data'}</span>
                {showTechnicalDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showTechnicalDrawer && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 text-xs space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase">Min Observed Pressure</span>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currentEvent.minimumObservedPressurePsi.toFixed(1)} psi
                    </div>
                    <span className="text-[10px] text-slate-400">&lt; 15 psi = Back-siphon risk</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase">Shutoff Duration</span>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currentEvent.interruptionDurationHours.toFixed(1)} hrs
                    </div>
                    <span className="text-[10px] text-slate-400">Stagnancy risk window</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase">Turbidity</span>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currentZone.currentTelemetry.turbidityNtu?.toFixed(2) || '0.35'} NTU
                    </div>
                    <span className="text-[10px] text-slate-400">Standard: &lt;= 1.0 NTU</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase">Risk Engine Score</span>
                    <div className="text-base font-bold text-purple-700 mt-1">
                      {currentEvent.riskEvaluation.score} / 100
                    </div>
                    <span className="text-[10px] text-slate-400">Level: {currentEvent.riskEvaluation.level}</span>
                  </div>
                </div>

                {/* Risk contributors breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                    Deterministic Risk Engine Rule Breakdown:
                  </h4>
                  <div className="space-y-1.5">
                    {currentEvent.riskEvaluation.contributors.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-800">{c.explanation}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.severity === 'HIGH'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY COLLAPSIBLE DRAWER: AI FIELD NOTE COPILOT */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowCopilotDrawer(!showCopilotDrawer)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Evidence Copilot — Unstructured Field Note Structuring</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-xs">
                <span>{showCopilotDrawer ? 'Hide Copilot' : 'Open Copilot'}</span>
                {showCopilotDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showCopilotDrawer && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 animate-in fade-in duration-150">
                <FieldReportCopilot
                  activeEventId={currentEvent.id}
                  activeZoneId={currentZone?.id}
                  onReportCommitted={fetchIncidentBrief}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
