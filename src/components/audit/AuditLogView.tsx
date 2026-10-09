'use client';

import React, { useState } from 'react';
import { History, Search, Filter, ShieldCheck, Clock, Download } from 'lucide-react';
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
    const headers = ['ID', 'Timestamp', 'EventID', 'ZoneID', 'Actor', 'Role', 'Action', 'PreviousState', 'NewState', 'Reason'];
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

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Immutable Regulatory Audit Trail
              </h1>
              <p className="text-xs text-slate-400">
                Cryptographically sequenced lifecycle transitions, supervisor authorizations, and field verifications
              </p>
            </div>
          </div>

          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors flex items-center space-x-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by actor, reason, event ID, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:w-60">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Zones ({audits.length} entries)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event & Zone</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Reason & Physical Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAudits.map((a) => {
                const z = zones.find((item) => item.id === a.zoneId);
                return (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      <div>{new Date(a.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(a.timestamp).toISOString().slice(0, 10)}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-cyan-400">{a.eventId}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {z?.name || a.zoneId}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{a.actor}</div>
                      <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-slate-950 border border-slate-800">
                        {a.actorRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <StatusBadge state={a.previousState} size="sm" showDot={false} />
                        <span className="text-slate-500">→</span>
                        <StatusBadge state={a.newState} size="sm" showDot={false} />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{a.action}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <p className="leading-snug max-w-md">{a.decisionReason}</p>
                      {a.evidenceReference && (
                        <div className="text-[10px] text-cyan-400 mt-1">
                          Evidence Reference: {a.evidenceReference}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
