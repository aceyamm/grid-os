/**
 * Grid OS Demo Data
 * Seeded utility scenario for demonstration and testing
 */

import {
  MonitoredGridNode,
  GridSymptomLog,
  GridFieldUnit,
  GridSeverity,
} from "../types/grid-os";
import { v4 as uuidv4 } from "uuid";

export const DEMO_FIELD_UNITS: GridFieldUnit[] = [
  {
    unitId: "FU-001",
    callsign: "Substation North-1",
    leadEngineer: "James Chen",
    role: "SUBSTATION_CREW",
    status: "ON_SITE",
    assignedNodeId: "NODE-SUB-N04",
    processScore: 92,
    safetyScore: 95,
  },
  {
    unitId: "FU-002",
    callsign: "Line Tech HV-230",
    leadEngineer: "Maria Rodriguez",
    role: "HV_LINE_TECH",
    status: "DEPLOYED",
    assignedNodeId: "NODE-FDR-230KV",
    processScore: 88,
    safetyScore: 90,
  },
  {
    unitId: "FU-003",
    callsign: "BESS Team Alpha",
    leadEngineer: "David Kim",
    role: "BESS_OPERATOR",
    status: "ON_SITE",
    assignedNodeId: "NODE-BESS-01",
    processScore: 85,
    safetyScore: 92,
  },
];

export const DEMO_SYMPTOM_LOGS: GridSymptomLog[] = [
  {
    logId: uuidv4(),
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    nodeId: "NODE-SUB-N04",
    reportedByUnitId: "FU-001",
    reporterSafetyScore: 95,
    category: "TRANSFORMER_THERMAL",
    headline: "Transformer Bank 2 elevated top-oil temperature",
    symptoms: [
      "Bank 2 top-oil temp at 94°C",
      "Cooling fan bank B tripped",
      "Winding temperature estimated at 102°C",
    ],
    capacityHaircutPct: 35,
    qcStatus: "VERIFIED",
  },
  {
    logId: uuidv4(),
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    nodeId: "NODE-FDR-230KV",
    reportedByUnitId: "FU-002",
    reporterSafetyScore: 90,
    category: "LINE_DAMAGE",
    headline: "Storm damage on transmission line",
    symptoms: [
      "Moderate tree contact on phase A",
      "Line reclosed once, locked out on second attempt",
      "Insulator damage not ruled out",
    ],
    capacityHaircutPct: 50,
    qcStatus: "AWAITING_REVIEW",
  },
];

export const DEMO_GRID_NODES: MonitoredGridNode[] = [
  {
    nodeId: "NODE-SUB-N04",
    code: "SUB-N04",
    name: "Substation North-4 (Primary District)",
    type: "SUBSTATION",
    currentState: "SCAN",
    stateEnteredAt: new Date().toISOString(),
    completedStates: [],
    severity: "ELEVATED",
    ratedCapacityMw: 450,
    effectiveCapacityMw: 293,
    currentLoadMw: 310,
    localFrequencyHz: 59.92,
    spinningReserveMw: 65,
    linkedUnitIds: ["NODE-FDR-230KV", "NODE-BESS-01"],
    activeSymptomLogs: [DEMO_SYMPTOM_LOGS[0]],
  },
  {
    nodeId: "NODE-FDR-230KV",
    code: "FDR-230KV",
    name: "230kV Feeder - East Zone",
    type: "TRANSMISSION_CORRIDOR",
    currentState: "SCAN",
    stateEnteredAt: new Date().toISOString(),
    completedStates: [],
    severity: "ELEVATED",
    ratedCapacityMw: 600,
    effectiveCapacityMw: 300,
    currentLoadMw: 280,
    localFrequencyHz: 59.88,
    spinningReserveMw: 45,
    linkedUnitIds: ["NODE-SUB-N04"],
    activeSymptomLogs: [DEMO_SYMPTOM_LOGS[1]],
  },
  {
    nodeId: "NODE-BESS-01",
    code: "BESS-01",
    name: "Battery Energy Storage System - Cluster A",
    type: "CRITICAL_LOAD_CLUSTER",
    currentState: "SCAN",
    stateEnteredAt: new Date().toISOString(),
    completedStates: [],
    severity: "NOMINAL",
    ratedCapacityMw: 150,
    effectiveCapacityMw: 150,
    currentLoadMw: 0,
    localFrequencyHz: 60.0,
    spinningReserveMw: 150,
    linkedUnitIds: [],
    activeSymptomLogs: [],
  },
  {
    nodeId: "NODE-BLK-HYDRO-1",
    code: "BLK-HYDRO-1",
    name: "Black-Start Unit - Hydro Plant 1",
    type: "BLACK_START_UNIT",
    currentState: "SCAN",
    stateEnteredAt: new Date().toISOString(),
    completedStates: [],
    severity: "NOMINAL",
    ratedCapacityMw: 200,
    effectiveCapacityMw: 200,
    currentLoadMw: 25,
    localFrequencyHz: 60.0,
    spinningReserveMw: 175,
    linkedUnitIds: [],
    activeSymptomLogs: [],
  },
];

export const GRID_STATE_SEQUENCE = [
  "SCAN",
  "FAULT",
  "LOAD_CAP",
  "ISLAND",
  "SEQUENCE",
  "RESERVE",
  "SIGNAL",
  "AUTHORIZE",
  "SFAE",
] as const;

export const STATE_DESCRIPTIONS: Record<string, string> = {
  SCAN: "Collect the current operating picture and telemetry snapshot",
  FAULT: "Identify and document reported faults and affected assets",
  LOAD_CAP:
    "Assess load against approved equipment and system limits and capacity",
  ISLAND:
    "Evaluate potential islanding boundaries and dependencies for grid stability",
  SEQUENCE: "Review proposed restoration or switching plans against procedures",
  RESERVE: "Assess available reserve and associated uncertainty margins",
  SIGNAL:
    "Present the agent recommendation, evidence, and unresolved constraints",
  AUTHORIZE:
    "Require authorized human to record ACCEPT, REJECT, or HOLD with rationale",
  SFAE: "Finalize the record and capture after-action evaluation in Continuum",
};

export const ACTION_TYPE_DESCRIPTIONS: Record<string, string> = {
  CONTROLLED_LOAD_SHED:
    "Shed non-critical load to restore frequency balance and stability",
  ISLAND_SEPARATION:
    "Separate grid section to prevent cascading frequency collapse",
  BESS_DISCHARGE_INJECT:
    "Activate battery storage to inject power for immediate stabilization",
  BLACK_START_CRANK: "Initiate black-start cranking sequence for restoration",
  BREAKER_RECLOSE_HOLD:
    "Hold breaker reclosing to prevent tripping on fault restoration",
};
