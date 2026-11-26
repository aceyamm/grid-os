/**
 * Node Telemetry Component
 * Displays current grid node status and telemetry
 */

import React from "react";
import { MonitoredGridNode, GridSeverity } from "../types/grid-os";

interface NodeTelemetryProps {
  node: MonitoredGridNode;
  isLive?: boolean;
}

const getSeverityColor = (severity: GridSeverity): string => {
  switch (severity) {
    case "NOMINAL":
      return "text-emerald";
    case "ELEVATED":
      return "text-amber";
    case "CRITICAL":
    case "BLACK_START":
      return "text-crimson";
  }
};

const getSeverityBg = (severity: GridSeverity): string => {
  switch (severity) {
    case "NOMINAL":
      return "bg-emerald/10 border-emerald";
    case "ELEVATED":
      return "bg-amber/10 border-amber";
    case "CRITICAL":
    case "BLACK_START":
      return "bg-crimson/10 border-crimson";
  }
};

export const NodeTelemetry: React.FC<NodeTelemetryProps> = ({
  node,
  isLive = true,
}) => {
  const capacityUtilization = (node.currentLoadMw / node.effectiveCapacityMw) * 100;
  const isOverloaded = capacityUtilization > 100;

  return (
    <div className="border border-border rounded bg-dark-green-black p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            {node.type.replace(/_/g, " ")}
          </div>
          <h3 className="text-lg font-semibold text-cream mt-1">{node.code}</h3>
          <p className="text-sm text-gray-green mt-1">{node.name}</p>
        </div>
        <div className={`px-2 py-1 border rounded text-xs font-mono font-semibold ${getSeverityBg(node.severity)} ${getSeverityColor(node.severity)}`}>
          {node.severity}
        </div>
      </div>

      {!isLive && (
        <div className="mb-3 px-2 py-1 bg-amber/10 border border-amber rounded text-xs text-amber font-semibold">
          ⚠ SIMULATION DATA
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            Frequency
          </div>
          <div className={`text-lg font-mono font-bold mt-1 ${node.localFrequencyHz < 59.9 ? "text-crimson" : node.localFrequencyHz > 60.1 ? "text-amber" : "text-emerald"}`}>
            {node.localFrequencyHz.toFixed(2)} Hz
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            Spinning Reserve
          </div>
          <div className="text-lg font-mono font-bold mt-1 text-cream">
            {node.spinningReserveMw.toFixed(0)} MW
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            Capacity Utilization
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <div className={`text-sm font-mono font-bold ${isOverloaded ? "text-crimson" : "text-cream"}`}>
                {capacityUtilization.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-green">
                {node.currentLoadMw.toFixed(0)} / {node.effectiveCapacityMw.toFixed(0)} MW
              </div>
            </div>
            <div className="mt-2 w-full bg-ink rounded border border-border h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${isOverloaded ? "bg-crimson" : node.severity === "ELEVATED" ? "bg-amber" : "bg-emerald"}`}
                style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
              />
            </div>
            {isOverloaded && (
              <div className="text-xs text-crimson font-semibold mt-1">
                ⚠ OVERLOADED
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            Rated Capacity
          </div>
          <div className="text-sm font-mono text-cream mt-1">
            {node.ratedCapacityMw} MW
          </div>
          <div className="text-xs text-gray-green mt-1">
            {node.activeSymptomLogs.length > 0
              ? `Effective: ${node.effectiveCapacityMw.toFixed(0)} MW (-${((1 - node.effectiveCapacityMw / node.ratedCapacityMw) * 100).toFixed(0)}%)`
              : "No derating"}
          </div>
        </div>
      </div>

      {node.activeSymptomLogs.length > 0 && (
        <div className="border-t border-border pt-3 mt-3">
          <div className="text-xs uppercase tracking-widest text-amber mb-2">
            Active Diagnostic Logs
          </div>
          <div className="space-y-2">
            {node.activeSymptomLogs.map((log) => (
              <div
                key={log.logId}
                className="text-xs bg-amber/5 border border-amber rounded p-2"
              >
                <div className="text-amber font-semibold">{log.headline}</div>
                <div className="text-gray-green mt-1">
                  {log.symptoms.map((s, i) => (
                    <div key={i}>• {s}</div>
                  ))}
                </div>
                <div className="text-gray-green text-xs mt-1">
                  Capacity haircut: -{log.capacityHaircutPct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
