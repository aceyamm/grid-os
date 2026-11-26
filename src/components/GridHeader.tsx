/**
 * Grid Header Component
 * Top navigation bar with system status and operator info
 */

import React from "react";
import { GridCase } from "../types/grid-os";

interface GridHeaderProps {
  caseType?: "LIVE" | "SIMULATION" | "DRILL";
  operatorName?: string;
  systemClock?: string;
  gridFrequency?: number;
  veilOpenCount?: number;
  veilLimit?: number;
}

export const GridHeader: React.FC<GridHeaderProps> = ({
  caseType = "SIMULATION",
  operatorName = "Operator",
  systemClock,
  gridFrequency = 60.0,
  veilOpenCount = 0,
  veilLimit = 2,
}) => {
  const now = new Date();
  const utcTime = systemClock || now.toUTCString().split(" ")[4];

  return (
    <div className="border-b border-border bg-ink px-4 py-3">
      <div className="flex justify-between items-center">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-cream">
            GOS <span className="text-gray-green">/</span> GRID OS
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-green">
            Dispatch Terminal
          </div>
          {caseType === "SIMULATION" && (
            <div className="px-2 py-1 bg-amber/10 border border-amber rounded text-xs text-amber font-semibold">
              🎯 SIMULATION
            </div>
          )}
          {caseType === "DRILL" && (
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500 rounded text-xs text-blue-400 font-semibold">
              📋 DRILL
            </div>
          )}
        </div>

        {/* Center: System Info */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <div className="text-gray-green uppercase tracking-widest mb-1">UTC</div>
            <div className="text-cream">{utcTime}</div>
          </div>
          <div className="border-l border-border h-6" />
          <div>
            <div className="text-gray-green uppercase tracking-widest mb-1">
              Frequency
            </div>
            <div className={`${gridFrequency >= 59.9 && gridFrequency <= 60.1 ? "text-emerald" : gridFrequency < 59.9 ? "text-crimson" : "text-amber"}`}>
              {gridFrequency.toFixed(2)} Hz
            </div>
          </div>
        </div>

        {/* Right: Operator & Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <div className="text-gray-green uppercase tracking-widest mb-1">
              VEIL Limit
            </div>
            <div className={`${veilOpenCount >= veilLimit ? "text-crimson" : "text-cream"}`}>
              {veilOpenCount} <span className="text-gray-green">/ {veilLimit}</span> OPEN
            </div>
          </div>
          <div className="border-l border-border h-6" />
          <div>
            <div className="text-gray-green uppercase tracking-widest mb-1">
              Operator
            </div>
            <div className="text-cream">{operatorName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
