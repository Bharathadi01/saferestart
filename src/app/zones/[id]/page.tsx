'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { NetworkGraph } from '@/components/zone/NetworkGraph';
import { TelemetryCharts } from '@/components/zone/TelemetryCharts';
import { RiskPanel } from '@/components/zone/RiskPanel';
import { useSimulationState } from '@/lib/useSimulationState';
import {
  ArrowLeft,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap,
} from 'lucide-react';

export default function ZoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const zoneId = resolvedParams.id;

  const {
    zones,
    restartEvents,
    auditTrail,
    loading,
    resetSimulation,
    advanceSimulation,
    triggerInterruption,
    requestRestart,
  } = useSimulationState(3000);

  const zone = zones.find((z) => z.id === zoneId);
  const activeEvent = zone?.activeRestartEventId
    ? restartEvents[zone.activeRestartEventId]
    : undefined;
  const audits = auditTrail.filter((a) => a.zoneId === zoneId);

  if (loading && !zone) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500 animate-pulse">
          Loading zone data...
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-600">
          Zone {zoneId} not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation
        onReset={resetSimulation}
        onAdvance={() => advanceSimulation(1)}
        onTriggerInterruption={() => triggerInterruption('zone-5')}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center text-xs text-sky-700 hover:text-sky-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Field Zones</span>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {zone.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {zone.code}
              </span>
              <StatusBadge state={zone.operationalState} size="md" />
            </div>
            <p className="text-sm text-slate-600 max-w-2xl">{zone.description}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {zone.operationalState === 'INTERRUPTED' && (
              <button
                onClick={() => requestRestart(zone.id)}
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Assess Restart
              </button>
            )}
            {(zone.operationalState === 'NORMAL' || zone.operationalState === 'RESTORED') && (
              <button
                onClick={() => triggerInterruption(zone.id)}
                className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Supply Cut</span>
              </button>
            )}
            {activeEvent && (
              <Link
                href={`/events/${activeEvent.id}`}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Workflow Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Top Operational Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-xs uppercase font-medium">Observed Pressure</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {zone.currentTelemetry.pressurePsi.toFixed(1)} psi
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-xs uppercase font-medium">Flow Rate</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {zone.currentTelemetry.flowLps.toFixed(1)} L/s
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-xs uppercase font-medium">Free Chlorine Residual</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {zone.currentTelemetry.chlorineMgL !== undefined
                ? `${zone.currentTelemetry.chlorineMgL.toFixed(2)} mg/L`
                : 'Measurement Missing'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-xs uppercase font-medium">Evidence Completeness</span>
            <div className="text-xl font-bold text-sky-700 mt-1">
              {zone.evidenceCompletenessPercent}%
            </div>
          </div>
        </div>

        {/* Active Incidents Banner */}
        {zone.incidents.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>ACTIVE REPORTED INFRASTRUCTURE BREACHES ({zone.incidents.length})</span>
            </div>
            {zone.incidents.map((inc) => (
              <div key={inc.id} className="p-3 rounded-lg bg-white border border-rose-200 text-slate-800">
                <div className="font-semibold text-rose-900 flex items-center justify-between text-xs">
                  <span>{inc.type}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                    {inc.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{inc.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Grid: Topology Graph & Risk Engine Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetworkGraph
            nodes={zone.nodes}
            pipes={zone.pipes}
            zoneName={zone.name}
          />

          {activeEvent ? (
            <RiskPanel
              riskEvaluation={activeEvent.riskEvaluation}
              eventId={activeEvent.id}
              zoneName={zone.name}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-xs text-slate-600 flex flex-col items-center justify-center text-center space-y-2 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
              <div className="text-base font-bold text-slate-900">Zone Operating Normally</div>
              <p className="max-w-sm text-slate-500">
                No active restart event or emergency hold is associated with this distribution sector.
              </p>
            </div>
          )}
        </div>

        {/* Time-Series Charts */}
        <TelemetryCharts
          telemetryHistory={zone.telemetryHistory}
          currentReading={zone.currentTelemetry}
        />

        {/* Audit Stream for this Zone */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-sky-700" />
            <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
              Zone Event & Safety Audit Log ({audits.length})
            </h3>
          </div>

          <div className="space-y-2">
            {audits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-sky-800">{a.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700">{a.actor} ({a.actorRole})</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">{a.decisionReason}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
