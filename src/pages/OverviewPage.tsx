import React, { useEffect, useMemo, useState } from "react";
import { AgentControl } from "../components/AgentControl";
import { GridHeader } from "../components/GridHeader";
import { NodeTelemetry } from "../components/NodeTelemetry";
import { StateTrack } from "../components/StateTrack";
import {
  DEMO_FIELD_UNITS,
  DEMO_GRID_NODES,
  GRID_STATE_SEQUENCE,
  STATE_DESCRIPTIONS,
} from "../data/demo";
import { useGridOSStore } from "../store/gridStore";
import { GridCase, GridState, MonitoredGridNode } from "../types/grid-os";

type Workspace =
  | "overview"
  | "assets"
  | "scenarios"
  | "agents"
  | "scan"
  | "review"
  | "continuum"
  | "simulation";

const NAV_ITEMS: { id: Workspace; label: string; mark: string }[] = [
  { id: "overview", label: "Overview", mark: "01" },
  { id: "assets", label: "Substations & Feeders", mark: "02" },
  { id: "scenarios", label: "Scenarios", mark: "03" },
  { id: "agents", label: "Agents", mark: "04" },
  { id: "scan", label: "Scan", mark: "05" },
  { id: "review", label: "Review Gate", mark: "06" },
  { id: "continuum", label: "Continuum", mark: "07" },
  { id: "simulation", label: "Simulation Bank", mark: "08" },
];

const NAV_TOUR_DESCRIPTIONS: Record<Workspace, string> = {
  overview: "Review the selected case, current operating indicators, and nine-stage process position.",
  assets: "Inspect substation and feeder ratings, reported telemetry, and imported field observations.",
  scenarios: "Open isolated drill cases to rehearse review workflows using synthetic conditions.",
  agents: "Run timed or manual process-agent playback. The agent pauses at SIGNAL for dispatcher review.",
  scan: "Review active anomalies and the evidence attached to each simulated finding.",
  review: "Inspect the recommendation and record an operator ACCEPT, REJECT, or HOLD decision.",
  continuum: "Review the chronological case record and export its event trace.",
  simulation: "Run a synthetic stability preview and inspect its clearly labeled sample percentiles.",
};

const PRACTICE_STEPS: { stage: GridState; explanation: string }[] = [
  { stage: "SCAN", explanation: "Establish the operating baseline. Confirm the selected substation, feeder readings, and freshness of available evidence." },
  { stage: "FAULT", explanation: "Validate the reported fault against the seeded observation. Unverified evidence must remain visible as uncertain." },
  { stage: "LOAD_CAP", explanation: "Review effective thermal capacity, load delta, reserves, and the VEIL concurrent-switching boundary." },
  { stage: "ISLAND", explanation: "Identify a candidate isolation boundary in the simulation. No breaker instruction is issued." },
  { stage: "SEQUENCE", explanation: "Review the simulated restoration sequence and its dependencies before advancing." },
  { stage: "RESERVE", explanation: "Check spinning reserve and battery headroom before the system prepares a recommendation." },
  { stage: "SIGNAL", explanation: "Review projected frequency, MW delta, and invalidation conditions. This practice signal still requires a dispatcher decision." },
  { stage: "AUTHORIZE", explanation: "Acknowledge the recommendation in this temporary drill. This records a simulated decision only." },
  { stage: "SFAE", explanation: "Close the simulated review and record the after-action state in the temporary Continuum trace." },
];

type TourKind = "guided" | "agent" | "practice";

interface WorkspaceTour {
  kind: TourKind;
  step: number;
  playing: boolean;
  delay: number;
}

const STAGE_ORDER: GridState[] = [...GRID_STATE_SEQUENCE];

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    timeZoneName: "short",
  });

