import React from "react";

interface LandingPageProps {
  onEnter: () => void;
  onOpenGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onOpenGuide,
}) => (
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
        SIMULATION TERMINAL READY
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
            ENTER DISPATCH TERMINAL <span aria-hidden="true">→</span>
          </button>
          <button className="landing-guide-button" onClick={onOpenGuide}>
            OPEN SYSTEM GUIDE
          </button>
        </div>
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
