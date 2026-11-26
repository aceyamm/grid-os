/**
 * Grid OS Main Application Component
 */

import React from "react";
import { useState } from "react";
import { GridBriefModal } from "./components/GridBriefModal";
import { GridGuideModal } from "./components/GridGuideModal";
import { LandingPage } from "./pages/LandingPage";
import { OverviewPage } from "./pages/OverviewPage";
import "./styles/globals.css";

function App() {
  const [entered, setEntered] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);

  const enterTerminal = () => {
    setGuideOpen(false);
    setEntered(true);
  };

  return (
    <>
      {entered ? (
        <OverviewPage onOpenGuide={() => setGuideOpen(true)} />
      ) : (
        <LandingPage
          onEnter={enterTerminal}
          onOpenGuide={() => setGuideOpen(true)}
          onViewBrief={() => setBriefOpen(true)}
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
