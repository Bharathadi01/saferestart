# SafeRestart UI Walkthrough Screenshots

This directory stores authentic, pixel-perfect application screenshots of the live running SafeRestart interface captured via automated headless browser verification.

## Captured Interface Figures

1. **`01-command-center.png`**:
   - **Route**: `/`
   - **Description**: Operations Command Center showing real-time municipal distribution zone status across 5 District Metered Areas, aggregate pressure metrics, active restart holds, and simulation controls.
2. **`02-zone-topology.png`**:
   - **Route**: `/zones/zone-1`
   - **Description**: Interactive hydraulic topology network graph built with React Flow (`@xyflow/react`), rendering reservoirs, PRV valves, junctions, pipe age, and terminal sampling hydrants with live inspection sidebar.
3. **`03-risk-engine-panel.png`**:
   - **Route**: `/events/EVT-2026-001`
   - **Description**: Deterministic risk engine score card and physical breakdown (interruption duration, minimum pressure, unverified residual) with Amazon Bedrock operator advisory synthesis.
4. **`04-field-worker-interface.png`**:
   - **Route**: `/field`
   - **Description**: Desktop view of the mobile-first Field Worker Mode featuring step-by-step physical verification checklists (DPD chlorine, pressure, scouring flush duration, photo proof) and evaluator quick presets.
5. **`05-supervisor-authorization-gate.png`**:
   - **Route**: `/supervisor`
   - **Description**: Supervisor Authorization Gate displaying gated sign-off controls, compliance verification checkboxes, and the hard-locked restoration authorization barrier.
6. **`06-audit-trail-ledger.png`**:
   - **Route**: `/audit`
   - **Description**: Chronological, immutable regulatory audit trail ledger with actor attribution, previous and new state tracking, event filters, and one-click CSV compliance export.
7. **`07-mobile-field-worker.png`**:
   - **Route**: `/field` (Mobile Viewport: 412×915)
   - **Description**: Responsive mobile view of the technician field checklist optimized for handheld operation in pump vaults and valve chambers.

> **Mirroring Note**: Identical asset copies are maintained in `docs/assets/screenshots/` to support redundant markdown path resolution across GitHub viewports.
