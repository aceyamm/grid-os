import React from "react";
import { MonitoredGridNode } from "../types/grid-os";

interface NodeTelemetryProps {
  node: MonitoredGridNode;
  isLive?: boolean;
}

export const NodeTelemetry: React.FC<NodeTelemetryProps> = ({
  node,
  isLive = false,
}) => {
  const utilization =
    node.effectiveCapacityMw > 0
      ? (node.currentLoadMw / node.effectiveCapacityMw) * 100
      : 0;
  const overloaded = utilization > 100;
  const severityTone =
    overloaded || node.severity === "CRITICAL"
      ? "critical"
      : node.severity === "ELEVATED"
        ? "warning"
        : "nominal";

  return (
    <section className="panel telemetry-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">{node.type.replace(/_/g, " ")} / SELECTED NODE</div>
          <h2>{node.code} <span className="telemetry-name">{node.name}</span></h2>
        </div>
        <span className={`status-badge status-${severityTone}`}>{node.severity}</span>
      </div>
      {!isLive && (
        <div className="telemetry-source">SIMULATION DATA · NOT CONNECTED TO LIVE TELEMETRY</div>
      )}
      <div className="telemetry-grid">
        <div className="telemetry-cell">
          <span className="eyebrow">LOCAL FREQUENCY</span>
          <strong className={`frequency-${node.localFrequencyHz < 59.9 ? "warning" : "nominal"}`}>
            {node.localFrequencyHz.toFixed(2)} <small>Hz</small>
          </strong>
        </div>
        <div className="telemetry-cell">
          <span className="eyebrow">SPINNING RESERVE</span>
          <strong>{node.spinningReserveMw.toFixed(0)} <small>MW</small></strong>
        </div>
        <div className="telemetry-cell telemetry-capacity">
          <div className="telemetry-capacity-head">
            <span className="eyebrow">LOAD / EFFECTIVE CAPACITY</span>
            <strong className={overloaded ? "text-critical" : ""}>
              {node.currentLoadMw} / {node.effectiveCapacityMw} MW
            </strong>
          </div>
          <div
            className="capacity-track"
            role="meter"
            aria-label="Capacity utilization"
            aria-valuemin={0}
            aria-valuemax={150}
            aria-valuenow={Math.min(150, Math.round(utilization))}
          >
            <span
              className={`capacity-fill capacity-fill-${severityTone}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <span className="capacity-detail">
            {utilization.toFixed(1)}% utilization · rated {node.ratedCapacityMw} MW
          </span>
        </div>
      </div>
      {node.activeSymptomLogs.length > 0 && (
        <div className="telemetry-logs">
          <span className="eyebrow">FIELD OBSERVATIONS</span>
          {node.activeSymptomLogs.map((log) => (
            <article className="telemetry-log" key={log.logId}>
              <div>
                <strong>{log.headline}</strong>
                <span>{log.qcStatus.replace(/_/g, " ")} · −{log.capacityHaircutPct}% reported capacity haircut</span>
              </div>
              <ul>{log.symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