const downloadText = (name: string, content: string, type: string) => {
  const file = new Blob([content], { type });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const createSimulationSummary = () => {
  const nadirs: number[] = [];
  const recoveryTimes: number[] = [];
  let passCount = 0;
  for (let index = 0; index < 1000; index += 1) {
    const sample = ((index * 7919) % 1000) / 1000;
    const nadir = 59.72 + sample * 0.26;
    const recovery = 18 + (((index * 3571) % 1000) / 1000) * 42;
    nadirs.push(nadir);
    recoveryTimes.push(recovery);
    if (nadir >= 59.8 && recovery <= 45) passCount += 1;
  }
  nadirs.sort((a, b) => a - b);
  recoveryTimes.sort((a, b) => a - b);
  const bottleneck = [...DEMO_GRID_NODES].sort(
    (left, right) =>
      right.currentLoadMw / right.effectiveCapacityMw -
      left.currentLoadMw / left.effectiveCapacityMw
  )[0];

  return {
    p50: nadirs[499],
    p90: nadirs[899],
    p99: nadirs[989],
    recoveryP50: recoveryTimes[499],
    bottleneck: bottleneck.code,
    passRate: (passCount / 1000) * 100,
  };
};

const StatusBadge: React.FC<{
  tone?: "nominal" | "warning" | "critical" | "neutral";
  children: React.ReactNode;
}> = ({ tone = "neutral", children }) => (
  <span className={`status-badge status-${tone}`}>{children}</span>
);

const PanelHeading: React.FC<{
  eyebrow: string;
  title: string;
  trailing?: React.ReactNode;
}> = ({ eyebrow, title, trailing }) => (
  <div className="panel-heading">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
    </div>
    {trailing}
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  unit?: string;
  detail: string;
  tone?: "nominal" | "warning" | "critical";
}> = ({ label, value, unit, detail, tone = "nominal" }) => (
  <article className="metric-card">
    <div className="metric-topline">
      <span className="eyebrow">{label}</span>
      <span className={`metric-dot metric-dot-${tone}`} aria-hidden="true" />
    </div>
    <div className="metric-reading">
      {value}
      {unit && <span>{unit}</span>}
    </div>
    <div className="metric-detail">{detail}</div>
  </article>
);

const AssetRow: React.FC<{ node: MonitoredGridNode }> = ({ node }) => {
  const utilization =
    node.effectiveCapacityMw > 0
      ? (node.currentLoadMw / node.effectiveCapacityMw) * 100
      : 0;
  const tone =
    node.severity === "CRITICAL" || utilization > 100
      ? "critical"
      : node.severity === "ELEVATED"
        ? "warning"
        : "nominal";

  return (
    <div className="asset-row">
      <div className="asset-identity">
        <span className={`asset-indicator asset-indicator-${tone}`} />
        <div>
          <strong>{node.code}</strong>
          <span>{node.name}</span>
        </div>
      </div>
      <div className="asset-reading">
        <strong>{node.localFrequencyHz.toFixed(2)} Hz</strong>
        <span>FREQUENCY</span>
      </div>
      <div className="asset-reading">
        <strong>
          {node.currentLoadMw} / {node.effectiveCapacityMw} MW
        </strong>
        <span>LOAD / EFFECTIVE CAPACITY</span>
      </div>
      <StatusBadge tone={tone}>{node.severity}</StatusBadge>
    </div>
  );
};

const Timeline: React.FC<{ gridCase: GridCase }> = ({ gridCase }) => (
  <div className="timeline">
    {[...gridCase.continuumEvents].reverse().slice(0, 5).map((event) => (
      <article className="timeline-entry" key={event.eventId}>
        <span className="timeline-marker" aria-hidden="true" />
        <div className="timeline-body">
          <div className="timeline-line">
            <strong>
              {event.fromState ? `${event.fromState} → ${event.toState}` : event.toState}
            </strong>
            <time>{formatTimestamp(event.timestamp)}</time>
          </div>
          <p>{event.evidenceNote}</p>
          <span className="timeline-actor">
            {event.actorType} / {event.actorId} / {event.nodeCode}
          </span>
        </div>
      </article>
    ))}
  </div>
);

const SignalReview: React.FC<{
  gridCase: GridCase;
  signalId: string | null;
  decisionNote: string;
  disabled: boolean;
  onNoteChange: (value: string) => void;
  onDecision: (decision: "ACCEPT" | "REJECT" | "HOLD") => void;
}> = ({ gridCase, signalId, decisionNote, disabled, onNoteChange, onDecision }) => {
  const signal = gridCase.signals.find((item) => item.signalId === signalId);
  if (!signal) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark">—</span>
        <strong>No recommendation awaiting review</strong>
        <p>Recommendations appear here after the review stages are complete.</p>
      </div>
    );
  }

  const linkedLogs = gridCase.currentNode.activeSymptomLogs.filter((log) =>
    signal.triggeringLogIds.includes(log.logId)
  );

  return (
    <div className="signal-review">
      <div className="signal-summary">
        <div>
          <div className="eyebrow">Recommendation packet · {signal.signalId.slice(0, 12)}</div>
          <h3>{signal.summary}</h3>
        </div>
        <StatusBadge tone="warning">PENDING DISPATCHER</StatusBadge>
      </div>
      <p className="signal-rationale">{signal.rationale}</p>
      <div className="signal-data-grid">
        <div>
          <span className="eyebrow">CURRENT LOAD / EFFECTIVE CAPACITY</span>
          <strong>
            {gridCase.currentNode.currentLoadMw} / {gridCase.currentNode.effectiveCapacityMw} MW
          </strong>
        </div>
        <div>
          <span className="eyebrow">PROJECTED FREQUENCY</span>
          <strong>{signal.projectedFrequencyHz.toFixed(2)} Hz</strong>
        </div>
        <div>
          <span className="eyebrow">INDICATIVE LOAD DELTA</span>
          <strong>{signal.loadDeltaMw > 0 ? "+" : ""}{signal.loadDeltaMw} MW</strong>
        </div>
      </div>
      <div className="invalidation-note">
        <strong>Revalidation required</strong>
        <span>{signal.invalidationCondition}</span>
      </div>
      {linkedLogs.length > 0 && (
        <div className="evidence-list">
          <span className="eyebrow">LINKED FIELD EVIDENCE</span>
          {linkedLogs.flatMap((log) =>
            log.symptoms.map((symptom) => (
              <div className="evidence-item" key={`${log.logId}-${symptom}`}>
                <span>!</span> {symptom}
              </div>
            ))
          )}
        </div>
      )}
      <label className="field-label" htmlFor="decision-note">Decision note · required</label>
      <textarea
        id="decision-note"
        className="text-field decision-note"
        value={decisionNote}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Record the evidence reviewed and rationale for this decision."
        rows={3}
      />
      {disabled && (
        <p className="inline-warning">
          Global hold is active. Clear it before recording a decision.
        </p>
      )}
      <div className="decision-actions">
        <button
          className="button button-accept"
          disabled={!decisionNote.trim() || disabled}
          onClick={() => onDecision("ACCEPT")}
        >
          ACCEPT
        </button>
        <button
          className="button button-reject"
          disabled={!decisionNote.trim() || disabled}
          onClick={() => onDecision("REJECT")}
        >
          REJECT
        </button>
        <button
          className="button button-hold"
          disabled={!decisionNote.trim() || disabled}
          onClick={() => onDecision("HOLD")}
        >
          HOLD AT STAGE
        </button>
      </div>
      <p className="decision-disclaimer">
        Decisions are recorded for audit only. Grid OS never sends equipment commands.
      </p>
    </div>
  );
};

