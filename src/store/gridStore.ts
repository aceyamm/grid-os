/**
 * Grid OS Zustand store
 * Keeps the review workflow local and recommendation-only.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { DEMO_GRID_NODES } from "../data/demo";
import {
  GridCase,
  GridContinuumEvent,
  GridSignal,
  GridState,
} from "../types/grid-os";

const isTemporaryDemoMode = (): boolean =>
  typeof window === "undefined" ||
  new URLSearchParams(window.location.search).get("demo") === "true";

const temporaryDemoStorage: Storage = {
  get length() {
    return 0;
  },
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

const GRID_STATE_SEQUENCE: GridState[] = [
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

const createEvent = (
  nodeCode: string,
  fromState: GridState | null,
  toState: GridState,
  actorType: GridContinuumEvent["actorType"],
  actorId: string,
  evidenceNote: string
): GridContinuumEvent => ({
  eventId: uuidv4(),
  timestamp: new Date().toISOString(),
  nodeCode,
  fromState,
  toState,
  actorType,
  actorId,
  evidenceNote,
  linkedLogIds: [],
  veilOpenCount: 0,
  veilLimit: 2,
  processCompliant: true,
});

const createSeededCase = (): GridCase => {
  const node = {
    ...DEMO_GRID_NODES[0],
    activeSymptomLogs: [...DEMO_GRID_NODES[0].activeSymptomLogs],
    completedStates: [],
    stateEnteredAt: new Date().toISOString(),
  };
  const now = new Date().toISOString();
  const operatorId = "OP-001";

  return {
    caseId: "CASE-NORTH-04-DEMO",
    createdAt: now,
    createdBy: operatorId,
    operatingArea: "North District",
    caseType: "SIMULATION",
    currentNode: node,
    relatedNodes: DEMO_GRID_NODES.slice(1).map((relatedNode) => relatedNode.nodeId),
    signals: [],
    continuumEvents: [
      createEvent(
        node.code,
        null,
        "SCAN",
        "DISPATCHER",
        operatorId,
        "Seeded simulation case opened for review."
      ),
    ],
    caseStatus: "ACTIVE",
    lastModifiedAt: now,
  };
};

const initialCase = createSeededCase();

interface GridOSStore {
  cases: GridCase[];
  activeCase: GridCase | null;
  currentOperator: string;
  createCase: (
    operatingArea: string,
    caseType: "LIVE" | "SIMULATION" | "DRILL",
    node: GridCase["currentNode"]
  ) => void;
  setActiveCase: (caseId: string) => void;
  updateNodeState: (
    caseId: string,
    newState: GridState,
    note: string,
    actor?: { actorType: "AGENT" | "DISPATCHER"; actorId?: string }
  ) => boolean;
  replayFromStage: (
    caseId: string,
    stage: Exclude<GridState, "AUTHORIZE" | "SFAE">
  ) => boolean;
  authorizeSignal: (
    caseId: string,
    signalId: string,
    decision: "ACCEPT" | "REJECT" | "HOLD",
    note: string
  ) => boolean;
  setCurrentOperator: (operatorId: string) => void;
}

const createSignalForCase = (gridCase: GridCase): GridSignal => {
  const node = gridCase.currentNode;
  const overloaded = node.currentLoadMw > node.effectiveCapacityMw;
  const frequencyLow = node.localFrequencyHz < 59.9;
  const actionType: GridSignal["actionType"] =
    node.type === "BLACK_START_UNIT"
      ? "BLACK_START_CRANK"
      : overloaded
        ? "CONTROLLED_LOAD_SHED"
        : frequencyLow
          ? "BESS_DISCHARGE_INJECT"
          : "BREAKER_RECLOSE_HOLD";
  const loadDeltaMw = overloaded
    ? -Math.ceil(node.currentLoadMw - node.effectiveCapacityMw)
    : frequencyLow
      ? 25
      : 0;

  return {
    signalId: `SIG-${uuidv4()}`,
    nodeId: node.nodeId,
    generatedAt: new Date().toISOString(),
    agentId: "AGENT-GRID-01",
    actionType,
    summary: `Review ${actionType.replace(/_/g, " ").toLowerCase()} recommendation`,
    rationale: overloaded
      ? `Reported load is ${node.currentLoadMw.toFixed(0)} MW against ${node.effectiveCapacityMw.toFixed(0)} MW effective capacity.`
      : `Reported frequency is ${node.localFrequencyHz.toFixed(2)} Hz; operator review is required before any action.`,
    triggeringLogIds: node.activeSymptomLogs.map((log) => log.logId),
    projectedFrequencyHz: Math.min(60, node.localFrequencyHz + 0.08),
    loadDeltaMw,
    invalidationCondition:
      "Reassess if telemetry becomes stale, operating limits change, or reserve availability is revised.",
    status: "PENDING_DISPATCHER",
  };
};

export const useGridOSStore = create<GridOSStore>()(
  persist((set) => ({
  cases: [initialCase],
  activeCase: initialCase,
  currentOperator: "OP-001",

  createCase: (operatingArea, caseType, node) => {
    set((state) => {
      const now = new Date().toISOString();
      const newCase: GridCase = {
        caseId: `CASE-${uuidv4()}`,
        createdAt: now,
        createdBy: state.currentOperator,
        operatingArea,
        caseType,
        currentNode: {
          ...node,
          activeSymptomLogs: [...node.activeSymptomLogs],
          completedStates: [...node.completedStates],
        },
        relatedNodes: [],
        signals: [],
        continuumEvents: [
          createEvent(
            node.code,
            null,
            node.currentState,
            "DISPATCHER",
            state.currentOperator,
            "Case created."
          ),
        ],
        caseStatus: "ACTIVE",
        lastModifiedAt: now,
      };

      return {
        cases: [...state.cases, newCase],
        activeCase: newCase,
      };
    });
  },

  setActiveCase: (caseId) => {
    set((state) => ({
      activeCase:
        state.cases.find((gridCase) => gridCase.caseId === caseId) ??
        state.activeCase,
    }));
  },

  updateNodeState: (caseId, newState, note, actor) => {
    let updated = false;
    set((state) => {
      const currentCase = state.cases.find((gridCase) => gridCase.caseId === caseId);
      if (
        !currentCase ||
        currentCase.caseStatus !== "ACTIVE" ||
        currentCase.currentNode.currentState === "SIGNAL" ||
        !note.trim()
      ) {
        return state;
      }

      const currentIndex = GRID_STATE_SEQUENCE.indexOf(
        currentCase.currentNode.currentState
      );
      if (GRID_STATE_SEQUENCE[currentIndex + 1] !== newState) {
        return state;
      }

      const now = new Date().toISOString();
      const fromState = currentCase.currentNode.currentState;
      const completedStates = [
        ...currentCase.currentNode.completedStates,
        fromState,
      ];
      const actorType = actor?.actorType ?? "DISPATCHER";
      const actorId = actor?.actorId ?? state.currentOperator;
      let signals = currentCase.signals;
      const continuumEvents = [
        ...currentCase.continuumEvents,
        createEvent(
          currentCase.currentNode.code,
          fromState,
          newState,
          actorType,
          actorId,
          note.trim()
        ),
      ];

      if (newState === "SIGNAL") {
        const signal = createSignalForCase(currentCase);
        signals = [...signals, signal];
        continuumEvents.push(
          createEvent(
            currentCase.currentNode.code,
            "SIGNAL",
            "SIGNAL",
            "AGENT",
            signal.agentId,
            "Recommendation packet created; awaiting human review."
          )
        );
      }

      const updatedCase: GridCase = {
        ...currentCase,
        currentNode: {
          ...currentCase.currentNode,
          currentState: newState,
          stateEnteredAt: now,
          completedStates,
        },
        signals,
        continuumEvents,
        caseStatus: newState === "SFAE" ? "RESOLVED" : currentCase.caseStatus,
        lastModifiedAt: now,
      };
      updated = true;

      return {
        cases: state.cases.map((gridCase) =>
          gridCase.caseId === caseId ? updatedCase : gridCase
        ),
        activeCase:
          state.activeCase?.caseId === caseId ? updatedCase : state.activeCase,
      };
    });
    return updated;
  },

  replayFromStage: (caseId, stage) => {
    let updated = false;
    set((state) => {
      const currentCase = state.cases.find((gridCase) => gridCase.caseId === caseId);
      const stageIndex = GRID_STATE_SEQUENCE.indexOf(stage);
      if (!currentCase || stageIndex < 0 || stageIndex > 6) {
        return state;
      }

      const now = new Date().toISOString();
      const replayedCase: GridCase = {
        ...currentCase,
        currentNode: {
          ...currentCase.currentNode,
          currentState: stage,
          stateEnteredAt: now,
          completedStates: GRID_STATE_SEQUENCE.slice(0, stageIndex),
        },
        signals: currentCase.signals.map((signal) =>
          signal.status === "PENDING_DISPATCHER" || signal.status === "AUTHORIZED"
            ? { ...signal, status: "INVALIDATED" }
            : signal
        ),
        continuumEvents: [
          ...currentCase.continuumEvents,
          createEvent(
            currentCase.currentNode.code,
            currentCase.currentNode.currentState,
            stage,
            "DISPATCHER",
            state.currentOperator,
            `Agent replay initialized from ${stage}; prior Continuum history retained.`
          ),
        ],
        caseStatus: "ACTIVE",
        lastModifiedAt: now,
      };

      if (stage === "SIGNAL") {
        const signal = createSignalForCase(replayedCase);
        replayedCase.signals = [...replayedCase.signals, signal];
        replayedCase.continuumEvents = [
          ...replayedCase.continuumEvents,
          createEvent(
            replayedCase.currentNode.code,
            "SIGNAL",
            "SIGNAL",
            "AGENT",
            signal.agentId,
            "Replay recommendation packet created; awaiting human review."
          ),
        ];
      }

      updated = true;
      return {
        cases: state.cases.map((gridCase) =>
          gridCase.caseId === caseId ? replayedCase : gridCase
        ),
        activeCase:
          state.activeCase?.caseId === caseId ? replayedCase : state.activeCase,
      };
    });
    return updated;
  },

  authorizeSignal: (caseId, signalId, decision, note) => {
    let updated = false;
    set((state) => {
      const currentCase = state.cases.find((gridCase) => gridCase.caseId === caseId);
      const signal = currentCase?.signals.find(
        (gridSignal) => gridSignal.signalId === signalId
      );
      if (
        !currentCase ||
        !signal ||
        signal.status !== "PENDING_DISPATCHER" ||
        currentCase.currentNode.currentState !== "SIGNAL" ||
        !note.trim()
      ) {
        return state;
      }

      if (
        decision === "ACCEPT" &&
        state.cases.filter(
          (gridCase) =>
            gridCase.currentNode.currentState !== "SFAE" &&
            gridCase.signals.some(
              (gridSignal) => gridSignal.status === "AUTHORIZED"
            )
        ).length >= 2
      ) {
        return state;
      }

      const now = new Date().toISOString();
      const accepted = decision === "ACCEPT";
      const decisionFinalized = decision !== "HOLD";
      const decisionEvent = createEvent(
        currentCase.currentNode.code,
        "SIGNAL",
        decisionFinalized ? "AUTHORIZE" : "SIGNAL",
        "DISPATCHER",
        state.currentOperator,
        `${decision}: ${note.trim()}`
      );
      const updatedCase: GridCase = {
        ...currentCase,
        currentNode: decisionFinalized
          ? {
              ...currentCase.currentNode,
              currentState: "AUTHORIZE",
              stateEnteredAt: now,
              completedStates: [
                ...currentCase.currentNode.completedStates,
                "SIGNAL",
              ],
            }
          : currentCase.currentNode,
        signals: currentCase.signals.map((gridSignal) =>
          gridSignal.signalId === signalId
            ? {
                ...gridSignal,
                status:
                  decision === "ACCEPT"
                    ? "AUTHORIZED"
                    : decision === "REJECT"
                      ? "FOLDED"
                      : "PENDING_DISPATCHER",
                authorizedBy: accepted ? state.currentOperator : undefined,
                authorizedAt: accepted ? now : undefined,
                dispatcherNote: note.trim(),
              }
            : gridSignal
        ),
        continuumEvents: [...currentCase.continuumEvents, decisionEvent],
        caseStatus: decisionFinalized ? "ACTIVE" : "HELD",
        lastModifiedAt: now,
      };
      updated = true;

      return {
        cases: state.cases.map((gridCase) =>
          gridCase.caseId === caseId ? updatedCase : gridCase
        ),
        activeCase:
          state.activeCase?.caseId === caseId ? updatedCase : state.activeCase,
      };
    });
    return updated;
  },

  setCurrentOperator: (operatorId) => {
    set({ currentOperator: operatorId });
  },
  }),
  {
    name: "grid-os-workspace-v1",
    storage: createJSONStorage(() =>
      isTemporaryDemoMode() ? temporaryDemoStorage : window.localStorage
    ),
  }
  )
);
