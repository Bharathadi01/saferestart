'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TelemetryReading } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';
import { Activity, Clock } from 'lucide-react';

interface TelemetryChartsProps {
  telemetryHistory: TelemetryReading[];
  currentReading: TelemetryReading;
}

export function TelemetryCharts({
  telemetryHistory,
  currentReading,
}: TelemetryChartsProps) {
  // Format timestamps for chart axis
  const formattedData = telemetryHistory.map((reading) => {
    const d = new Date(reading.timestamp);
    return {
      ...reading,
      timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  return (
    <div className="space-y-4">
      {/* Pressure Dynamics Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Hydraulic Pressure Dynamics (psi)
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5" />
              Observed
            </span>
            <span className="flex items-center">
              <span className="w-2 h-0.5 bg-rose-500 mr-1.5" />
              Min Safe Floor (20.0 psi)
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" domain={[0, 50]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" psi" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.CRITICAL_LOW_PRESSURE_PSI}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Low Limit (15 psi)', fill: '#f59e0b', fontSize: 10, position: 'right' }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.NEGATIVE_PRESSURE_RISK_PSI}
                stroke="#ef4444"
                strokeDasharray="2 2"
                label={{ value: 'Negative Ingress Floor (5 psi)', fill: '#ef4444', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="pressurePsi"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4' }}
                activeDot={{ r: 6 }}
                name="Pressure (psi)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disinfection Residual & Turbidity Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Free Chlorine Residual History (mg/L)
            </h3>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
            <span>Latest:</span>
            <span className="font-bold text-slate-200">
              {currentReading.chlorineMgL !== undefined
                ? `${currentReading.chlorineMgL.toFixed(2)} mg/L`
                : 'Measurement Missing'}
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" domain={[0, 1.2]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" mg/L" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'Min Req (0.20 mg/L)', fill: '#ef4444', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="chlorineMgL"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#10b981' }}
                connectNulls={false}
                name="Free Chlorine (mg/L)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
