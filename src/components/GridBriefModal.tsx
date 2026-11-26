import React from "react";

interface GridBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GridBriefModal: React.FC<GridBriefModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="brief-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
      >
        <header className="brief-header">
          <div className="brief-brand-mark" aria-hidden="true">GOS</div>
          <div className="brief-heading">
            <div className="eyebrow">KUROGAMI GROUP / ENERGY INFRASTRUCTURE</div>
            <h2 id="brief-title">
              Grid OS <span>(GOS)</span>
              <br />
              Substation Load-Shedding &amp; Black-Start Terminal
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close brief">
            ×
          </button>
        </header>

        <div className="brief-meta">
          <div>
            <span className="eyebrow">SYSTEM NAME</span>
            <strong>Grid OS — Substation Dispatch &amp; Black-Start Restoration Terminal</strong>
          </div>
          <div>
            <span className="eyebrow">PARENT INITIATIVE</span>
            <strong>
              <a href="https://kurogamigroup.com" target="_blank" rel="noreferrer">
                Kurogami Group
              </a>{" "}
              · Energy Infrastructure
            </strong>
          </div>
        </div>

        <section className="brief-doctrine">
          <span className="eyebrow">CORE DOCTRINE / PROCESS BEFORE SWITCHING</span>
          <p>
            Risk is named, bounded, and owned. The agent simulates stability and
            sequences switching steps; control-room dispatchers retain sole
            authority for every breaker maneuver.
          </p>
        </section>

        <section className="brief-section brief-chokepoint">
          <div className="brief-section-heading">
            <span>01</span>
            <h3>THE CHOKEPOINT</h3>
          </div>
          <p>
            Cascading blackouts, extreme-weather faults, and sudden AI data-center
            load steps can overwhelm control rooms when switching sequences are
            rushed under degraded transformer telemetry and tight spinning reserves.
          </p>
        </section>

        <section className="brief-section">
          <div className="brief-section-heading">
            <span>02</span>
            <h3>WHAT GRID OS DOES</h3>
          </div>
          <div className="brief-capabilities">
            <article>
              <span className="eyebrow">01 / STATE GATING</span>
              <h4>Deterministic process</h4>
              <p>
                Guides each substation and feeder through SCAN → FAULT → LOAD_CAP
                → ISLAND → SEQUENCE → RESERVE → SIGNAL → AUTHORIZE → SFAE.
              </p>
            </article>
            <article>
              <span className="eyebrow">02 / HUMAN AUTHORITY</span>
              <h4>Review Gate</h4>
              <p>
                Pauses at SIGNAL with projected frequency recovery (Hz), MW load
                delta, and invalidation rules until a dispatcher records ACCEPT,
                REJECT, or HOLD within VEIL switching limits.
              </p>
            </article>
            <article>
              <span className="eyebrow">03 / STABILITY TESTING</span>
              <h4>1,000-iteration stress testing</h4>
              <p>
                Target capability: test N-2 contingencies and data-center step
                loads against thermal deratings; review 90th- and 99th-percentile
                frequency nadirs.
              </p>
            </article>
          </div>
        </section>

        <section className="brief-section brief-io-section">
          <div className="brief-section-heading">
            <span>03</span>
            <h3>INPUTS &amp; OUTPUTS</h3>
          </div>
          <div className="brief-io">
            <article>
              <span className="eyebrow">INPUTS / TARGET SYSTEM</span>
              <ul>
                <li>Substation SCADA / PMU telemetry</li>
                <li>Transformer thermal ratings</li>
                <li>Spinning reserve and BESS headroom</li>
                <li>FieldForge line-crew logs</li>
              </ul>
            </article>
            <article>
              <span className="eyebrow">OUTPUTS / REVIEW ARTIFACTS</span>
              <ul>
                <li>Sequenced load-shedding blocks</li>
                <li>Microgrid island boundaries and black-start paths</li>
                <li>BriefOS summaries and Continuum audit traces</li>
              </ul>
            </article>
          </div>
        </section>

        <footer className="brief-boundary">
          <strong>PROTOTYPE BOUNDARY</strong>
          <p>
            This prototype uses seeded simulation data. It is not connected to
            live SCADA/PMU systems, does not validate N-2 or frequency-stability
            studies, and does not issue or sign operational switching instructions.
            Outputs are illustrative and not for operational use.
          </p>
        </footer>
      </article>
    </div>
  );
};