export const OverviewPage: React.FC<{
  onOpenGuide: () => void;
  onSwitchWorkspace: () => void;
}> = ({ onOpenGuide, onSwitchWorkspace }) => {
  const routeQuery = new URLSearchParams(window.location.search);
  const initialTour = routeQuery.get("tour");
  const {
    activeCase,
    cases,
    currentOperator,
    updateNodeState,
    authorizeSignal,
    createCase,
  } = useGridOSStore();
  const [workspace, setWorkspace] = useState<Workspace>("overview");
  const [killSwitch, setKillSwitch] = useState(false);
  const [stageNote, setStageNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [notice, setNotice] = useState("");
  const [simulation, setSimulation] = useState<ReturnType<typeof createSimulationSummary> | null>(null);
  const [tour, setTour] = useState<WorkspaceTour | null>(() =>
    initialTour === "agent" || initialTour === "practice"
      ? {
          kind: initialTour,
          step: 0,
          playing: initialTour === "agent",
          delay: 2200,
        }
      : null
  );

  const demoMode = routeQuery.get("demo") === "true";
  const activeSignal = activeCase?.signals.find(
    (signal) => signal.status === "PENDING_DISPATCHER"
  );
  const veilOpenCount = cases.reduce(
    (total, gridCase) =>
      total +
      (gridCase.currentNode.currentState !== "SFAE"
        ? gridCase.signals.filter((signal) => signal.status === "AUTHORIZED").length
        : 0),
    0
  );
  const nextStage = useMemo(() => {
    if (!activeCase) return null;
    return STAGE_ORDER[STAGE_ORDER.indexOf(activeCase.currentNode.currentState) + 1] ?? null;
  }, [activeCase]);
  const title = NAV_ITEMS.find((item) => item.id === workspace)?.label ?? "Overview";

  const showMessage = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 5000);
  };

  const launchTemporaryTour = (kind: "agent" | "practice") => {
    const query = new URLSearchParams({
      demo: "true",
      enter: "true",
      tour: kind,
    });
    window.location.assign(`${window.location.pathname}?${query.toString()}`);
  };

  const closeTour = () => {
    setTour(null);
    const query = new URLSearchParams(window.location.search);
    query.delete("enter");
    query.delete("tour");
    const suffix = query.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${suffix ? `?${suffix}` : ""}`
    );
  };

  const goToTourStep = (step: number) => {
    if (step < 0 || step >= NAV_ITEMS.length) return;
    setWorkspace(NAV_ITEMS[step].id);
    setTour((current) => current ? { ...current, step } : current);
  };

  const startGuidedTour = () => {
    setWorkspace(NAV_ITEMS[0].id);
    setTour({ kind: "guided", step: 0, playing: false, delay: 2200 });
  };

  const startAgentDemoTour = () => launchTemporaryTour("agent");

  const startPracticeTour = () => launchTemporaryTour("practice");

  const selectWorkspace = (nextWorkspace: Workspace) => {
    setWorkspace(nextWorkspace);
    if (tour && (tour.kind === "guided" || tour.kind === "agent")) {
      const step = NAV_ITEMS.findIndex((item) => item.id === nextWorkspace);
      if (step >= 0) setTour({ ...tour, step });
    }
  };

  const toggleAgentTour = () => {
    if (!tour || tour.kind !== "agent") return;
    if (!tour.playing && tour.step === NAV_ITEMS.length - 1) {
      setWorkspace(NAV_ITEMS[0].id);
      setTour({ ...tour, step: 0, playing: true });
      return;
    }
    setTour({ ...tour, playing: !tour.playing });
  };

  useEffect(() => {
    if (tour?.kind !== "agent" || !tour.playing) return undefined;
    const timer = window.setTimeout(() => {
      const nextStep = tour.step + 1;
      if (nextStep >= NAV_ITEMS.length) {
        setTour((current) =>
          current?.kind === "agent" ? { ...current, playing: false } : current
        );
        return;
      }

      setWorkspace(NAV_ITEMS[nextStep].id);
      setTour((current) =>
        current?.kind === "agent" ? { ...current, step: nextStep } : current
      );
    }, tour.delay);

    return () => window.clearTimeout(timer);
  }, [tour]);

  const practiceStep = tour?.kind === "practice" ? PRACTICE_STEPS[tour.step] : null;

  const advancePracticeTour = () => {
    if (!activeCase || tour?.kind !== "practice" || tour.step === 6) return;
    if (tour.step >= PRACTICE_STEPS.length - 1) {
      closeTour();
      return;
    }

    const nextPracticeStep = PRACTICE_STEPS[tour.step + 1];
    const advanced = updateNodeState(
      activeCase.caseId,
      nextPracticeStep.stage,
      `Practice tour review: ${nextPracticeStep.explanation}`
    );
    if (!advanced) {
      showMessage("Practice stage could not advance. Restart the temporary practice tour to reset the drill.");
      return;
    }
    setTour({ ...tour, step: tour.step + 1 });
  };

  const acceptPracticeSignal = () => {
    if (!activeCase || tour?.kind !== "practice") return;
    const pendingSignal = activeCase.signals.find(
      (signal) => signal.status === "PENDING_DISPATCHER"
    );
    if (!pendingSignal) {
      showMessage("The practice recommendation is not available. Restart the temporary practice tour.");
      return;
    }

    const accepted = authorizeSignal(
      activeCase.caseId,
      pendingSignal.signalId,
      "ACCEPT",
      "Accepted for practice tour only; no equipment action."
    );
    if (!accepted) {
      showMessage("Practice decision was not recorded. The recommendation remains at the human review gate.");
      return;
    }
    setTour({ ...tour, step: tour.step + 1 });
  };

  useEffect(() => {
    if (activeCase || !tour || tour.kind !== "practice") return;
    closeTour();
  }, [activeCase, tour]);

  if (!activeCase) {
    const createFreshPracticeCase = () => {
      createCase("North District", "DRILL", DEMO_GRID_NODES[0]);
    };

    return (
      <div className="app-shell">
        <aside className="sidebar fresh-sidebar">
          <div className="brand">
            <span className="brand-mark">黒神</span>
            <span className="brand-copy"><strong>GRID OS</strong><small>EMPTY WORKSPACE</small></span>
          </div>
          <div className="sidebar-section-label">NO CASES LOADED</div>
          <div className="fresh-sidebar-note">
            This workspace is empty. Create a practice case to begin.
          </div>
          <div className="sidebar-bottom">
            <button className="session-switch-button" onClick={onSwitchWorkspace}>
              Workspace options
            </button>
          </div>
        </aside>
        <div className="workspace">
          <GridHeader
            caseType="SIMULATION"
            workspaceTitle="EMPTY WORKSPACE"
            processXp={0}
            onGuide={onOpenGuide}
            onSwitchWorkspace={onSwitchWorkspace}
            killSwitch={killSwitch}
            onKillSwitch={() => setKillSwitch((enabled) => !enabled)}
          />
          <main className="main-content">
            <section className="empty-workspace-panel panel">
              <div className="eyebrow">FRESH SESSION / ZERO CASES</div>
              <h1>Start with a clean workspace.</h1>
              <p>
                No saved cases were loaded. This prototype is not connected to
                live grid equipment. Create a clearly labeled DRILL case when
                you are ready to practice.
              </p>
              <div className="empty-workspace-actions">
                <button className="button button-primary" onClick={createFreshPracticeCase}>
                  Create practice case
                </button>
                <button className="button button-secondary" onClick={onSwitchWorkspace}>
                  Workspace options
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const handleStageAdvance = () => {
    if (!nextStage || !stageNote.trim()) return;
    const advanced = updateNodeState(activeCase.caseId, nextStage, stageNote);
    if (!advanced) {
      showMessage("Stage could not advance. Verify the case is active and the required note is present.");
      return;
    }
    setStageNote("");
    showMessage(
      nextStage === "SIGNAL"
        ? "Review stages complete. Recommendation packet created; human review is now required."
        : `${nextStage} recorded in Continuum.`
    );
  };

  const handleDecision = (decision: "ACCEPT" | "REJECT" | "HOLD") => {
    if (!activeSignal || !decisionNote.trim() || killSwitch) return;
    const recorded = authorizeSignal(
      activeCase.caseId,
      activeSignal.signalId,
      decision,
      decisionNote
    );
    if (!recorded) {
      showMessage("Decision was not recorded. Check the review state and VEIL switching limit.");
      return;
    }
    setDecisionNote("");
    showMessage(
      decision === "HOLD"
        ? "Decision recorded: HOLD. The signal remains at SIGNAL for further review."
        : `Decision recorded: ${decision}. The case moved to AUTHORIZE; no equipment command was sent.`
    );
  };

  const exportContinuum = () => {
    downloadText(
      `${activeCase.caseId.toLowerCase()}-continuum.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          classification: "SIMULATION — NOT FOR OPERATIONAL USE",
          case: activeCase,
        },
        null,
        2
      ),
      "application/json"
    );
  };

  const exportBrief = () => {
    const report = [
      "GRID OS / BRIEFOS REVIEW SUMMARY",
      "SIMULATION — NOT FOR OPERATIONAL USE",
      `Case: ${activeCase.caseId}`,
      `Operating area: ${activeCase.operatingArea}`,
      `Current stage: ${activeCase.currentNode.currentState}`,
      `Case status: ${activeCase.caseStatus}`,
      `Node: ${activeCase.currentNode.code}`,
      `Frequency: ${activeCase.currentNode.localFrequencyHz.toFixed(2)} Hz`,
      `Load / effective capacity: ${activeCase.currentNode.currentLoadMw} / ${activeCase.currentNode.effectiveCapacityMw} MW`,
      ...(simulation
        ? [
            "",
            "ILLUSTRATIVE SYNTHETIC SIMULATION",
            `Frequency nadir percentiles: P50 ${simulation.p50.toFixed(2)} Hz / P90 ${simulation.p90.toFixed(2)} Hz / P99 ${simulation.p99.toFixed(2)} Hz`,
            `Voltage recovery P50: ${simulation.recoveryP50.toFixed(0)} seconds`,
            `Primary capacity bottleneck: ${simulation.bottleneck}`,
            `Synthetic threshold pass rate: ${simulation.passRate.toFixed(1)}%`,
          ]
        : []),
      "",
      "This report summarizes a seeded demonstration case. It is not an operating instruction or an engineering study.",
    ].join("\n");
    downloadText(`${activeCase.caseId.toLowerCase()}-briefos.txt`, report, "text/plain");
  };

  const renderOverview = () => (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">NORTH DISTRICT / CONTROL ROOM</div>
          <h1>Dispatch overview</h1>
          <p>Review operating conditions, evidence, and process status — one stage at a time.</p>
        </div>
        <StatusBadge tone="warning">SIMULATION DATA</StatusBadge>
      </div>

      <div className="safety-banner">
        <span className="safety-mark" aria-hidden="true">!</span>
        <div>
          <strong>Recommendation only · no equipment control</strong>
          <p>Grid OS monitors and documents. All operating actions remain outside this workspace.</p>
        </div>
        <span className="mono">CASE {activeCase.caseId}</span>
      </div>

      <section className="metrics-grid" aria-label="Grid summary">
        <MetricCard
          label="System frequency"
          value={activeCase.currentNode.localFrequencyHz.toFixed(2)}
          unit="Hz"
          detail="Target reference 60.00 Hz · seeded telemetry"
          tone={activeCase.currentNode.localFrequencyHz < 59.9 ? "warning" : "nominal"}
        />
        <MetricCard
          label="Effective capacity"
          value={`${activeCase.currentNode.currentLoadMw} / ${activeCase.currentNode.effectiveCapacityMw}`}
          unit="MW"
          detail={`${((activeCase.currentNode.currentLoadMw / activeCase.currentNode.effectiveCapacityMw) * 100).toFixed(1)}% utilization · ${activeCase.currentNode.code}`}
          tone={activeCase.currentNode.currentLoadMw > activeCase.currentNode.effectiveCapacityMw ? "critical" : "nominal"}
        />
        <MetricCard
          label="Spinning reserve"
          value={activeCase.currentNode.spinningReserveMw.toFixed(0)}
          unit="MW"
          detail="Reported reserve · freshness not independently verified"
          tone="warning"
        />
        <MetricCard
          label="Decision queue"
          value={activeSignal ? "01" : "00"}
          detail={activeSignal ? "Human review required" : "No pending recommendation"}
          tone={activeSignal ? "warning" : "nominal"}
        />
      </section>

      <section className="panel process-panel">
        <PanelHeading
          eyebrow="Deterministic workflow"
          title="Process spine"
          trailing={<span className="mono process-count">{activeCase.currentNode.completedStates.length}/8 COMPLETE</span>}
        />
        <StateTrack
          currentState={activeCase.currentNode.currentState}
          completedStates={activeCase.currentNode.completedStates}
          highlightedStage={practiceStep?.stage}
        />
        <div className="stage-footer">
          <div>
            <span className="eyebrow">CURRENT STAGE</span>
            <strong>{activeCase.currentNode.currentState}</strong>
            <p>{STATE_DESCRIPTIONS[activeCase.currentNode.currentState]}</p>
          </div>
          {nextStage &&
            activeCase.caseStatus === "ACTIVE" &&
            activeCase.currentNode.currentState !== "SIGNAL" && (
            <div className="stage-advance">
              <label className="field-label" htmlFor="stage-note">
                Verification note · required
              </label>
              <textarea
                id="stage-note"
                className="text-field"
                value={stageNote}
                onChange={(event) => setStageNote(event.target.value)}
                placeholder={`Record evidence reviewed before ${nextStage}.`}
                rows={2}
              />
              <button
                className="button button-primary"
                disabled={!stageNote.trim()}
                onClick={handleStageAdvance}
              >
                Complete {activeCase.currentNode.currentState} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
          {(activeCase.currentNode.currentState === "SIGNAL" ||
            activeCase.currentNode.currentState === "AUTHORIZE") && (
            <a className="button button-primary" href="#review-gate" onClick={() => setWorkspace("review")}>
              {activeCase.currentNode.currentState === "SIGNAL"
                ? "Open review gate"
                : "View decision record"} <span aria-hidden="true">→</span>
            </a>
          )}
          {activeCase.currentNode.currentState === "SFAE" && (
            <StatusBadge tone="nominal">AUDIT RECORD FINALIZED</StatusBadge>
          )}
        </div>
      </section>

      <div className="overview-grid">
        <div>
          <NodeTelemetry
            node={activeCase.currentNode}
            isLive={activeCase.caseType === "LIVE"}
          />
          <button className="text-button assets-link" onClick={() => setWorkspace("assets")}>
            Open full asset board →
          </button>
        </div>

        <section className="panel activity-panel">
          <PanelHeading
            eyebrow="Continuum · immutable case history"
            title="Recent activity"
            trailing={<button className="text-button" onClick={() => setWorkspace("continuum")}>Open log →</button>}
          />
          <Timeline gridCase={activeCase} />
        </section>
      </div>

      <section className="panel gate-panel" id="review-gate">
        <PanelHeading
          eyebrow="Human authorization boundary"
          title="Review gate"
          trailing={<StatusBadge tone={activeSignal ? "warning" : "neutral"}>{activeSignal ? "ACTION REQUIRED" : "NO PENDING SIGNAL"}</StatusBadge>}
        />
        <SignalReview
          gridCase={activeCase}
          signalId={activeSignal?.signalId ?? null}
          decisionNote={decisionNote}
          disabled={killSwitch || veilOpenCount >= 2}
          onNoteChange={setDecisionNote}
          onDecision={handleDecision}
        />
      </section>
    </>
  );

  const renderAssets = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">READ-ONLY INVENTORY</div><h1>Substations &amp; feeders</h1><p>Seeded asset telemetry and field observations for the North District scenario.</p></div>
        <StatusBadge tone="warning">SIMULATION DATA</StatusBadge>
      </div>
      <section className="panel">
        <PanelHeading eyebrow="Asset board" title="Monitored nodes" />
        <div className="asset-list asset-list-expanded">
          {DEMO_GRID_NODES.map((node) => <AssetRow key={node.nodeId} node={node} />)}
        </div>
      </section>
      <section className="panel">
        <PanelHeading eyebrow="FieldForge · imported observations" title="Field units" />
        <div className="field-unit-grid">
          {DEMO_FIELD_UNITS.map((unit) => (
            <article className="field-unit" key={unit.unitId}>
              <span className="eyebrow">{unit.unitId} / {unit.role.replace(/_/g, " ")}</span>
              <strong>{unit.callsign}</strong>
              <span>{unit.leadEngineer} · {unit.status.replace(/_/g, " ")}</span>
              <StatusBadge tone={unit.status === "ON_SITE" ? "nominal" : "warning"}>SAFETY {unit.safetyScore}%</StatusBadge>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const renderScenarios = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">ARCADE · ISOLATED PRACTICE</div><h1>Scenarios</h1><p>Practice cases are isolated from operational data and do not issue commands.</p></div>
        <StatusBadge tone="warning">SIMULATION ONLY</StatusBadge>
      </div>
      <div className="scenario-grid">
        {[
          ["SCN-01", "Cascading fault review", "Review a seeded fault and record a verification trail."],
          ["SCN-02", "Data-center load step", "Assess a synthetic demand spike against available capacity."],
          ["SCN-03", "Black-start readiness", "Review restoration readiness evidence without switching instructions."],
        ].map(([code, name, description]) => (
          <article className="panel scenario-card" key={code}>
            <span className="eyebrow">{code} / TRAINING SCENARIO</span>
            <h2>{name}</h2>
            <p>{description}</p>
            <button
              className="button button-secondary"
              onClick={() => {
                createCase("North District", "DRILL", DEMO_GRID_NODES[0]);
                setWorkspace("overview");
                showMessage(`${code} practice case opened. All values remain simulated.`);
              }}
            >
              Open practice case →
            </button>
          </article>
        ))}
      </div>
    </>
  );

  const renderAgents = () => (
    <AgentControl onOpenReview={() => setWorkspace("review")} />
  );

  const renderScan = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">ACTIVE GRID ANOMALIES</div><h1>Scan</h1><p>Unverified or simulated findings are labeled; resolve data quality before assessment.</p></div>
        <StatusBadge tone="warning">2 OPEN FINDINGS</StatusBadge>
      </div>
      <section className="panel">
        <PanelHeading eyebrow="FieldForge / SCADA snapshot" title="Observation queue" />
        <div className="observation-list">
          {DEMO_GRID_NODES.flatMap((node) => node.activeSymptomLogs.map((log) => (
            <article className="observation-row" key={log.logId}>
              <div className="observation-head">
                <div><span className="eyebrow">{node.code} / {log.category.replace(/_/g, " ")}</span><h3>{log.headline}</h3></div>
                <StatusBadge tone={log.qcStatus === "VERIFIED" ? "nominal" : "warning"}>{log.qcStatus.replace(/_/g, " ")}</StatusBadge>
              </div>
              <ul>{log.symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul>
              <span className="mono observation-time">{formatTimestamp(log.timestamp)} · CAPACITY HAIRCUT {log.capacityHaircutPct}%</span>
            </article>
          )))}
        </div>
      </section>
    </>
  );

  const renderReview = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">AUTHORIZE · HUMAN GATE</div><h1>Review gate</h1><p>Evidence first. Record a decision and rationale; acceptance does not operate equipment.</p></div>
        <StatusBadge tone={activeSignal ? "warning" : "neutral"}>{activeSignal ? "PENDING REVIEW" : "QUEUE CLEAR"}</StatusBadge>
      </div>
      <section className="panel gate-panel">
        <PanelHeading eyebrow="Dispatcher decision" title="Recommendation packet" />
        <SignalReview
          gridCase={activeCase}
          signalId={activeSignal?.signalId ?? null}
          decisionNote={decisionNote}
          disabled={killSwitch || veilOpenCount >= 2}
          onNoteChange={setDecisionNote}
          onDecision={handleDecision}
        />
      </section>
    </>
  );

  const renderContinuum = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">CASE TRACE / {activeCase.caseId}</div><h1>Continuum</h1><p>Chronological record of observations, stage transitions, agent output, and human decisions.</p></div>
        <button className="button button-secondary" onClick={exportContinuum}>Export JSON</button>
      </div>
      <section className="panel">
        <PanelHeading eyebrow="Append-only case record" title={`${activeCase.continuumEvents.length} audit events`} />
        <div className="timeline timeline-full">
          {[...activeCase.continuumEvents].reverse().map((event) => (
            <article className="timeline-entry" key={event.eventId}>
              <span className="timeline-marker" aria-hidden="true" />
              <div className="timeline-body">
                <div className="timeline-line"><strong>{event.fromState ? `${event.fromState} → ${event.toState}` : event.toState}</strong><time>{formatTimestamp(event.timestamp)}</time></div>
                <p>{event.evidenceNote}</p>
                <span className="timeline-actor">{event.actorType} / {event.actorId} / {event.nodeCode}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const renderSimulation = () => (
    <>
      <div className="page-intro">
        <div><div className="eyebrow">ARCADE / REPRODUCIBLE DEMONSTRATION</div><h1>Simulation bank</h1><p>Illustrative synthetic results only. Not an engineering study, forecast, or operating limit.</p></div>
        <StatusBadge tone="warning">SIMULATION ONLY</StatusBadge>
      </div>
      <section className="panel simulation-panel">
        <PanelHeading eyebrow="1,000 deterministic sample iterations" title="Stability preview" />
        <div className="simulation-disclaimer">Synthetic scenario · compound contingencies are illustrative · never use these values for operating decisions.</div>
        {simulation ? (
          <div className="simulation-results">
            <div><span className="eyebrow">FREQUENCY NADIR · P50</span><strong>{simulation.p50.toFixed(2)} Hz</strong></div>
            <div><span className="eyebrow">FREQUENCY NADIR · P90</span><strong>{simulation.p90.toFixed(2)} Hz</strong></div>
            <div><span className="eyebrow">FREQUENCY NADIR · P99</span><strong>{simulation.p99.toFixed(2)} Hz</strong></div>
            <div><span className="eyebrow">VOLTAGE RECOVERY · P50</span><strong>{simulation.recoveryP50.toFixed(0)} sec</strong></div>
            <div><span className="eyebrow">PRIMARY CAPACITY BOTTLENECK</span><strong>{simulation.bottleneck}</strong></div>
            <div><span className="eyebrow">SYNTHETIC THRESHOLD PASS RATE</span><strong>{simulation.passRate.toFixed(1)}%</strong></div>
            <div><span className="eyebrow">SAMPLE COUNT</span><strong>1,000</strong></div>
          </div>
        ) : (
          <div className="empty-state"><span className="empty-state-mark">—</span><strong>No simulation run</strong><p>Run the seeded preview to generate reproducible synthetic results.</p></div>
        )}
        <div className="simulation-actions">
          <button className="button button-primary" onClick={() => setSimulation(createSimulationSummary())}>Run 1,000 iterations</button>
          <button className="button button-secondary" onClick={exportBrief}>Export BriefOS report</button>
          <button className="button button-secondary" onClick={exportContinuum}>Export Continuum JSON</button>
        </div>
      </section>
    </>
  );

  const workspaceContent: Record<Workspace, () => React.ReactNode> = {
    overview: renderOverview,
    assets: renderAssets,
    scenarios: renderScenarios,
    agents: renderAgents,
    scan: renderScan,
    review: renderReview,
    continuum: renderContinuum,
    simulation: renderSimulation,
  };

  const tourTab =
    tour && (tour.kind === "guided" || tour.kind === "agent")
      ? NAV_ITEMS[tour.step]
      : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setWorkspace("overview")}>
          <span className="brand-mark">黒神</span>
          <span className="brand-copy"><strong>GRID OS</strong><small>KUROGAMI · OPERATOR TERMINAL</small></span>
        </a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${workspace === item.id ? "nav-item-active" : ""} ${
                tourTab?.id === item.id ? "nav-item-tour-highlight" : ""
              }`}
              onClick={() => selectWorkspace(item.id)}
              aria-current={workspace === item.id ? "page" : undefined}
            >
              <span className="nav-mark">{item.mark}</span>
              <span>{item.label}</span>
              {item.id === "review" && activeSignal && <span className="nav-alert">1</span>}
            </button>
          ))}
        </nav>
        <section className="sidebar-training" aria-label="Tours and practice">
          <div className="sidebar-training-label">TOURS &amp; PRACTICE</div>
          <button
            className={tour?.kind === "guided" ? "sidebar-training-active" : ""}
            onClick={startGuidedTour}
          >
            Guided tab tour
          </button>
          <button onClick={startAgentDemoTour}>Timed demo agent</button>
          <button onClick={startPracticeTour}>Practice the process</button>
        </section>
        <div className="sidebar-bottom">
          <div className="operator-avatar">O</div>
          <div className="operator-copy">
            <strong>Operator</strong>
            <span>DISPATCH LVL 3</span>
            <small>{currentOperator} · DEMO WORKSPACE</small>
          </div>
          <span className="operator-status" title="Session active" />
        </div>
      </aside>

      <div className="workspace">
        <GridHeader
          caseType={activeCase.caseType}
          operatorName="DISPATCH LVL 3"
          gridFrequency={activeCase.currentNode.localFrequencyHz}
          veilOpenCount={veilOpenCount}
          veilLimit={2}
          workspaceTitle={title.toUpperCase()}
          processXp={505 + activeCase.currentNode.completedStates.length * 25}
          onGuide={onOpenGuide}
          onSwitchWorkspace={onSwitchWorkspace}
          killSwitch={killSwitch}
          onKillSwitch={() => setKillSwitch((enabled) => !enabled)}
        />
        <main className="main-content">
          {notice && <div className="notice-banner" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
          {killSwitch && (
            <div className="kill-banner" role="alert">
              <strong>GLOBAL HOLD ACTIVE</strong>
              <span>Pending review decisions are frozen. No equipment command is connected.</span>
              <button onClick={() => setKillSwitch(false)}>Clear hold</button>
            </div>
          )}
          {demoMode && (
            <div className="demo-strip">
              <span>PUBLIC PREVIEW · TEMPORARY DATA · NOT CONNECTED TO LIVE TELEMETRY</span>
              <button onClick={onSwitchWorkspace}>Workspace options</button>
            </div>
          )}
          {tour && (
            <section className="tour-coach" aria-live="polite">
              <div className="tour-coach-header">
                <span className="eyebrow">
                  {tour.kind === "guided"
                    ? `GUIDED TAB TOUR · ${String(tour.step + 1).padStart(2, "0")} / ${NAV_ITEMS.length}`
                    : tour.kind === "agent"
                      ? `DEMO AGENT RUN · ${String(tour.step + 1).padStart(2, "0")} / ${NAV_ITEMS.length}`
                      : `PRACTICE TOUR · STAGE ${String(tour.step + 1).padStart(2, "0")} / ${PRACTICE_STEPS.length}`}
                </span>
                <button className="text-button" onClick={closeTour}>EXIT TOUR ×</button>
              </div>
              <h2>
                {tourTab
                  ? tourTab.label
                  : practiceStep?.stage ?? "Practice complete"}
              </h2>
              <p>
                {tourTab
                  ? NAV_TOUR_DESCRIPTIONS[tourTab.id]
                  : practiceStep?.explanation ??
                    "The temporary drill reached SFAE. Its practice events are not saved to your live workspace."}
              </p>
              {tour.kind === "practice" ? (
                <div className="tour-coach-footer">
                  <span>CASE {activeCase.caseId} · DRILL · TEMPORARY</span>
                  {tour.step === 6 ? (
                    <button
                      className="button button-primary"
                      disabled={!activeSignal || killSwitch}
                      onClick={acceptPracticeSignal}
                    >
                      ACCEPT PRACTICE SIGNAL
                    </button>
                  ) : tour.step === PRACTICE_STEPS.length - 1 ? (
                    <button className="button button-secondary" onClick={closeTour}>
                      FINISH PRACTICE TOUR
                    </button>
                  ) : (
                    <button
                      className="button button-primary"
                      disabled={killSwitch}
                      onClick={advancePracticeTour}
                    >
                      CONTINUE TO {PRACTICE_STEPS[tour.step + 1]?.stage}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {tour.kind === "agent" && (
                    <label className="agent-tour-timing">
                      <span>TIME PER TAB</span>
                      <input
                        aria-label="Time per tab"
                        type="range"
                        min="1000"
                        max="5000"
                        step="250"
                        value={tour.delay}
                        onChange={(event) =>
                          setTour({ ...tour, delay: Number(event.target.value) })
                        }
                      />
                      <output>{(tour.delay / 1000).toFixed(2)} s</output>
                    </label>
                  )}
                  <div className="tour-coach-footer">
                    <span>{tour.kind === "agent" ? "TEMPORARY · NO CASE DATA CHANGED" : "READ-ONLY WORKSPACE WALKTHROUGH"}</span>
                    <div className="tour-coach-actions">
                      <button
                        className="button button-secondary"
                        disabled={tour.step === 0}
                        onClick={() => goToTourStep(tour.step - 1)}
                      >
                        ← PREVIOUS
                      </button>
                      {tour.kind === "agent" && (
                        <button className="button button-secondary" onClick={toggleAgentTour}>
                          {tour.playing ? "Ⅱ PAUSE" : tour.step === NAV_ITEMS.length - 1 ? "↻ REPLAY" : "▷ RESUME"}
                        </button>
                      )}
                      <button
                        className="button button-primary"
                        onClick={() =>
                          tour.step === NAV_ITEMS.length - 1
                            ? closeTour()
                            : goToTourStep(tour.step + 1)
                        }
                      >
                        {tour.step === NAV_ITEMS.length - 1 ? "FINISH TOUR" : "NEXT TAB →"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
          {workspaceContent[workspace]()}
        </main>
      </div>

    </div>
  );
};
