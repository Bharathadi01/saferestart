'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
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
      desc: 'Pressure drop detected & supply stopped',
      isCompleted: true,
      time: event.interruptionStartedAt,
    },
    {
      id: 'EVALUATION',
      label: 'Safety Assessment',
      desc: `${event.riskEvaluation.level} vulnerability (${event.riskEvaluation.score}/100) -> ${event.riskEvaluation.action}`,
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
      desc: 'Water supply safely restarted',
      isCompleted: event.state === 'RESTORED',
      current: false,
      time: event.state === 'RESTORED' ? event.updatedAt : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Event Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-mono">Event: {event.id}</span>
              <span>•</span>
              <span className="font-medium text-slate-800">{zone.name} ({zone.code})</span>
            </div>
            <div className="flex items-center space-x-3 mt-2">
              <StatusBadge state={event.state} size="lg" />
              <span className="text-xs text-slate-600">
                Outage duration: <span className="font-bold text-slate-900">{event.interruptionDurationHours.toFixed(1)} hrs</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {event.state === 'VERIFICATION_REQUIRED' || event.state === 'HOLD' ? (
              <Link
                href="/field"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Complete Field Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : event.state === 'AWAITING_APPROVAL' ? (
              <Link
                href="/supervisor"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Supervisor Review & Sign Off</span>
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
                className={`p-3.5 rounded-xl border text-xs transition-colors ${
                  step.isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : step.current
                    ? 'bg-sky-50 border-sky-300 text-slate-900 ring-2 ring-sky-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : step.current ? (
                    <Clock className="w-4 h-4 text-sky-600 animate-pulse" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <div className="font-semibold text-slate-900 text-xs mt-1">{step.label}</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">{step.desc}</p>
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <ClipboardList className="w-4 h-4 text-sky-700" />
          <span>Required Verification Field Directives ({event.fieldTasks.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {event.fieldTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {task.assignedRole.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{task.title}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
              </div>

              {task.measurementsRecorded && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                  {task.measurementsRecorded.chlorineMgL !== undefined && (
                    <div>Free Chlorine: <span className="font-bold text-emerald-700">{task.measurementsRecorded.chlorineMgL} mg/L</span></div>
                  )}
                  {task.measurementsRecorded.flushingDurationMinutes !== undefined && (
                    <div>Flushing Duration: <span className="font-bold text-slate-800">{task.measurementsRecorded.flushingDurationMinutes} mins</span></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit History Timeline for this Event */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-700" />
          <span>Transition Audit Trail ({audits.length})</span>
        </h3>

        <div className="space-y-2 text-xs">
          {audits.map((a) => (
            <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-sky-800 font-bold">{a.action}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-700">{a.actor} ({a.actorRole})</span>
                </div>
                <p className="text-slate-600 text-xs">{a.decisionReason}</p>
                {a.evidenceReference && (
                  <div className="text-[11px] text-slate-500 font-mono">Ref: {a.evidenceReference}</div>
                )}
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                {new Date(a.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
