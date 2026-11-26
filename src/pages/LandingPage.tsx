import React, { useState } from "react";

type SessionMode = "saved" | "demo" | "fresh";

interface LandingPageProps {
  onEnter: () => void;
  onViewBrief: () => void;
  onLoadDemo: () => void;
  onReturnToSaved: () => void;
  onStartFresh: () => void;
  sessionMode: SessionMode;
  sessionError: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onViewBrief,
  onLoadDemo,
  onReturnToSaved,
  onStartFresh,
  sessionMode,
  sessionError,
}) => {
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const [confirmFresh, setConfirmFresh] = useState(false);

  const sessionStatus = {
    saved: "SAVED WORKSPACE READY",
    demo: "TEMPORARY DEMO READY",
    fresh: "EMPTY WORKSPACE READY",
  }[sessionMode];

  return (
    <main className="landing-page">
    <header className="landing-header">
      <a className="landing-brand" href="#" onClick={(event) => event.preventDefault()}>
        <span className="landing-brand-mark">黒神</span>
        <span>
          <strong>GRID OS</strong>
          <small>KUROGAMI GROUP / ENERGY SYSTEMS</small>
        </span>
      </a>
      <div className="landing-status">
        <span className="live-dot" />
        {sessionStatus}
      </div>
    </header>

    <section className="landing-hero">
      <div className="landing-copy">
        <div className="landing-kicker">
          <span className="live-dot" />
          PROCESS BEFORE SWITCHING
        </div>
        <div className="eyebrow landing-system-code">GOS / SUBSTATION &amp; ENERGY DISPATCH</div>
        <h1>
          Keep the grid in focus.
          <br />
          <em>Keep process first.</em>
        </h1>
        <p className="landing-description">
          A governed workspace to review grid conditions, field evidence, and
          recovery readiness — with every recommendation held for a human decision.
        </p>
        <div className="landing-actions">
          <button className="landing-enter-button" onClick={onEnter}>
            ENTER DISPATCH WORKSPACE <span aria-hidden="true">→</span>
          </button>
          <button className="landing-guide-button landing-brief-button" onClick={onViewBrief}>
            VIEW BRIEF
          </button>
          <button
            aria-controls="landing-session-options"
            aria-expanded={showSessionOptions}
            className="landing-guide-button"
            onClick={() => {
              setShowSessionOptions((open) => !open);
              setConfirmFresh(false);
            }}
          >
            WORKSPACE OPTIONS
          </button>
        </div>
        {showSessionOptions && (
          <section className="landing-session-picker" id="landing-session-options">
            <div className="landing-session-picker-heading">
              <span className="eyebrow">CHOOSE WORKSPACE</span>
              <button
                className="icon-button"
                aria-label="Close workspace options"
                onClick={() => setShowSessionOptions(false)}
              >
                ×
              </button>
            </div>
            <button
              className="landing-session-option"
              onClick={onLoadDemo}
              aria-current={sessionMode === "demo" ? "true" : undefined}
            >
              <strong>Load demo data</strong>
              <span>Your saved live session stays untouched. Demo data is temporary.</span>
            </button>
            <button
              className="landing-session-option"
              onClick={onReturnToSaved}
              disabled={sessionMode === "saved"}
              aria-current={sessionMode === "saved" ? "true" : undefined}
            >
              <strong>Return to last live session</strong>
              <span>Restore the saved live workspace in this browser.</span>
            </button>
            {!confirmFresh ? (
              <button
                className="landing-session-option landing-session-option-danger"
                onClick={() => setConfirmFresh(true)}
              >
                <strong>Start completely fresh</strong>
                <span>Replace the saved live workspace with an empty one.</span>
              </button>
            ) : (
              <div className="landing-fresh-confirm" role="alert">
                <strong>Replace the saved workspace?</strong>
                <p>This clears its saved cases from this browser and opens a blank workspace.</p>
                <div>
                  <button
                    className="landing-guide-button"
                    onClick={() => setConfirmFresh(false)}
                  >
                    KEEP SAVED DATA
                  </button>
                  <button
                    className="landing-fresh-confirm-button"
                    onClick={onStartFresh}
                  >
                    CONFIRM &amp; START FRESH
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        {sessionError && <p className="landing-session-error" role="alert">{sessionError}</p>}
        <p className="landing-boundary">
          Grid OS monitors and recommends. No live SCADA/EMS or equipment control is connected.
        </p>
      </div>

      <div className="landing-schematic" aria-label="Illustrative simulated grid topology">
        <div className="schematic-heading">
          <span className="eyebrow">SIMULATED OPERATING AREA</span>
          <span className="schematic-signal">PREVIEW / 01</span>
        </div>
        <svg viewBox="0 0 480 300" role="img" aria-labelledby="schematic-title">
          <title id="schematic-title">Illustrative grid topology for the seeded simulation</title>
          <defs>
            <linearGradient id="grid-flow" x1="0" x2="1">
              <stop offset="0" stopColor="#56cbe8" stopOpacity=".15" />
              <stop offset=".5" stopColor="#56cbe8" stopOpacity=".8" />
              <stop offset="1" stopColor="#56cbe8" stopOpacity=".22" />
            </linearGradient>
          </defs>
          <path className="schematic-line" d="M66 142H183L261 76H396" />
          <path className="schematic-line schematic-line-muted" d="M183 142L261 224H396" />
          <path className="schematic-line" d="M261 76V224" />
          <path className="schematic-line schematic-flow" d="M66 142H183L261 76H396" />
          <circle className="schematic-node schematic-node-warning" cx="66" cy="142" r="8" />
          <circle className="schematic-orbit-node" cx="66" cy="142" r="4">
            <animateMotion
              dur="8s"
              path="M0 0H117L195 -66H330H195L117 0H0"
              repeatCount="indefinite"
            />
          </circle>
          <circle className="schematic-node" cx="183" cy="142" r="6" />
          <circle className="schematic-node" cx="261" cy="76" r="6" />
          <circle className="schematic-node schematic-node-storage" cx="261" cy="224" r="7" />
          <circle className="schematic-node" cx="396" cy="76" r="6" />
          <circle className="schematic-node" cx="396" cy="224" r="6" />
          <text x="40" y="174">SUB-N04</text>
          <text x="147" y="122">230 KV</text>
          <text x="226" y="54">EAST FEEDER</text>
          <text x="232" y="254">BESS-01</text>
          <text x="364" y="53">NORTH ZONE</text>
          <text x="366" y="252">HYDRO-01</text>
        </svg>
        <div className="schematic-legend">
          <span><i className="legend-dot legend-warning" /> ELEVATED</span>
          <span><i className="legend-dot" /> NOMINAL</span>
          <span>ILLUSTRATIVE ONLY</span>
        </div>
      </div>
    </section>

    <section className="landing-facts" aria-label="Grid OS preview details">
      <div><span className="eyebrow">PROCESS SPINE</span><strong>09 STAGES</strong><small>Deterministic review sequence</small></div>
      <div><span className="eyebrow">HUMAN GATE</span><strong>SIGNAL → AUTHORIZE</strong><small>Recommendation is not execution</small></div>
      <div><span className="eyebrow">ENVIRONMENT</span><strong>SEEDED SIMULATION</strong><small>Not connected to live telemetry</small></div>
    </section>

    <footer className="landing-footer">
      <span>GRID OS © 2026 · KUROGAMI GROUP</span>
      <span>PROCESS-GOVERNED ENERGY DISPATCH</span>
      <span>BUILT FOR REVIEW, NOT REMOTE CONTROL</span>
    </footer>
    </main>
  );
};
