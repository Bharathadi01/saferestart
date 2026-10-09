'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  Layers,
  Calendar,
} from 'lucide-react';
import { RestartEvent, WaterZone, AuditEvent } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';

interface RestartEventDetailProps {
  event: RestartEvent;
  zone: WaterZone;
  audits: AuditEvent[];
}

export function RestartEventDetail({ event, zone, audits }: RestartEventDetailProps) {
  // Steps in the operational lifecycle
  const steps = [
    {
      id: 'INTERRUPTED',
      label: 'Supply Interruption',
      desc: 'Observed pressure fall & supply suspension',
      isCompleted: true,
      time: event.interruptionStartedAt,
    },
    {
      id: 'EVALUATION',
      label: 'Risk Assessment',
      desc: `${event.riskEvaluation.level} risk (${event.riskEvaluation.score}/100) -> ${event.riskEvaluation.action}`,
      isCompleted: true,
      time: event.riskEvaluation.calculatedAt,
    },
    {
      id: 'VERIFICATION',
      label: 'Field Verification',
      desc: `${event.fieldTasks.filter((t) => t.status === 'COMPLETED').length}/${event.fieldTasks.length} tasks completed`,
      isCompleted:
        event.state === 'AWAITING_APPROVAL' ||
        event.state === 'RESTORED' ||
        !!event.verificationSubmission,
      current: event.state === 'VERIFICATION_REQUIRED' || event.state === 'HOLD',
      time: event.verificationSubmission?.timestamp,
    },
    {
      id: 'SUPERVISOR',
      label: 'Supervisor Authorization',
      desc: event.supervisorDecision
        ? `${event.supervisorDecision.decision} by ${event.supervisorDecision.supervisorName}`
        : 'Mandatory sign-off prior to release',
      isCompleted: event.state === 'RESTORED',
      current: event.state === 'AWAITING_APPROVAL',
      time: event.supervisorDecision?.timestamp,
    },
    {
      id: 'RESTORED',
      label: 'Service Restored',
      desc: 'Zone recharged and released to normal supply',
      isCompleted: event.state === 'RESTORED',
      current: false,
      time: event.state === 'RESTORED' ? event.updatedAt : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Event Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>Event ID: {event.id}</span>
              <span>•</span>
              <span>Zone: {zone.name} ({zone.code})</span>
            </div>
            <div className="flex items-center space-x-3 mt-1.5">
              <StatusBadge state={event.state} size="lg" />
              <span className="text-xs font-mono text-slate-400">
                Duration: <span className="font-bold text-slate-200">{event.interruptionDurationHours.toFixed(1)} hrs</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {event.state === 'VERIFICATION_REQUIRED' || event.state === 'HOLD' ? (
              <Link
                href="/field"
                className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
              >
                <span>Enter Field Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : event.state === 'AWAITING_APPROVAL' ? (
              <Link
                href="/supervisor"
                className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
              >
                <span>Review & Sign Off</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border font-mono text-xs transition-colors ${
                  step.isCompleted
                    ? 'bg-slate-950 border-emerald-900/60 text-slate-200'
                    : step.current
                    ? 'bg-cyan-950/30 border-cyan-700/80 text-cyan-100 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-bold">
                    STEP 0{idx + 1}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : step.current ? (
                    <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <div className="font-semibold text-slate-200 text-xs mt-1">{step.label}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{step.desc}</p>
                {step.time && (
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">
                    {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Tasks Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <ClipboardList className="w-4 h-4 text-cyan-400" />
          <span>Mandatory Verification Field Directives ({event.fieldTasks.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {event.fieldTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-950/10 border-emerald-900/50 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {task.assignedRole}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-900 text-emerald-300'
                        : 'bg-amber-900/60 text-amber-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-200">{task.title}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{task.description}</p>
              </div>

              {task.measurementsRecorded && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] space-y-0.5 text-slate-400">
                  {task.measurementsRecorded.chlorineMgL !== undefined && (
                    <div>Free Chlorine: <span className="font-bold text-emerald-400">{task.measurementsRecorded.chlorineMgL} mg/L</span></div>
                  )}
                  {task.measurementsRecorded.flushingDurationMinutes !== undefined && (
                    <div>Flushing Duration: <span className="font-bold text-slate-200">{task.measurementsRecorded.flushingDurationMinutes} mins</span></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit History Timeline for this Event */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Tamper-Resistant Transition Audit Trail ({audits.length})</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {audits.map((a) => (
            <div key={a.id} className="p-3 rounded bg-slate-950 border border-slate-800/80 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-cyan-400 font-bold">{a.action}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{a.actor} ({a.actorRole})</span>
                </div>
                <p className="text-slate-400 text-[11px]">{a.decisionReason}</p>
                {a.evidenceReference && (
                  <div className="text-[10px] text-slate-500">Ref: {a.evidenceReference}</div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 whitespace-nowrap ml-4">
                {new Date(a.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
