/**
 * Grid OS Main Application Component
 */

import React from "react";
import { useState } from "react";
import { GridBriefModal } from "./components/GridBriefModal";
import { GridGuideModal } from "./components/GridGuideModal";
import { LandingPage } from "./pages/LandingPage";
import { OverviewPage } from "./pages/OverviewPage";
import {
  GRID_OS_SESSION_MODE_KEY,
  GRID_OS_STORAGE_KEY,
} from "./store/gridStore";
import "./styles/globals.css";

function App() {
  const query = new URLSearchParams(window.location.search);
  const directEntry = query.get("enter") === "true";
  const tourEntry = query.has("tour");
  const [entered, setEntered] = useState(directEntry);
  const [guideOpen, setGuideOpen] = useState(directEntry && !tourEntry);
  const [briefOpen, setBriefOpen] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const sessionMode = query.get("demo") === "true"
    ? "demo"
    : query.get("fresh") === "true"
      ? "fresh"
      : "saved";

  const navigateToLanding = (search = "") => {
    window.location.assign(
      `${window.location.pathname}${search ? `?${search}` : ""}`
    );
  };

  const enterTerminal = () => {
    setEntered(true);
    setGuideOpen(true);
  };

  const returnToSavedSession = () => {
    try {
      const freshWorkspace =
        window.localStorage.getItem(GRID_OS_SESSION_MODE_KEY) === "fresh";
      navigateToLanding(freshWorkspace ? "fresh=true" : "");
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? `Could not read the saved workspace: ${error.message}`
          : "Could not read the saved workspace from this browser."
      );
    }
  };

  const startFreshWorkspace = () => {
    try {
      window.localStorage.setItem(GRID_OS_SESSION_MODE_KEY, "fresh");
      window.localStorage.removeItem(GRID_OS_STORAGE_KEY);
      navigateToLanding("fresh=true");
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? `Could not replace the saved workspace: ${error.message}`
          : "Could not replace the saved workspace in this browser."
      );
    }
  };

  return (
    <>
      {entered ? (
        <OverviewPage
          onOpenGuide={() => setGuideOpen(true)}
          onSwitchWorkspace={() => {
            const landingQuery = new URLSearchParams(window.location.search);
            landingQuery.delete("enter");
            landingQuery.delete("tour");
            navigateToLanding(landingQuery.toString());
          }}
        />
      ) : (
        <LandingPage
          onEnter={enterTerminal}
          onViewBrief={() => setBriefOpen(true)}
          onLoadDemo={() => navigateToLanding("demo=true")}
          onReturnToSaved={returnToSavedSession}
          onStartFresh={startFreshWorkspace}
          sessionMode={sessionMode}
          sessionError={sessionError}
        />
      )}
      <GridGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onEnter={entered ? undefined : enterTerminal}
      />
      <GridBriefModal
        isOpen={briefOpen}
        onClose={() => setBriefOpen(false)}
      />
    </>
  );
}

export default App;
