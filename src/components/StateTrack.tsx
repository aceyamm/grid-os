/**
 * State Track Component
 * Displays the nine-stage deterministic workflow with current progress
 */

import React from "react";
import { GridState } from "../types/grid-os";

interface StateTrackProps {
  currentState: GridState;
  completedStates: GridState[];
  onStateSelect?: (state: GridState) => void;
}

const STAGES: GridState[] = [
  "SCAN",
  "FAULT",
  "LOAD_CAP",
  "ISLAND",
  "SEQUENCE",
  "RESERVE",
  "SIGNAL",
  "AUTHORIZE",
  "SFAE",
];

const STAGE_DESCRIPTIONS: Record<GridState, string> = {
  SCAN: "Telemetry Scan",
  FAULT: "Fault Assessment",
  LOAD_CAP: "Capacity & Load",
  ISLAND: "Islanding Assessment",
  SEQUENCE: "Switching Sequence",
  RESERVE: "Reserve Check",
  SIGNAL: "Signal (Auto-Gate)",
  AUTHORIZE: "Human Gate",
  SFAE: "After-Action",
};

export const StateTrack: React.FC<StateTrackProps> = ({
  currentState,
  completedStates,
  onStateSelect,
}) => {
  const isHumanGate = currentState === "AUTHORIZE";
  const isLocked = currentState === "SFAE";

  return (
    <div className="border border-border rounded bg-dark-green-black p-4">
      <div className="text-xs uppercase tracking-widest text-gray-green mb-3">
        Process Spine
      </div>
      <div className="flex flex-wrap gap-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = completedStates.includes(stage);
          const isCurrent = currentState === stage;
          const isHuman = stage === "AUTHORIZE";

          let bgColor = "bg-ink border-border";
          let textColor = "text-gray-green";
          let icon = "";

          if (isCompleted) {
            bgColor = "bg-emerald/20 border-emerald";
            textColor = "text-emerald";
            icon = "✓";
          } else if (isCurrent) {
            bgColor = isHuman
              ? "bg-crimson/20 border-crimson"
              : "bg-gold/20 border-gold";
            textColor = isHuman ? "text-crimson" : "text-gold";
            icon = isHuman ? "🔒" : "→";
          }

          if (isLocked && STAGES.indexOf(stage) > STAGES.indexOf(currentState)) {
            bgColor = "bg-ink border-border opacity-50";
            textColor = "text-gray-green opacity-50";
          }

          return (
            <button
              key={stage}
              onClick={() => onStateSelect?.(stage)}
              disabled={isLocked || (currentState !== stage && !isCompleted)}
              className={`
                relative flex flex-col items-center px-3 py-2 border rounded
                font-mono text-xs font-semibold transition-all
                ${bgColor} ${textColor}
                ${!isLocked && !isCompleted && currentState !== stage ? "opacity-50 cursor-not-allowed" : ""}
                hover:scale-105 disabled:hover:scale-100
              `}
              title={STAGE_DESCRIPTIONS[stage]}
            >
              <span>{stage}</span>
              {icon && <span className="text-xs absolute -top-1 -right-1">{icon}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-gray-green">
        Progress: {completedStates.length}/{STAGES.length - 1} stages completed
        {isHumanGate && (
          <span className="ml-2 text-crimson font-semibold">🔒 Awaiting Authorization</span>
        )}
      </div>
    </div>
  );
};
