'use client';

import React, { useState } from 'react';
import { History, Search, Download, ShieldCheck, User } from 'lucide-react';
import { AuditEvent, WaterZone } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';

interface AuditLogViewProps {
  audits: AuditEvent[];
  zones: WaterZone[];
}

export function AuditLogView({ audits, zones }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  const filteredAudits = audits.filter((audit) => {
    const matchesZone = selectedZone === 'ALL' || audit.zoneId === selectedZone;
    const matchesSearch =
      audit.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.decisionReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.eventId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const exportCsv = () => {
    const headers = [
      'ID',
      'Timestamp',
      'EventID',
      'ZoneID',
      'Actor',
      'Role',
      'Action',
      'PreviousState',
      'NewState',
      'Reason',
    ];
    const rows = filteredAudits.map((a) => [
      a.id,
      a.timestamp,
      a.eventId,
      a.zoneId,
      `"${a.actor}"`,
      a.actorRole,
      a.action,
      a.previousState,
      a.newState,
      `"${a.decisionReason.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saferestart-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'SUPERVISOR':
      case 'CHIEF_WATER_ENGINEER':
        return 'Supervisor';
      case 'FIELD_TECHNICIAN':
        return 'Field Technician';
      case 'WATER_QUALITY_SPECIALIST':
        return 'Water Quality Specialist';
      case 'SYSTEM_SIMULATOR':
        return 'System Automated';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Civic Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 mt-0.5 sm:mt-0">
              <History className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Safety Audit Trail
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Sequential operational record of status transitions, field verifications, and supervisor authorizations.
              </p>
            </div>
          </div>

          <button
            onClick={exportCsv}
            type="button"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, action, reason, or event ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600 transition"
            />
          </div>

          <div className="sm:w-64">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600 transition"
            >
              <option value="ALL">All Zones ({audits.length} events)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing {filteredAudits.length} of {audits.length} recorded events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No audit records match your search</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search term or zone filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Zone & Event</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Status Transition</th>
                  <th className="py-3 px-4">Reason & Safety Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map((a) => {
                  const z = zones.find((item) => item.id === a.zoneId);
                  const date = new Date(a.timestamp);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="font-medium text-slate-900">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        <div className="text-[11px] text-slate-500">
                          {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{z?.name || a.zoneId}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {a.eventId}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.actor}</span>
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {formatRole(a.actorRole)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <StatusBadge state={a.previousState} size="sm" showDot={false} />
                          <span className="text-slate-400 font-bold">→</span>
                          <StatusBadge state={a.newState} size="sm" showDot={false} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{a.action}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <p className="leading-relaxed max-w-md text-xs">{a.decisionReason}</p>
                        {a.evidenceReference && (
                          <div className="text-[11px] text-sky-700 mt-1 font-mono">
                            Evidence ID: {a.evidenceReference}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
