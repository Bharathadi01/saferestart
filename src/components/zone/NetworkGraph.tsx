'use client';

import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NetworkNode, NetworkPipe } from '@/types';
import { ShieldAlert, Droplets, Info } from 'lucide-react';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
  zoneName: string;
}

export function NetworkGraph({ nodes, pipes, zoneName }: NetworkGraphProps) {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // Convert domain nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = selectedNode?.id === node.id;
      const statusColor =
        node.status === 'HOLD'
          ? 'border-rose-500 bg-rose-950/80 text-rose-200'
          : node.status === 'VULNERABLE'
          ? 'border-amber-500 bg-amber-950/80 text-amber-200'
          : node.status === 'INTERRUPTED'
          ? 'border-orange-500 bg-orange-950/80 text-orange-200'
          : 'border-cyan-500 bg-slate-900 text-cyan-200';

      return {
        id: node.id,
        position: node.coordinates,
        data: {
          label: (
            <div
              className={`p-2.5 rounded-lg border font-mono text-xs shadow-lg transition-all ${statusColor} ${
                isSelected ? 'ring-2 ring-cyan-400 scale-105' : ''
              }`}
            >
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 border border-white/10 uppercase">
                  {node.type}
                </span>
                <span className="truncate max-w-[140px]">{node.label}</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 flex justify-between space-x-2">
                <span>Elev: {node.elevationMeters}m</span>
                {node.pressurePsi !== undefined && (
                  <span className="font-semibold">{node.pressurePsi.toFixed(1)} psi</span>
                )}
              </div>
            </div>
          ),
          rawNode: node,
        },
      };
    });
  }, [nodes, selectedNode]);

  // Convert domain pipes to React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    return pipes.map((pipe) => {
      const isLeak = pipe.status === 'LEAK_SUSPECTED';
      return {
        id: pipe.id,
        source: pipe.sourceNodeId,
        target: pipe.targetNodeId,
        animated: pipe.status === 'ACTIVE' && (pipe.flowLps || 0) > 0,
        style: {
          stroke: isLeak ? '#ef4444' : '#06b6d4',
          strokeWidth: Math.max(2, Math.min(6, pipe.diameterMm / 60)),
          strokeDasharray: isLeak ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isLeak ? '#ef4444' : '#06b6d4',
          width: 14,
          height: 14,
        },
        label: isLeak ? 'LEAK SUSPECTED' : `${pipe.diameterMm}mm`,
        labelStyle: {
          fill: isLeak ? '#ef4444' : '#94a3b8',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: isLeak ? 700 : 500,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.8,
        },
      };
    });
  }, [pipes]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[520px]">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            Network Topology Graph: {zoneName}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Vulnerable</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Hold / Leak</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-[#080c14]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodeClick={(_, node) => {
            const raw = (node.data as { rawNode?: NetworkNode })?.rawNode;
            if (raw) setSelectedNode(raw);
          }}
          onPaneClick={() => setSelectedNode(null)}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#1e293b" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
        </ReactFlow>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 bg-slate-900/95 border border-slate-700 rounded-lg p-3.5 shadow-2xl backdrop-blur font-mono text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">{selectedNode.label}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Node ID:</span>
                <span>{selectedNode.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span>{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elevation:</span>
                <span>{selectedNode.elevationMeters} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pressure:</span>
                <span className="font-bold text-cyan-400">
                  {selectedNode.pressurePsi !== undefined
                    ? `${selectedNode.pressurePsi.toFixed(1)} psi`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operational Status:</span>
                <span
                  className={
                    selectedNode.status === 'HOLD'
                      ? 'text-rose-400 font-bold'
                      : selectedNode.status === 'VULNERABLE'
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400'
                  }
                >
                  {selectedNode.status}
                </span>
              </div>
              {selectedNode.metadata && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  {selectedNode.metadata.valveState && (
                    <div>Valve State: {selectedNode.metadata.valveState}</div>
                  )}
                  {selectedNode.metadata.installationYear && (
                    <div>Installed: {selectedNode.metadata.installationYear}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
