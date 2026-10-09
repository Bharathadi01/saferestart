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
  Activity,
  AlertTriangle,
  ClipboardList,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  Droplet,
  Info,
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
        <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
          Loading Zone SCADA Telemetry & Graph Topology...
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center font-mono text-sm text-slate-500">
          Zone {zoneId} not found in current network topology.
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
              className="inline-flex items-center text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Operations Matrix</span>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold font-mono text-slate-100 tracking-tight">
                {zone.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {zone.code}
              </span>
              <StatusBadge state={zone.operationalState} size="md" />
            </div>
            <p className="text-xs font-mono text-slate-400 max-w-2xl">{zone.description}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {zone.operationalState === 'INTERRUPTED' && (
              <button
                onClick={() => requestRestart(zone.id)}
                className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-medium transition-colors"
              >
                Assess Restart
              </button>
            )}
            {(zone.operationalState === 'NORMAL' || zone.operationalState === 'RESTORED') && (
              <button
                onClick={() => triggerInterruption(zone.id)}
                className="px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono font-medium transition-colors flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Supply Cut</span>
              </button>
            )}
            {activeEvent && (
              <Link
                href={`/events/${activeEvent.id}`}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
              >
                <span>Workflow: {activeEvent.id}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Top Operational Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 text-[10px] uppercase">Observed Pressure</span>
            <div className="text-base font-bold text-slate-200 mt-0.5">
              {zone.currentTelemetry.pressurePsi.toFixed(1)} psi
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 text-[10px] uppercase">Telemetry Flow Rate</span>
            <div className="text-base font-bold text-slate-200 mt-0.5">
              {zone.currentTelemetry.flowLps.toFixed(1)} L/s
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 text-[10px] uppercase">Free Chlorine Residual</span>
            <div className="text-base font-bold text-slate-200 mt-0.5">
              {zone.currentTelemetry.chlorineMgL !== undefined
                ? `${zone.currentTelemetry.chlorineMgL.toFixed(2)} mg/L`
                : 'Measurement Missing'}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 text-[10px] uppercase">Evidence Completeness</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {zone.evidenceCompletenessPercent}%
            </div>
          </div>
        </div>

        {/* Active Incidents Banner */}
        {zone.incidents.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-900/60 rounded-lg p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ACTIVE REPORTED INFRASTRUCTURE BREACHES ({zone.incidents.length})</span>
            </div>
            {zone.incidents.map((inc) => (
              <div key={inc.id} className="p-2.5 rounded bg-slate-950 border border-rose-950 text-slate-300">
                <div className="font-semibold text-rose-300 flex items-center justify-between">
                  <span>{inc.type}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-rose-900 text-rose-100">
                    {inc.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{inc.description}</p>
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
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 font-mono text-xs text-slate-400 flex flex-col items-center justify-center text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <div className="font-bold text-slate-200">Zone Operating Nominally</div>
              <p>No active restart event or emergency hold is associated with this distribution sector.</p>
            </div>
          )}
        </div>

        {/* Time-Series Charts */}
        <TelemetryCharts
          telemetryHistory={zone.telemetryHistory}
          currentReading={zone.currentTelemetry}
        />

        {/* Audit Stream for this Zone */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold uppercase tracking-wider text-slate-200">
              Zone Event & Lifecycle Audit Log ({audits.length})
            </h3>
          </div>

          <div className="space-y-2">
            {audits.map((a) => (
              <div
                key={a.id}
                className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="font-bold text-cyan-400">{a.action}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{a.actor} ({a.actorRole})</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{a.decisionReason}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
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
