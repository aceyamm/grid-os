import React from "react";
import { GridState } from "../types/grid-os";

interface StateTrackProps {
  currentState: GridState;
  completedStates: GridState[];
  highlightedStage?: GridState;
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

export const StateTrack: React.FC<StateTrackProps> = ({
  currentState,
  completedStates,
  highlightedStage,
}) => (
  <div className="state-track" aria-label="Nine-stage process progress">
    {STAGES.map((stage, index) => {
      const completed = completedStates.includes(stage);
      const current = currentState === stage;
      const stateClass = completed
        ? "stage-complete"
        : current
          ? "stage-current"
          : "stage-pending";
      const specialClass =
        stage === "AUTHORIZE" ? "stage-human" : stage === "SFAE" ? "stage-final" : "";

      return (
        <React.Fragment key={stage}>
          <div
            className={`stage-item ${stateClass} ${specialClass} ${
              highlightedStage === stage ? "stage-tour-highlight" : ""
            }`}
            aria-current={current ? "step" : undefined}
            title={stage === "AUTHORIZE" ? "Human decision required" : stage}
          >
            <span className="stage-number">{completed ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <span className="stage-code">{stage}</span>
          </div>
          {index < STAGES.length - 1 && (
            <span
              className={`stage-connector ${completed ? "connector-complete" : ""}`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
