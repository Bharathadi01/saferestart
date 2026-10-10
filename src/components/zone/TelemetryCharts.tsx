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
import { Activity, Droplet } from 'lucide-react';

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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Hydraulic Pressure Over Time (psi)
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 mr-1.5" />
              Observed
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-0.5 bg-rose-500 mr-1.5" />
              Safety Minimum (20.0 psi)
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif' }} />
              <YAxis stroke="#94a3b8" domain={[0, 50]} tick={{ fontSize: 11, fontFamily: 'sans-serif' }} unit=" psi" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontFamily: 'sans-serif',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.CRITICAL_LOW_PRESSURE_PSI}
                stroke="#d97706"
                strokeDasharray="4 4"
                label={{ value: 'Low Limit (15 psi)', fill: '#b45309', fontSize: 10, position: 'right' }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.NEGATIVE_PRESSURE_RISK_PSI}
                stroke="#dc2626"
                strokeDasharray="2 2"
                label={{ value: 'Negative Ingress (5 psi)', fill: '#b91c1c', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="pressurePsi"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284c7' }}
                activeDot={{ r: 5 }}
                name="Pressure (psi)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disinfection Residual Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Free Chlorine Residual History (mg/L)
            </h3>
          </div>
          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <span>Latest:</span>
            <span className="font-bold text-slate-900">
              {currentReading.chlorineMgL !== undefined
                ? `${currentReading.chlorineMgL.toFixed(2)} mg/L`
                : 'Measurement Missing'}
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif' }} />
              <YAxis stroke="#94a3b8" domain={[0, 1.2]} tick={{ fontSize: 11, fontFamily: 'sans-serif' }} unit=" mg/L" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontFamily: 'sans-serif',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
              <ReferenceLine
                y={DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: 'Min Req (0.20 mg/L)', fill: '#b91c1c', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="chlorineMgL"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#059669' }}
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
