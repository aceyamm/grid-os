import React, { useEffect, useState } from "react";

interface GridHeaderProps {
  caseType?: "LIVE" | "SIMULATION" | "DRILL";
  operatorName?: string;
  gridFrequency?: number;
  veilOpenCount?: number;
  veilLimit?: number;
  workspaceTitle?: string;
  processXp?: number;
  onGuide?: () => void;
  killSwitch?: boolean;
  onKillSwitch?: () => void;
}

export const GridHeader: React.FC<GridHeaderProps> = ({
  caseType = "SIMULATION",
  operatorName = "DISPATCH LVL 3",
  gridFrequency = 60,
  veilOpenCount = 0,
  veilLimit = 2,
  workspaceTitle = "OVERVIEW",
  processXp = 505,
  onGuide,
  killSwitch = false,
  onKillSwitch,
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const utcTime = now.toISOString().slice(11, 19);
  const frequencyTone =
    gridFrequency < 59.9 ? "critical" : gridFrequency > 60.1 ? "warning" : "nominal";

  return (
    <header className="governance-bar">
      <div className="breadcrumb">
        <span>GRID OS</span><span className="breadcrumb-divider">/</span>
        <strong>{workspaceTitle}</strong>
        <span className={`case-mode case-mode-${caseType.toLowerCase()}`}>{caseType}</span>
      </div>
      <button className="guide-button" onClick={onGuide}>
        <span aria-hidden="true">i</span> Guide
      </button>
      <div className="governance-metrics">
        <div className="governance-item clock-item">
          <span className="eyebrow">SYSTEM CLOCK</span>
          <strong className="mono"><span className="live-dot" />{utcTime} UTC</strong>
          <small className={`frequency-${frequencyTone}`}>{gridFrequency.toFixed(2)} Hz GRID</small>
        </div>
        <div className="governance-item veil-item">
          <span className="eyebrow">VEIL · SWITCHING WINDOW</span>
          <strong className={veilOpenCount >= veilLimit ? "text-critical" : ""}>
            {veilOpenCount} <span>/ {veilLimit} OPEN</span>
          </strong>
        </div>
        <div className="governance-item xp-item">
          <span className="eyebrow">PROCESS XP</span>
          <strong className="mono">✳ {processXp}</strong>
        </div>
        <div className="governance-item clearance-item">
          <span className="eyebrow">OPERATOR</span>
          <strong className="clearance-chip">{operatorName}</strong>
        </div>
        <button
          className={`kill-switch ${killSwitch ? "kill-switch-active" : ""}`}
          onClick={onKillSwitch}
          aria-pressed={killSwitch}
          title={killSwitch ? "Clear global hold" : "Freeze pending review decisions"}
        >
          <span aria-hidden="true" className="kill-switch-icon">{killSwitch ? "■" : "◇"}</span>
          <span>{killSwitch ? "HOLD ACTIVE" : "GLOBAL HOLD"}</span>
        </button>
      </div>
    </header>
  );
};
