/**
 * Grid OS Overview Page
 * Main dispatch terminal dashboard
 */

import React, { useState } from "react";
import { useGridOSStore } from "../store/gridStore";
import { GridHeader } from "../components/GridHeader";
import { StateTrack } from "../components/StateTrack";
import { NodeTelemetry } from "../components/NodeTelemetry";
import { DEMO_GRID_NODES, STATE_DESCRIPTIONS } from "../data/demo";

export const OverviewPage: React.FC = () => {
  const { activeCase, createCase, updateNodeState } = useGridOSStore();
  const [selectedStateNote, setSelectedStateNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingState, setPendingState] = useState<string | null>(null);

  // Create demo case if none exists
  React.useEffect(() => {
    if (!activeCase) {
      createCase("North District", "SIMULATION", DEMO_GRID_NODES[0]);
    }
  }, [activeCase, createCase]);

  if (!activeCase) {
    return (
      <div className="bg-ink min-h-screen p-4">
        <GridHeader caseType="SIMULATION" />
        <div className="mt-8 text-center text-gray-green">Loading...</div>
      </div>
    );
  }

  const handleStateAdvance = (newState: string) => {
    setPendingState(newState);
    setShowNoteInput(true);
  };

  const handleConfirmStateChange = () => {
    if (pendingState && selectedStateNote.trim()) {
      updateNodeState(activeCase.caseId, pendingState as any, selectedStateNote);
      setSelectedStateNote("");
      setShowNoteInput(false);
      setPendingState(null);
    }
  };

  const nextPossibleState =
    activeCase.currentNode.completedStates.length < 8
      ? ["SCAN", "FAULT", "LOAD_CAP", "ISLAND", "SEQUENCE", "RESERVE", "SIGNAL", "AUTHORIZE", "SFAE"][
          activeCase.currentNode.completedStates.length
        ]
      : null;

  return (
    <div className="bg-ink min-h-screen">
      <GridHeader
        caseType={activeCase.caseType}
        operatorName="DISPATCH LVL 3"
        gridFrequency={activeCase.currentNode.localFrequencyHz}
        veilOpenCount={0}
        veilLimit={2}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Case Header */}
        <div className="border border-border rounded bg-dark-green-black p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-green">
                Case ID
              </div>
              <div className="text-cream font-mono font-semibold mt-1">
                {activeCase.caseId}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-green">
                Operating Area
              </div>
              <div className="text-cream mt-1">{activeCase.operatingArea}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-green">
                Case Type
              </div>
              <div className="text-cream mt-1">{activeCase.caseType}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-green">
                Status
              </div>
              <div className={`mt-1 font-semibold ${activeCase.caseStatus === "ACTIVE" ? "text-emerald" : "text-amber"}`}>
                {activeCase.caseStatus}
              </div>
            </div>
          </div>
        </div>

        {/* State Track */}
        <StateTrack
          currentState={activeCase.currentNode.currentState}
          completedStates={activeCase.currentNode.completedStates}
          onStateSelect={handleStateAdvance}
        />

        {/* Node Telemetry */}
        <NodeTelemetry
          node={activeCase.currentNode}
          isLive={activeCase.caseType === "LIVE"}
        />

        {/* Current Stage Info */}
        <div className="border border-border rounded bg-dark-green-black p-4">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">
            Current Stage
          </div>
          <h3 className="text-lg font-semibold text-cream mb-2">
            {activeCase.currentNode.currentState}
          </h3>
          <p className="text-sm text-gray-green">
            {STATE_DESCRIPTIONS[activeCase.currentNode.currentState]}
          </p>
        </div>

        {/* Stage Transition Form */}
        {showNoteInput && nextPossibleState && (
          <div className="border border-gold rounded bg-gold/5 p-4">
            <div className="text-sm font-semibold text-cream mb-3">
              Advance to: <span className="text-gold">{pendingState}</span>
            </div>
            <textarea
              value={selectedStateNote}
              onChange={(e) => setSelectedStateNote(e.target.value)}
              placeholder="Enter verification note (required)"
              className="w-full bg-ink border border-border rounded px-3 py-2 text-cream text-sm font-mono focus:outline-none focus:border-gold mb-3 min-h-24"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmStateChange}
                disabled={!selectedStateNote.trim()}
                className="flex-1 px-4 py-2 bg-emerald text-ink font-semibold rounded hover:bg-emerald/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Confirm & Advance
              </button>
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setPendingState(null);
                  setSelectedStateNote("");
                }}
                className="flex-1 px-4 py-2 bg-crimson/20 text-crimson border border-crimson rounded hover:bg-crimson/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border border-border rounded bg-dark-green-black p-4">
          <div className="text-xs uppercase tracking-widest text-gray-green mb-3">
            Quick Actions
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-dark-green-black border border-border text-cream rounded text-sm hover:border-gold transition-all">
              View Continuum Log
            </button>
            <button className="px-4 py-2 bg-dark-green-black border border-border text-cream rounded text-sm hover:border-gold transition-all">
              Export Case
            </button>
            <button className="px-4 py-2 bg-dark-green-black border border-border text-cream rounded text-sm hover:border-gold transition-all">
              Run Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
