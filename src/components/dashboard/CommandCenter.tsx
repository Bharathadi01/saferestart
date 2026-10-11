'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle2,
  AlertOctagon,
  ClipboardList,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingDown,
  Droplets,
  Gauge,
  FlaskConical,
  Filter,
  ExternalLink,
  Zap,
  PlayCircle,
  HelpCircle,
  ShieldCheck,
  History,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WaterZone, RestartEvent, AuditEvent } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';
import { NextActionCard } from '../ui/NextActionCard';
import { DEMO_THRESHOLDS } from '@/lib/constants';

interface CommandCenterProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  recentAudits: AuditEvent[];
  onTriggerInterruption?: (zoneId: string) => void;
  onInitiateRestart?: (zoneId: string) => void;
}

export function CommandCenter({
  zones,
  events,
  recentAudits,
  onTriggerInterruption,
  onInitiateRestart,
}: CommandCenterProps) {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HOLD' | 'VERIFICATION' | 'APPROVAL' | 'NORMAL'>('ALL');
  const [showLifecycleGuide, setShowLifecycleGuide] = useState(false);

  // Operational counts
  const totalZones = zones.length;
  const holdZones = zones.filter((z) => z.operationalState === 'HOLD');
  const approvalZones = zones.filter((z) => z.operationalState === 'AWAITING_APPROVAL');
  const verificationZones = zones.filter((z) => z.operationalState === 'VERIFICATION_REQUIRED' || z.operationalState === 'INTERRUPTED');
  const normalZones = zones.filter((z) => z.operationalState === 'NORMAL' || z.operationalState === 'RESTORED');

  const filteredZones = zones.filter((z) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'HOLD') return z.operationalState === 'HOLD';
    if (selectedFilter === 'VERIFICATION') return z.operationalState === 'VERIFICATION_REQUIRED' || z.operationalState === 'INTERRUPTED';
    if (selectedFilter === 'APPROVAL') return z.operationalState === 'AWAITING_APPROVAL';
    if (selectedFilter === 'NORMAL') return z.operationalState === 'NORMAL' || z.operationalState === 'RESTORED';
    return true;
  });

  // Calculate highest-priority Next Action for the operations overview
  const highestPriorityAction = (() => {
    // 1. Critical Holds (e.g. Zone 1 active crack or Zone 5 depressurized)
    if (holdZones.length > 0) {
      const topHold = holdZones[0];
      const evt = topHold.activeRestartEventId ? events[topHold.activeRestartEventId] : undefined;
      const missing = evt?.riskEvaluation?.missingEvidence || ['chlorine residual measurement', 'pipe repair verification'];
      return {
        safetyStatus: 'HOLD' as const,
        situation: `${topHold.name} (${topHold.code}) is under an enforced safety hold. Risk score: ${evt?.riskEvaluation?.score || 85}/100. Back-siphonage floor breached (<15.0 psi).`,
        safetyLabel: `ACTIVE SAFETY HOLD — ${holdZones.length} SECTOR(S) BLOCKED`,
        nextAction: `Dispatch field crew to ${topHold.name} for scour flushing and terminal DPD chlorine testing.`,
        actionRationale: 'Water lines cannot be recharged while stagnant or unverified. Missing evidence: ' + missing.map((m) => m.replace(/_/g, ' ')).join(', ') + '.',
        responsibleRole: 'Field Technician & Water Quality Specialist',
        evidenceNotes: [
          `Observed line pressure: ${topHold.currentTelemetry.pressurePsi.toFixed(1)} psi (Ingress hazard <= 15.0 psi)`,
          `Chlorine residual: ${topHold.currentTelemetry.chlorineMgL !== undefined ? `${topHold.currentTelemetry.chlorineMgL.toFixed(2)} mg/L` : 'Unverified on file (NULL)'}`,
          '15-minute terminal hydrant scour flush required prior to sampling',
        ],
        actionButton: {
          label: 'Open Field Checklist',
          href: '/field',
          variant: 'danger' as const,
        },
        secondaryButton: {
          label: `Inspect ${topHold.code} Network Topology`,
          href: `/zones/${topHold.id}`,
        },
      };
    }

    // 2. Awaiting Supervisor Approval (e.g. Zone 4 with passing verification)
    if (approvalZones.length > 0) {
      const topApproval = approvalZones[0];
      const evt = topApproval.activeRestartEventId ? events[topApproval.activeRestartEventId] : undefined;
      const sub = evt?.verificationSubmission;
      return {
        safetyStatus: 'PROCEED' as const,
        situation: `${topApproval.name} (${topApproval.code}) has satisfied all physical field checks and is awaiting statutory authorization.`,
        safetyLabel: `READY FOR SUPERVISOR SIGN-OFF — ${approvalZones.length} SECTOR(S)`,
        nextAction: `Chief Water Engineer must review chlorine residual (${sub?.freeChlorineMgL?.toFixed(2) || '0.45'} mg/L) and sign off on restart.`,
        actionRationale: 'Field tasks completed and verified against statutory floors. Awaiting accountable supervisor attribution.',
        responsibleRole: 'Chief Water Engineer / Operations Supervisor',
        evidenceNotes: [
          `Free chlorine residual: ${sub?.freeChlorineMgL?.toFixed(2) || '0.45'} mg/L (Passes >= 0.20 mg/L minimum floor)`,
          'Hydrant scour flush completed (15 min cleared)',
          'Physical pipe integrity and zero-leakage verified',
        ],
        actionButton: {
          label: 'Review & Authorize Restart',
          href: '/supervisor',
          variant: 'teal' as const,
        },
        secondaryButton: {
          label: 'View Audit History',
          href: '/audit',
        },
      };
    }

    // 3. Verification Needed
    if (verificationZones.length > 0) {
      const topVerif = verificationZones[0];
      return {
        safetyStatus: 'CAUTION' as const,
        situation: `${topVerif.name} (${topVerif.code}) is depressurized following supply interruption.`,
        safetyLabel: 'FIELD VERIFICATION IN PROGRESS',
        nextAction: 'Complete terminal sampling and verify line disinfection residual before initiating recharge.',
        actionRationale: 'Awaiting field crew inspection results and DPD colorimeter measurement.',
        responsibleRole: 'Field Technician',
        actionButton: {
          label: 'Open Field Verification',
          href: '/field',
          variant: 'primary' as const,
        },
      };
    }

    // 4. All Normal
    return {
      safetyStatus: 'STABLE' as const,
      situation: 'All municipal water distribution sectors are operating under continuous positive pressure within normal parameters.',
      safetyLabel: 'ALL SECTORS NOMINAL',
      nextAction: 'Routine telemetry monitoring active. No restart actions required at this time.',
      responsibleRole: 'SCADA Dispatcher',
      actionButton: {
        label: 'View Network Topology',
        href: '/zones/zone-1',
        variant: 'secondary' as const,
      },
    };
  })();

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Operations Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Municipal Network Triage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time status of distribution sectors, active safety holds, and pending restart actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLifecycleGuide(!showLifecycleGuide)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>{showLifecycleGuide ? 'Hide Safety Lifecycle' : 'How SafeRestart Works'}</span>
          {showLifecycleGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Primary Next Action Section */}
      <NextActionCard
        situation={highestPriorityAction.situation}
        safetyStatus={highestPriorityAction.safetyStatus}
        safetyLabel={highestPriorityAction.safetyLabel}
        nextAction={highestPriorityAction.nextAction}
        actionRationale={highestPriorityAction.actionRationale}
        responsibleRole={highestPriorityAction.responsibleRole}
        evidenceNotes={highestPriorityAction.evidenceNotes}
        actionButton={highestPriorityAction.actionButton}
        secondaryButton={highestPriorityAction.secondaryButton}
      />

      {/* 3. Intermittent Water Supply Safety Lifecycle Explainer (Collapsible) */}
      {showLifecycleGuide && (
        <section
          aria-label="Intermittent Supply Protocol"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>The 5-Stage Intermittent Water Supply (IWS) Safety Gate</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                When water lines depressurize, negative pressure aspirates surrounding groundwater and sewage through cracked joints (back-siphonage). SafeRestart prevents contaminated water from reaching consumers by enforcing a strict, evidence-based progression:
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Standard Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">1. Interruption</span>
              <p className="font-semibold text-slate-900">Pressure Collapse</p>
              <p className="text-slate-600 text-[11px]">Sub-atmospheric floor (&lt;15 psi) triggers back-siphonage alert.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">2. Rules Engine</span>
              <p className="font-semibold text-slate-900">Automatic HOLD</p>
              <p className="text-slate-600 text-[11px]">Deterministic safety rules block recharge until evidence is verified.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">3. Field Work</span>
              <p className="font-semibold text-slate-900">Purge & Test</p>
              <p className="text-slate-600 text-[11px]">Field crews flush stagnant biofilm and verify free chlorine &ge;0.20 mg/L.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">4. Supervisor Gate</span>
              <p className="font-semibold text-slate-900">Accountable Sign-Off</p>
              <p className="text-slate-600 text-[11px]">Chief Engineer validates evidence chain and authorizes valve restart.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">5. Audit Trail</span>
              <p className="font-semibold text-slate-900">Permanent Record</p>
              <p className="text-slate-600 text-[11px]">Immutable regulatory event log with actor attribution and timestamps.</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Actionable Queue Triage Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setSelectedFilter('HOLD')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'HOLD'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Active Holds</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{holdZones.length}</span>
            <span className="text-[11px] font-semibold text-rose-700">Immediate Hazard</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('APPROVAL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'APPROVAL'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Awaiting Sign-off</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{approvalZones.length}</span>
            <span className="text-[11px] font-semibold text-purple-700">Supervisor Queue</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('VERIFICATION')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'VERIFICATION'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Checks In Progress</span>
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{verificationZones.length}</span>
            <span className="text-[11px] font-semibold text-amber-700">Field Dispatched</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('NORMAL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'NORMAL'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Normal Supply</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{normalZones.length}</span>
            <span className="text-[11px] font-semibold text-teal-700">Nominal Pressure</span>
          </div>
        </button>
      </div>

      {/* 5. Distribution Sectors Triage Table */}
      <section
        aria-label="Distribution Sectors Table"
        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>Distribution Sector Assessment Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredZones.length} of {totalZones} monitored sectors
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            {(['ALL', 'HOLD', 'APPROVAL', 'VERIFICATION', 'NORMAL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {filter === 'ALL' ? 'All Sectors' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-medium">
                <th className="py-3 px-4">Sector / Zone Code</th>
                <th className="py-3 px-4">Operational State</th>
                <th className="py-3 px-4">Pressure</th>
                <th className="py-3 px-4">Free Chlorine</th>
                <th className="py-3 px-4">Active Incident / Condition</th>
                <th className="py-3 px-4 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredZones.map((zone) => {
                const activeEvent = zone.activeRestartEventId
                  ? events[zone.activeRestartEventId]
                  : undefined;
                const pressure = zone.currentTelemetry.pressurePsi;
                const chlorine = zone.currentTelemetry.chlorineMgL;
                const isPressureCritical = pressure < DEMO_THRESHOLDS.CRITICAL_LOW_PRESSURE_PSI;
                const activeIncident = zone.incidents.find((i) => !i.isResolved);

                return (
                  <tr key={zone.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Zone Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        <Link href={`/zones/${zone.id}`} className="hover:text-sky-700 transition-colors">
                          {zone.name}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span className="font-mono text-slate-700">{zone.code}</span>
                        <span>•</span>
                        <span>Pop: {zone.populationServed.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge state={zone.operationalState} size="sm" />
                    </td>

                    {/* Pressure */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 font-medium">
                        <Gauge
                          className={`w-3.5 h-3.5 ${
                            isPressureCritical ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        />
                        <span className={isPressureCritical ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                          {pressure.toFixed(1)} psi
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isPressureCritical ? 'Ingress hazard (<15 psi)' : 'Continuous supply'}
                      </div>
                    </td>

                    {/* Chlorine */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {chlorine !== undefined ? (
                        <div>
                          <div className="flex items-center space-x-1.5 font-medium">
                            <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
                            <span
                              className={
                                chlorine < DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L
                                  ? 'text-rose-700 font-bold'
                                  : 'text-teal-700 font-semibold'
                              }
                            >
                              {chlorine.toFixed(2)} mg/L
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {chlorine < 0.20 ? 'Depleted (<0.20 floor)' : 'Satisfies safety floor'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Unverified (NULL)
                        </span>
                      )}
                    </td>

                    {/* Active Incident / Condition */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {activeIncident ? (
                        <span className="text-rose-900 font-medium">
                          {activeIncident.description}
                        </span>
                      ) : activeEvent ? (
                        <span>
                          Restart event {activeEvent.id} ({activeEvent.interruptionDurationHours.toFixed(1)}h outage)
                        </span>
                      ) : (
                        <span className="text-slate-400">Zero active defects reported</span>
                      )}
                    </td>

                    {/* Operational Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {zone.operationalState === 'HOLD' || zone.operationalState === 'VERIFICATION_REQUIRED' ? (
                          <Link
                            href="/field"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-2xs"
                          >
                            <span>Field Checklist</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : zone.operationalState === 'AWAITING_APPROVAL' ? (
                          <Link
                            href="/supervisor"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <span>Supervisor Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : zone.operationalState === 'INTERRUPTED' ? (
                          <button
                            type="button"
                            onClick={() => onInitiateRestart?.(zone.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors shadow-2xs"
                          >
                            <span>Assess Restart</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onTriggerInterruption?.(zone.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs transition-colors"
                            title="Simulate sudden supply shutoff in this zone"
                          >
                            <Zap className="w-3 h-3 text-rose-600" />
                            <span>Simulate Cut</span>
                          </button>
                        )}

                        <Link
                          href={`/zones/${zone.id}`}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs transition-colors"
                          title="View zone topology and telemetry history"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Recent Operational Events Stream */}
      <section
        aria-label="Audit Activity Stream"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Operational Events
            </h3>
          </div>
          <Link
            href="/audit"
            className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center space-x-1"
          >
            <span>View Full Audit History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentAudits.slice(0, 4).map((audit) => (
            <div key={audit.id} className="py-2.5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{audit.actor}</span>
                  <span className="text-[10px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                    {audit.actorRole}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-700">{audit.action}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{audit.decisionReason}</p>
              </div>
              <div className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">
                {new Date(audit.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
