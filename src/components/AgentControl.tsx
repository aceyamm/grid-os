import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useGridOSStore } from "../store/gridStore";
import { GridState } from "../types/grid-os";

const STAGE_ORDER: GridState[] = [
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

const REPLAY_STAGES = STAGE_ORDER.filter(
  (stage): stage is Exclude<GridState, "AUTHORIZE" | "SFAE"> =>
    stage !== "AUTHORIZE" && stage !== "SFAE"
);

const formatAgentTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

interface AgentControlProps {
  onOpenReview: () => void;
}

export const AgentControl: React.FC<AgentControlProps> = ({ onOpenReview }) => {
  const {
    cases,
    activeCase,
    setActiveCase,
    updateNodeState,
    replayFromStage,
  } = useGridOSStore();
  const [selectedCaseId, setSelectedCaseId] = useState(activeCase?.caseId ?? "");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [stepDelay, setStepDelay] = useState(1200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayStage, setReplayStage] = useState<Exclude<GridState, "AUTHORIZE" | "SFAE">>("SCAN");
  const [message, setMessage] = useState("");

  const selectedCase = useMemo(
    () => cases.find((gridCase) => gridCase.caseId === selectedCaseId) ?? activeCase,
    [activeCase, cases, selectedCaseId]
  );
  const currentState = selectedCase?.currentNode.currentState;
  const nextStage = currentState
    ? STAGE_ORDER[STAGE_ORDER.indexOf(currentState) + 1]
    : undefined;
  const pendingSignal = selectedCase?.signals.find(
    (signal) => signal.status === "PENDING_DISPATCHER"
  );
  const pausedAtSignal = currentState === "SIGNAL" && Boolean(pendingSignal);
  const agentEvents = selectedCase
    ? [...selectedCase.continuumEvents]
        .filter(
          (event) =>
            event.actorType === "AGENT" ||
            event.evidenceNote.startsWith("Agent replay initialized")
        )
        .reverse()
        .slice(0, 5)
    : [];
  const processPosition = currentState
    ? STAGE_ORDER.indexOf(currentState) + 1
    : 0;

  useEffect(() => {
    setIsPlaying(false);
  }, [selectedCaseId]);

  const stepAgent = useCallback(() => {
    if (!selectedCase) return;
    if (selectedCase.currentNode.currentState === "SIGNAL") {
      setIsPlaying(false);
      setMessage("Agent paused at SIGNAL. Dispatcher review is required before continuing.");
      return;
    }

    const next = STAGE_ORDER[
      STAGE_ORDER.indexOf(selectedCase.currentNode.currentState) + 1
    ];
    if (!next || next === "AUTHORIZE" || next === "SFAE") {
      setIsPlaying(false);
      setMessage("No further agent stages are available. Human review and finalization remain operator-controlled.");
      return;
    }

    const advanced = updateNodeState(
      selectedCase.caseId,
      next,
      `Agent review completed for ${selectedCase.currentNode.currentState} using seeded simulation inputs.`,
      { actorType: "AGENT", actorId: "AGENT-GRID-01" }
    );
    if (!advanced) {
      setIsPlaying(false);
      setMessage("Step was not recorded. This case may be held or no longer active.");
      return;
    }

    if (next === "SIGNAL") {
      setIsPlaying(false);
      setMessage("Agent paused at SIGNAL. Review the recommendation in the human gate.");
    } else {
      setMessage(`Agent recorded ${next}. No external action was initiated.`);
    }
  }, [selectedCase, updateNodeState]);

  useEffect(() => {
    if (!isPlaying || !autoAdvance) return undefined;
    const timer = window.setTimeout(stepAgent, stepDelay);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, isPlaying, stepAgent, stepDelay]);

  const chooseCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveCase(caseId);
    setMessage("");
  };

  const toggleRun = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setMessage("Timed run paused by operator.");
      return;
    }
    if (!autoAdvance) {
      setMessage("Enable the auto-advance timer before starting a timed run.");
      return;
    }
    if (pausedAtSignal || !selectedCase || selectedCase.caseStatus !== "ACTIVE") {
      setMessage("This case is paused for human review or is not active.");
      return;
    }
    setMessage("Timed process playback started. It will pause at SIGNAL.");
    setIsPlaying(true);
  };

  const replay = () => {
    if (!selectedCase) return;
    const replayed = replayFromStage(selectedCase.caseId, replayStage);
    if (!replayed) {
      setMessage("Replay could not be initialized for this case.");
      return;
    }
    setIsPlaying(false);
    setMessage(`Replay started from ${replayStage}. Previous Continuum history is retained.`);
  };

  if (!selectedCase) {
    return <div className="empty-state"><strong>No simulation case available</strong><p>Open a practice case from Scenarios to use agent playback.</p></div>;
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">LOCAL PROCESS AGENT / SIMULATION ONLY</div>
          <h1>Agent control</h1>
          <p>Run a selected asset through its process stages. Playback updates this workspace and Continuum; SIGNAL always pauses for operator review.</p>
        </div>
        <span className="status-badge status-neutral">NO EXTERNAL ACTIONS</span>
      </div>

      <div className="agent-control-layout">
        <section className="panel agent-session-panel">
          <div className="panel-heading">
            <div><div className="eyebrow">LOCAL PROCESS AGENT</div><h2>Agent session</h2></div>
            <span className="status-badge status-warning">SIMULATION ONLY</span>
          </div>
          <div className="agent-session-body">
            <label className="field-label" htmlFor="agent-case">Select asset / case</label>
            <select
              id="agent-case"
              className="agent-select"
              value={selectedCase.caseId}
              onChange={(event) => chooseCase(event.target.value)}
            >
              {cases.map((gridCase) => (
                <option key={gridCase.caseId} value={gridCase.caseId}>
                  {gridCase.currentNode.code} · {gridCase.currentNode.currentState} · {gridCase.caseId}
                </option>
              ))}
            </select>

            <article className="agent-selected-case">
              <div className="agent-case-heading">
                <strong>{selectedCase.currentNode.code}</strong>
                <span className={`agent-stage-pill ${pausedAtSignal ? "agent-stage-paused" : ""}`}>
                  {currentState}
                </span>
              </div>
              <p>{selectedCase.currentNode.name}</p>
              <div className="agent-case-meta">
                <span>{selectedCase.caseType} · {selectedCase.caseId}</span>
                <span>PROCESS POSITION {processPosition} / 9</span>
              </div>
            </article>

            <label className="agent-checkbox-row">
              <span>Auto-advance timer</span>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => {
                  setAutoAdvance(event.target.checked);
                  if (!event.target.checked) setIsPlaying(false);
                }}
              />
            </label>
            <div className="agent-delay-row">
              <label className="eyebrow" htmlFor="agent-delay">STEP DELAY</label>
              <output htmlFor="agent-delay">{(stepDelay / 1000).toFixed(2)} s</output>
            </div>
            <input
              id="agent-delay"
              className="agent-range"
              type="range"
              min="500"
              max="3000"
              step="100"
              value={stepDelay}
              disabled={!autoAdvance}
              onChange={(event) => setStepDelay(Number(event.target.value))}
            />
            <div className="agent-play-actions">
              <button
                className="button button-primary"
                onClick={toggleRun}
                disabled={!autoAdvance || pausedAtSignal || selectedCase.caseStatus !== "ACTIVE"}
              >
                <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▷"}</span>
                {isPlaying ? "PAUSE RUN" : "TIMED RUN"}
              </button>
              <button
                className="button button-secondary"
                onClick={stepAgent}
                disabled={isPlaying || pausedAtSignal || selectedCase.caseStatus !== "ACTIVE"}
              >
                STEP →
              </button>
            </div>

            <div className="agent-replay">
              <label className="eyebrow" htmlFor="agent-replay-stage">REPLAY FROM STAGE</label>
              <div className="agent-replay-controls">
                <select
                  id="agent-replay-stage"
                  className="agent-select"
                  value={replayStage}
                  onChange={(event) =>
                    setReplayStage(event.target.value as Exclude<GridState, "AUTHORIZE" | "SFAE">)
                  }
                >
                  {REPLAY_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                <button className="button button-secondary" onClick={replay}>↶ REPLAY</button>
              </div>
              <p>Replay preserves prior Continuum history. AUTHORIZE and SFAE cannot be replay entry points.</p>
            </div>
            {message && <div className="agent-message" role="status">{message}</div>}
          </div>
        </section>

        <div className="agent-trace-column">
          <section className="panel agent-trace-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">LIVE PROCESS TRACE</div>
                <h2>{selectedCase.caseId} · {currentState}</h2>
              </div>
              <span className={`status-badge ${pausedAtSignal ? "status-warning" : "status-neutral"}`}>
                {pausedAtSignal ? "PAUSED AT SIGNAL" : isPlaying ? "RUNNING" : "READY"}
              </span>
            </div>
            <div className="agent-trace-body">
              <div className="agent-trace-notice">
                {pausedAtSignal
                  ? `${selectedCase.currentNode.code} reached SIGNAL. Operator review is required before the agent can continue.`
                  : `Simulation playback is positioned at ${currentState}. No external movement or equipment action is initiated.`}
              </div>
              {pausedAtSignal && pendingSignal && (
                <article className="agent-signal-card">
                  <div className="agent-signal-topline">
                    <span className="eyebrow">SIMULATION RUN / RECOMMENDATION</span>
                    <span className="agent-stage-pill agent-stage-paused">SIGNAL</span>
                  </div>
                  <h3>{pendingSignal.summary}</h3>
                  <p>{pendingSignal.rationale}</p>
                  <div className="agent-signal-current">
                    <span className="eyebrow">CURRENT STAGE OBSERVATION</span>
                    <span>The recommendation is ready. Agent progression stops here until an operator accepts, rejects, or holds it.</span>
                  </div>
                  <button className="button button-secondary" onClick={onOpenReview}>
                    OPEN REVIEW GATE <span aria-hidden="true">→</span>
                  </button>
                </article>
              )}
              {message && <div className="agent-message agent-message-trace" role="status">{message}</div>}
              <div className="agent-stage-strip" aria-label="Agent process position">
                {STAGE_ORDER.map((stage, index) => {
                  const done = selectedCase.currentNode.completedStates.includes(stage);
                  const now = currentState === stage;
                  return (
                    <div className={`agent-stage-cell ${done ? "agent-stage-done" : ""} ${now ? "agent-stage-now" : ""}`} key={stage}>
                      <span>{done ? "DONE" : now ? "NOW" : String(index + 1).padStart(2, "0")}</span>
                      <strong>{stage}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel agent-continuum-panel">
            <div className="panel-heading">
              <div><div className="eyebrow">CONTINUUM UPDATES</div><h2>Agent event trace</h2></div>
              <span className="eyebrow">MOST RECENT FIRST</span>
            </div>
            {agentEvents.length ? (
              <div className="agent-events">
                {agentEvents.map((event) => (
                  <article className="agent-event" key={event.eventId}>
                    <div className="agent-event-topline">
                      <span>{event.actorType} · {event.actorId}</span>
                      <time>{formatAgentTime(event.timestamp)}</time>
                    </div>
                    <strong>{event.fromState ? `${event.fromState} → ${event.toState}` : event.toState}</strong>
                    <p>{event.evidenceNote} No external movement was initiated.</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="agent-events-empty">No agent events yet. Run or step the simulation to begin a trace.</div>
            )}
          </section>
          <div className="agent-disclaimer">Recommendations are process outputs under review. Human authorization is required. This is not an emergency response system of record.</div>
        </div>
      </div>
    </>
  );
};
