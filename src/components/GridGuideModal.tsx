import React from "react";
import { GRID_STATE_SEQUENCE } from "../data/demo";
import { GridState } from "../types/grid-os";

interface GridGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnter?: () => void;
}

const GUIDE_STAGE_DESCRIPTIONS: Record<GridState, string> = {
  SCAN: "Ingest the simulated substation and feeder operating baseline.",
  FAULT: "Review reported breaker trips or line damage against available evidence.",
  LOAD_CAP: "Review thermal MW capacity and the configured VEIL window.",
  ISLAND: "Assess candidate isolation boundaries within the selected scenario.",
  SEQUENCE:
    "Review a simulated plan against utility-approved procedures; no executable order is generated.",
  RESERVE: "Review reported spinning reserve and battery storage headroom.",
  SIGNAL: "Present a recommendation with projected frequency and invalidation criteria.",
  AUTHORIZE:
    "Dispatcher records ACCEPT, REJECT, or HOLD with a required note; no breaker actuation is connected.",
  SFAE: "Finalize the simulated review and record the after-action event in Continuum.",
};

export const GridGuideModal: React.FC<GridGuideModalProps> = ({
  isOpen,
  onClose,
  onEnter,
}) => {
  if (!isOpen) return null;

  const enterTerminal = () => {
    onClose();
    onEnter?.();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <div className="guide-cover">
          <div className="guide-cover-topline">
            <span className="eyebrow">GOS / FIELD GUIDE / 01</span>
            <button className="icon-button" onClick={onClose} aria-label="Close guide">
              ×
            </button>
          </div>
          <div className="guide-cover-title">
            <span className="guide-energy-symbol" aria-hidden="true">G</span>
            <div>
              <div className="eyebrow">SUBSTATION &amp; ENERGY DISPATCH</div>
              <h2 id="guide-title">
                Grid OS (GOS) <span>—</span>
                <br />
                Substation &amp; Energy Dispatch Guide
              </h2>
            </div>
          </div>
          <p>Operator reference · process before position · recommendations are not control actions</p>
        </div>

        <nav className="guide-index" aria-label="Guide contents">
          <a href="#guide-overview">01 / OVERVIEW</a>
          <a href="#guide-workflow">02 / OPERATOR WORKFLOW</a>
          <a href="#guide-governance">03 / GOVERNANCE &amp; TOOLS</a>
        </nav>

        <section className="guide-section" id="guide-overview">
          <div className="guide-section-title"><span>01</span><h3>OVERVIEW</h3></div>
          <p>
            Grid OS is a deterministic substation load-shedding and black-start
            restoration review terminal built on Kurogami Group’s process-governed
            agent harness. This prototype runs in simulation with operator-entered
            models and imported FieldForge line-crew logs; it is not connected to
            live SCADA, EMS, or breakers.
          </p>
          <p>
            Cascading disturbances, thermal deratings, and AI data-center load
            spikes can complicate control-room review when telemetry is degraded.
            Grid OS is designed to structure evidence and record a human decision;
            it does not replace utility-approved procedures, engineering studies,
            or operator judgment.
          </p>
          <div className="guide-overview-facts">
            <div><span className="eyebrow">SYSTEM ROLE</span><strong>Monitor · assess · recommend</strong></div>
            <div><span className="eyebrow">PROCESS SPINE</span><strong>SCAN → SFAE · nine stages</strong></div>
            <div><span className="eyebrow">CONTROL BOUNDARY</span><strong>No live control connection</strong></div>
          </div>
        </section>

        <section className="guide-section" id="guide-workflow">
          <div className="guide-section-title"><span>02</span><h3>OPERATOR WORKFLOW</h3></div>
          <ol className="guide-workflow-list">
            <li><span>01</span><div><strong>Review substations &amp; feeders</strong><p>Inspect seeded ratings, reserve figures, and available FieldForge logs on the asset board.</p></div></li>
            <li><span>02</span><div><strong>Scan &amp; bound the review</strong><p>Review anomaly status, open a practice scenario, and check the VEIL window in the governance bar. The demo limit is fixed.</p></div></li>
            <li><span>03</span><div><strong>Advance the process</strong><p>Use the manual stepper or simulated agent playback to complete stages in sequence. Completing RESERVE creates a recommendation and pauses for human review.</p></div></li>
            <li><span>04</span><div><strong>Review the signal</strong><p>Inspect projected frequency, load delta, linked evidence, and invalidation conditions. Record ACCEPT, REJECT, or HOLD with a decision note.</p></div></li>
          </ol>
          <p>The process spine is:</p>
          <ol className="guide-stage-list">
            {GRID_STATE_SEQUENCE.map((stage, index) => (
              <li key={stage}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
                <p>{GUIDE_STAGE_DESCRIPTIONS[stage]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="guide-section" id="guide-governance">
          <div className="guide-section-title"><span>03</span><h3>GOVERNANCE &amp; TOOLS</h3></div>
          <div className="guide-tool-grid">
            <article><strong>VEIL</strong><p>Displays the concurrent switching window and its configured limit.</p></article>
            <article><strong>KILL SWITCH &amp; PERSISTENCE</strong><p>Global hold blocks pending review decisions. Standard mode saves case data in this browser; <code>?demo=true</code> is temporary and does not persist.</p></article>
            <article><strong>FIELDFORGE</strong><p>Surfaces field observations with verification status and source context.</p></article>
            <article><strong>CONTINUUM</strong><p>Records case events and provides a JSON trace export.</p></article>
            <article><strong>SIMULATION BANK · 1,000 ITERATIONS</strong><p>Shows repeatable synthetic percentiles. This is not a validated N-2 contingency, black-start, or grid-stability study.</p></article>
            <article><strong>BRIEFOS</strong><p>Exports a text review summary; it is not a compliance determination.</p></article>
          </div>
        </section>

        <div className="guide-warning">
          Grid OS does not actuate breakers or connect to live SCADA/EMS. Simulation
          values are illustrative and not for operational use. Do not enter
          sensitive or operational data in this prototype.
        </div>
        {onEnter && (
          <div className="guide-modal-actions">
            <button className="button button-primary" onClick={enterTerminal}>
              Enter dispatch terminal <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
