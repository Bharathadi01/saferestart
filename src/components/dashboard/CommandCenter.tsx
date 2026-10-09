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
} from 'lucide-react';
import { WaterZone, RestartEvent, AuditEvent } from '@/types';
import { MetricCard } from '../ui/MetricCard';
import { StatusBadge } from '../ui/StatusBadge';

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
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Compute operational statistics
  const totalZones = zones.length;
  const normalCount = zones.filter((z) => z.operationalState === 'NORMAL' || z.operationalState === 'RESTORED').length;
  const interruptedCount = zones.filter((z) => z.operationalState === 'INTERRUPTED').length;
  const holdCount = zones.filter((z) => z.operationalState === 'HOLD').length;
  const verificationCount = zones.filter((z) => z.operationalState === 'VERIFICATION_REQUIRED').length;
  const approvalCount = zones.filter((z) => z.operationalState === 'AWAITING_APPROVAL').length;

  const filteredZones = zones.filter((z) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'HOLD') return z.operationalState === 'HOLD';
    if (selectedFilter === 'VERIFICATION') return z.operationalState === 'VERIFICATION_REQUIRED';
    if (selectedFilter === 'APPROVAL') return z.operationalState === 'AWAITING_APPROVAL';
    if (selectedFilter === 'NORMAL') return z.operationalState === 'NORMAL' || z.operationalState === 'RESTORED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Zones"
          value={totalZones}
          subtext="Simulated DMA network"
          icon={Layers}
          variant="default"
          onClick={() => setSelectedFilter('ALL')}
        />
        <MetricCard
          label="Restart Holds"
          value={holdCount}
          subtext="Action required / Risk blocked"
          icon={AlertOctagon}
          variant="danger"
          badge="CRITICAL"
          onClick={() => setSelectedFilter('HOLD')}
        />
        <MetricCard
          label="Awaiting Checks"
          value={verificationCount}
          subtext="Field tasks dispatched"
          icon={ClipboardList}
          variant="warning"
          onClick={() => setSelectedFilter('VERIFICATION')}
        />
        <MetricCard
          label="Pending Approval"
          value={approvalCount}
          subtext="Supervisor sign-off needed"
          icon={ShieldAlert}
          variant="info"
          onClick={() => setSelectedFilter('APPROVAL')}
        />
        <MetricCard
          label="Interrupted"
          value={interruptedCount}
          subtext="Supply cut active"
          icon={TrendingDown}
          variant="default"
        />
        <MetricCard
          label="Normal Supply"
          value={normalCount}
          subtext="Pressurized & nominal"
          icon={CheckCircle2}
          variant="success"
          onClick={() => setSelectedFilter('NORMAL')}
        />
      </div>

      {/* Critical Attention Alert: Zones on HOLD */}
      {holdCount > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-rose-900/40 text-rose-400 mt-0.5">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200 font-mono flex items-center gap-2">
                <span>RESTART SAFETY HOLD ACTIVE IN {holdCount} ZONE(S)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-200">
                  DECISION SUPPORT GATE
                </span>
              </h3>
              <p className="text-xs text-rose-300/80 mt-1">
                Depressurization hazards, active unisolated leaks, or missing disinfection residual prevent automatic recharge. Manual field verification is strictly enforced before restoration.
              </p>
            </div>
          </div>
          <Link
            href="/field"
            className="shrink-0 px-3 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
          >
            <span>Open Field Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Zones Overview Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Distribution Zone Assessment Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Real-time simulated telemetry, evidence completeness, and operational lifecycle state
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
            {(['ALL', 'HOLD', 'VERIFICATION', 'APPROVAL', 'NORMAL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  selectedFilter === filter
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Zone / DMA Code</th>
                <th className="py-3 px-4">Current State</th>
                <th className="py-3 px-4">Pressure (psi)</th>
                <th className="py-3 px-4">Flow (L/s)</th>
                <th className="py-3 px-4">Free Chlorine</th>
                <th className="py-3 px-4">Evidence Completeness</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredZones.map((zone) => {
                const activeEvent = zone.activeRestartEventId
                  ? events[zone.activeRestartEventId]
                  : undefined;
                const pressure = zone.currentTelemetry.pressurePsi;
                const chlorine = zone.currentTelemetry.chlorineMgL;
                const isPressureCritical = pressure < 15.0;

                return (
                  <tr
                    key={zone.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Zone Identifier */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        <Link href={`/zones/${zone.id}`}>{zone.name}</Link>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{zone.code}</span>
                        <span>•</span>
                        <span>Pop: {zone.populationServed.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Operational State */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge state={zone.operationalState} size="sm" />
                      {activeEvent && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Evt: {activeEvent.id}
                        </div>
                      )}
                    </td>

                    {/* Pressure Reading */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Gauge
                          className={`w-3.5 h-3.5 ${
                            isPressureCritical ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        />
                        <span
                          className={`font-semibold ${
                            isPressureCritical ? 'text-rose-400' : 'text-slate-200'
                          }`}
                        >
                          {pressure.toFixed(1)} psi
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isPressureCritical ? 'Depressurized' : 'Nominal'}
                      </div>
                    </td>

                    {/* Flow Reading */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-200">
                        {zone.currentTelemetry.flowLps.toFixed(1)} L/s
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Bulk demand</div>
                    </td>

                    {/* Chlorine Reading */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {chlorine !== undefined ? (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                            <span
                              className={`font-semibold ${
                                chlorine < 0.2
                                  ? 'text-rose-400'
                                  : chlorine < 0.5
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {chlorine.toFixed(2)} mg/L
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {chlorine < 0.2 ? 'Below threshold' : 'Compliant'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900 text-[10px]">
                          MEASUREMENT MISSING
                        </span>
                      )}
                    </td>

                    {/* Evidence Completeness */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              zone.evidenceCompletenessPercent === 100
                                ? 'bg-emerald-500'
                                : zone.evidenceCompletenessPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${zone.evidenceCompletenessPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300">
                          {zone.evidenceCompletenessPercent}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {zone.evidenceCompletenessPercent === 100
                          ? 'Fully documented'
                          : 'Gaps identified'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {zone.operationalState === 'INTERRUPTED' && (
                          <button
                            onClick={() => onInitiateRestart?.(zone.id)}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs transition-colors font-medium"
                          >
                            Assess Restart
                          </button>
                        )}
                        {(zone.operationalState === 'NORMAL' || zone.operationalState === 'RESTORED') && (
                          <button
                            onClick={() => onTriggerInterruption?.(zone.id)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition-colors font-medium flex items-center space-x-1"
                            title="Simulate pressure loss / supply isolation"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Cut Supply</span>
                          </button>
                        )}
                        <Link
                          href={`/zones/${zone.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent System & Audit Events Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Operational Audit & Transition Stream
            </h3>
          </div>
          <Link
            href="/audit"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View Complete Immutable Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {recentAudits.slice(0, 5).map((audit) => (
            <div key={audit.id} className="py-2.5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">{audit.actor}</span>
                  <span className="text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {audit.actorRole}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-cyan-400 text-[11px]">{audit.action}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-snug">{audit.decisionReason}</p>
              </div>
              <div className="shrink-0 text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(audit.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
