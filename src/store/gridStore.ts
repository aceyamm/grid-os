/**
 * Grid OS Zustand Store
 * Central state management for grid dispatch cases and operations
 */

import { create } from "zustand";
import { GridCase, MonitoredGridNode, GridSignal, GridState } from "../types/grid-os";
import { v4 as uuidv4 } from "uuid";

interface GridOSStore {
  cases: GridCase[];
  activeCase: GridCase | null;
  currentOperator: string;

  // Case management
  createCase: (
    operatingArea: string,
    caseType: "LIVE" | "SIMULATION" | "DRILL",
    node: MonitoredGridNode
  ) => void;
  setActiveCase: (caseId: string) => void;
  updateNodeState: (caseId: string, newState: GridState, note: string) => void;

  // Signal management
  createSignal: (
    caseId: string,
    nodeId: string,
    actionType: GridSignal["actionType"]
  ) => void;
  authorizeSignal: (
    caseId: string,
    signalId: string,
    decision: "ACCEPT" | "REJECT" | "HOLD",
    note: string
  ) => void;

  // Operator management
  setCurrentOperator: (operatorId: string) => void;
}

export const useGridOSStore = create<GridOSStore>((set) => ({
  cases: [],
  activeCase: null,
  currentOperator: "OP-001",

  createCase: (operatingArea, caseType, node) => {
    set((state) => {
      const newCase: GridCase = {
        caseId: `CASE-${uuidv4()}`,
        createdAt: new Date().toISOString(),
        createdBy: state.currentOperator,
        operatingArea,
        caseType,
        currentNode: node,
        relatedNodes: [],
        signals: [],
        continuumEvents: [
          {
            eventId: uuidv4(),
            timestamp: new Date().toISOString(),
            nodeCode: node.code,
            fromState: null,
            toState: "SCAN",
            actorType: "DISPATCHER",
            actorId: state.currentOperator,
            evidenceNote: "Case created",
            linkedLogIds: [],
            veilOpenCount: 0,
            veilLimit: 2,
            processCompliant: true,
          },
        ],
        caseStatus: "ACTIVE",
        lastModifiedAt: new Date().toISOString(),
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
        state.cases.find((c) => c.caseId === caseId) || state.activeCase,
    }));
  },

  updateNodeState: (caseId, newState, note) => {
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.caseId === caseId) {
          const oldState = c.currentNode.currentState;
          return {
            ...c,
            currentNode: {
              ...c.currentNode,
              currentState: newState,
              stateEnteredAt: new Date().toISOString(),
              completedStates: [...c.currentNode.completedStates, oldState],
            },
            continuumEvents: [
              ...c.continuumEvents,
              {
                eventId: uuidv4(),
                timestamp: new Date().toISOString(),
                nodeCode: c.currentNode.code,
                fromState: oldState,
                toState: newState,
                actorType: "DISPATCHER",
                actorId: state.currentOperator,
                evidenceNote: note,
                linkedLogIds: [],
                veilOpenCount: 0,
                veilLimit: 2,
                processCompliant: true,
              },
            ],
            lastModifiedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
      activeCase:
        state.activeCase?.caseId === caseId
          ? {
              ...state.activeCase,
              currentNode: {
                ...state.activeCase.currentNode,
                currentState: newState,
              },
            }
          : state.activeCase,
    }));
  },

  createSignal: (caseId, nodeId, actionType) => {
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.caseId === caseId) {
          const newSignal: GridSignal = {
            signalId: `SIG-${uuidv4()}`,
            nodeId,
            generatedAt: new Date().toISOString(),
            agentId: "AGENT-GRID-01",
            actionType,
            summary: `Recommended ${actionType.replace(/_/g, " ")}`,
            rationale: "Grid stability assessment indicates this action",
            triggeringLogIds: c.currentNode.activeSymptomLogs.map(
              (l) => l.logId
            ),
            projectedFrequencyHz: 59.95,
            loadDeltaMw: -150,
            invalidationCondition:
              "Void if bus voltage drops below 0.92 pu or spinning reserve < 45 MW",
            status: "PENDING_DISPATCHER",
          };
          return {
            ...c,
            signals: [...c.signals, newSignal],
          };
        }
        return c;
      }),
    }));
  },

  authorizeSignal: (caseId, signalId, decision, note) => {
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.caseId === caseId) {
          return {
            ...c,
            signals: c.signals.map((s) => {
              if (s.signalId === signalId) {
                return {
                  ...s,
                  status:
                    decision === "ACCEPT"
                      ? "AUTHORIZED"
                      : decision === "REJECT"
                        ? "FOLDED"
                        : "PENDING_DISPATCHER",
                  authorizedBy:
                    decision === "ACCEPT"
                      ? state.currentOperator
                      : undefined,
                  authorizedAt:
                    decision === "ACCEPT"
                      ? new Date().toISOString()
                      : undefined,
                  dispatcherNote: note,
                };
              }
              return s;
            }),
          };
        }
        return c;
      }),
    }));
  },

  setCurrentOperator: (operatorId) => {
    set({ currentOperator: operatorId });
  },
}));
