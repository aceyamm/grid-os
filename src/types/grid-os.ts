/**
 * Grid OS Core Type Definitions
 * Deterministic 9-stage grid dispatch and control workflow
 */

export type GridState =
  | "SCAN"
  | "FAULT"
  | "LOAD_CAP"
  | "ISLAND"
  | "SEQUENCE"
  | "RESERVE"
  | "SIGNAL"
  | "AUTHORIZE"
  | "SFAE";

export type GridSeverity = "NOMINAL" | "ELEVATED" | "CRITICAL" | "BLACK_START";

/**
 * FieldForge Ground Telemetry Layer:
 * Substation field engineers, line crews, and mobile transformer diagnostic units.
 */
export interface GridFieldUnit {
  unitId: string;
  callsign: string;
  leadEngineer: string;
  role:
    | "SUBSTATION_CREW"
    | "HV_LINE_TECH"
    | "PROTECTION_ENG"
    | "BESS_OPERATOR";
  status: "ON_SITE" | "DEPLOYED" | "STANDBY" | "NEEDS_REVIEW" | "OFFLINE";
  assignedNodeId: string | null;
  processScore: number; // 0-100
  safetyScore: number; // 0-100
}

/**
 * FieldForge Structured Diagnostic Log:
 * Physical equipment observations that apply deterministic MW capacity haircuts.
 */
export interface GridSymptomLog {
  logId: string;
  timestamp: string;
  nodeId: string;
  reportedByUnitId: string;
  reporterSafetyScore: number;
  category:
    | "TRANSFORMER_THERMAL"
    | "BREAKER_FAULT"
    | "LINE_DAMAGE"
    | "DATA_CENTER_SURGE"
    | "BESS_RESERVE";
  headline: string;
  symptoms: string[];
  capacityHaircutPct: number;
  qcStatus: "AWAITING_REVIEW" | "VERIFIED" | "FLAGGED";
}

/**
 * Monitored Substation, Transmission Corridor, or Black-Start Block
 */
export interface MonitoredGridNode {
  nodeId: string;
  code: string;
  name: string;
  type:
    | "SUBSTATION"
    | "TRANSMISSION_CORRIDOR"
    | "CRITICAL_LOAD_CLUSTER"
    | "BLACK_START_UNIT";
  currentState: GridState;
  stateEnteredAt: string;
  completedStates: GridState[];
  severity: GridSeverity;
  ratedCapacityMw: number;
  effectiveCapacityMw: number;
  currentLoadMw: number;
  localFrequencyHz: number;
  spinningReserveMw: number;
  linkedUnitIds: string[];
  activeSymptomLogs: GridSymptomLog[];
}

/**
 * Agent-Generated Switching / Load-Shedding Signal Requiring Human Gate Authorization
 */
export interface GridSignal {
  signalId: string;
  nodeId: string;
  generatedAt: string;
  agentId: string;
  actionType:
    | "CONTROLLED_LOAD_SHED"
    | "ISLAND_SEPARATION"
    | "BESS_DISCHARGE_INJECT"
    | "BLACK_START_CRANK"
    | "BREAKER_RECLOSE_HOLD";
  summary: string;
  rationale: string;
  triggeringLogIds: string[];
  projectedFrequencyHz: number;
  loadDeltaMw: number;
  invalidationCondition: string;
  status: "PENDING_DISPATCHER" | "AUTHORIZED" | "FOLDED" | "INVALIDATED";
  authorizedBy?: string;
  authorizedAt?: string;
  dispatcherNote?: string;
}

/**
 * Immutable Continuum Audit Event
 */
export interface GridContinuumEvent {
  eventId: string;
  timestamp: string;
  nodeCode: string;
  fromState: GridState | null;
  toState: GridState;
  actorType: "AGENT" | "DISPATCHER" | "FIELD_UNIT";
  actorId: string;
  evidenceNote: string;
  linkedLogIds: string[];
  veilOpenCount: number;
  veilLimit: number;
  processCompliant: boolean;
}

/**
 * State transition verification requirement
 */
export interface StageVerification {
  stageFrom: GridState;
  stageTo: GridState;
  requiredEvidence: string[];
  verificationNote: string;
  verifiedAt: string;
  verifiedBy: string;
}

/**
 * User role and authorization
 */
export interface GridOperator {
  operatorId: string;
  name: string;
  role:
    | "GRID_OPERATOR"
    | "CONTROL_ROOM_SUPERVISOR"
    | "FIELD_OPERATOR"
    | "ENGINEERING_REVIEWER"
    | "AUDITOR"
    | "ADMIN";
  clearanceLevel: number; // 1-5
  operatingAreas: string[];
  authorizedAt: string;
}

/**
 * Active grid case or scenario
 */
export interface GridCase {
  caseId: string;
  createdAt: string;
  createdBy: string;
  operatingArea: string;
  caseType: "LIVE" | "SIMULATION" | "DRILL";
  currentNode: MonitoredGridNode;
  relatedNodes: string[];
  signals: GridSignal[];
  continuumEvents: GridContinuumEvent[];
  caseStatus: "ACTIVE" | "HELD" | "RESOLVED" | "ARCHIVED";
  lastModifiedAt: string;
}
