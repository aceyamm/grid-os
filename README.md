# Grid OS — Energy & Substation Dispatch Terminal

**Code:** `GOS`  
**Category:** Energy & Grid  
**Purpose:** Give grid operators a governed workspace to assess faults, capacity, islanding readiness, restoration plans, and reserves—before a qualified human makes a decision.

> **Grid OS monitors, evaluates, and recommends. It does not operate grid equipment.**

## 01 / Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation & Development

```bash
npm install
npm run dev
```

The application will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 02 / Core Architecture

Grid OS implements a **deterministic 9-stage workflow** that guides operators through grid assessment and authorization:

```
SCAN → FAULT → LOAD_CAP → ISLAND → SEQUENCE → RESERVE
     → SIGNAL → AUTHORIZE → SFAE
```

| Stage | Purpose |
|---|---|
| **SCAN** | Collect current operating picture and telemetry |
| **FAULT** | Identify and document faults and affected assets |
| **LOAD_CAP** | Assess load against equipment and system limits |
| **ISLAND** | Evaluate islanding boundaries and dependencies |
| **SEQUENCE** | Review proposed restoration or switching plans |
| **RESERVE** | Assess available reserve and uncertainty margins |
| **SIGNAL** | Present agent recommendation with evidence and constraints |
| **AUTHORIZE** | Require authorized human decision (ACCEPT/REJECT/HOLD) |
| **SFAE** | Finalize record and capture after-action evaluation |

### Process Rules

- Stages advance in order only when required evidence and checks are complete
- Missing, stale, or unverified inputs block progression or trigger a documented hold
- Material changes to inputs invalidate downstream assessments
- Recommendations are separate from execution; authorization records a decision, not a command
- Every transition records evidence, actor, timestamp, and audit trail

## 03 / Project Structure

```
src/
├── types/           # TypeScript definitions (grid-os.ts)
├── components/      # React components (StateTrack, NodeTelemetry, GridHeader)
├── pages/          # Page components (OverviewPage)
├── store/          # Zustand state management (gridStore.ts)
├── data/           # Demo data and constants (demo.ts)
├── styles/         # Global styles (globals.css)
├── App.tsx         # Main app component
└── index.tsx       # Entry point

public/
├── index.html      # HTML template

vite.config.ts      # Vite bundler configuration
tailwind.config.ts  # Tailwind CSS configuration
tsconfig.json       # TypeScript configuration
```

## 04 / Design System

**Color Palette** (Kurogami Terminal Aesthetic)
- **Page Background:** `#050B0A` (ink)
- **Card & Panels:** `#091310` (dark green-black)
- **Borders:** `#20312B`
- **Primary Text:** `#E8E9E3` (cream)
- **Secondary Text:** `#89938E` (muted gray-green)
- **Accent:** `#C4A664` (restrained gold)
- **Status Colors:** Emerald (nominal), Amber (warning), Crimson (critical)

**Typography**
- **Headings:** Arial/Helvetica, tight tracking, restrained weight
- **Body:** Sans-serif, generous line height
- **Telemetry & Labels:** Monospace

## 05 / Key Components

### StateTrack
Displays the nine-stage deterministic workflow with current progress and human gate indication.

### NodeTelemetry
Shows current grid node status including frequency, capacity utilization, spinning reserves, and active diagnostic logs.

### GridHeader
Top navigation bar with system status, operator info, UTC time, grid frequency, and VEIL switching limits.

## 06 / State Management

Grid OS uses **Zustand** for central state management with actions for:
- Case creation and navigation
- Node state transitions with audit trail
- Signal generation and authorization
- Operator management

## 07 / Features (MVP)

✅ Deterministic 9-stage workflow enforcement  
✅ Grid node telemetry and capacity monitoring  
✅ Manual state progression with verification notes  
✅ Immutable continuum audit trail  
✅ Demo seeded utility scenario (`?demo=true`)  
✅ Kurogami terminal aesthetic  
✅ Type-safe TypeScript codebase  
✅ Responsive Tailwind CSS layout  

🚀 Planned Features
- Fault desk and incident intake
- Capacity & reserve assessment views
- FieldForge telemetry integration
- Decision queue and authorization gate
- 1,000-iteration stability simulation
- BriefOS report generation
- JSON continuum export

## 08 / Running Tests

```bash
npm run type-check    # TypeScript type checking
npm run lint          # Lint code (ESLint configured)
```

## 09 / Deployment

Build the production bundle:
```bash
npm run build
```

Deploy the `dist/` directory to any static hosting service (Vercel, Netlify, AWS S3, etc.).

## 10 / Documentation

For detailed specification, see the full build documentation:
- **Build Specification:** Master build document with requirements, UI layouts, and functional specifications
- **User Roles:** Grid operator, control-room supervisor, field operator, engineering reviewer, auditor, admin
- **Delivery Phases:** Phase 1 (Governed review terminal), Phase 2 (Integrations & simulation), Phase 3 (Institutional deployment)

## License

MIT © Kurogami Group
