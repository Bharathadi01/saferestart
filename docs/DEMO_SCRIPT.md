# SafeRestart — 3-Minute Video Demonstration Script (180s)

> **Target Duration**: Exactly 180 seconds (3:00)  
> **Platform**: YouTube Submission for WeMakeDevs × AWS Environmental Hacks  
> **Presenter Tone**: Crisp, professional, technical, clear.

---

### [0:00 - 0:20] The Real-World Problem
**Visual**: Close-up of water network problem slide or initial Command Center banner.  
**Narration**:  
> "Worldwide, over one billion people rely on intermittent drinking-water networks. When supply is shut off and pipes depressurize, groundwater and contaminants aspirate into distribution mains. When water returns, utility operators face a critical question: *Is it safe to recharge?* Today, decisions rely on fragmented phone calls, paper checklists, and uncoordinated tests. SafeRestart is built to solve this operational bottleneck."

---

### [0:20 - 0:45] Introducing SafeRestart & Operations Command Center
**Visual**: Screen recording on `http://localhost:3000`. Cursor highlights the persistent `DEMO MODE — SIMULATED NETWORK DATA` banner, then pans across the 6 metric cards and the 5-zone distribution matrix.  
**Narration**:  
> "Meet SafeRestart: a field-first decision-support platform for municipal water operators. On our Operations Command Center, operators monitor district metered areas in real time. We see five simulated zones, tracked for pressure, bulk demand flow, and disinfectant residual. Crucially, all telemetry is clearly flagged as simulated for demonstration."

---

### [0:45 - 1:30] Interruption & Deterministic Risk Engine HOLD
**Visual**:  
1. Click **`Cut Supply`** on **Zone 5 (Eastern Green Foothills)**. Pressure drops to 3.8 psi, flow drops, and state switches to `Interrupted Supply`.  
2. Click **`Assess Restart`**. State updates to `RESTART HOLD`.  
3. Click **`Inspect`** to open the Zone Detail page (`/zones/zone-5`).  
4. Show the React Flow network topology graph (inlet valve shows CLOSED, junctions show HOLD).  
5. Highlight the Risk Engine Evaluation Card (Action: HOLD, Score: 75/100, missing chlorine residual flagged). Click **`Synthesize Directives`**.  
**Narration**:  
> "Let's simulate a sudden main interruption on Zone 5. Instantly, pressure falls below our critical 15-psi threshold. The operator initiates a restart assessment. Immediately, our deterministic risk engine enforces an operational HOLD. Why? Because the pressure dropped into negative aspiration territory, and disinfectant residual is completely unverified. Our rules engine refuses to greenlight recharge on missing data."

---

### [1:30 - 2:05] Mobile Field Worker Mode & Verification Protection
**Visual**:  
1. Navigate to **`Field Worker Mode`** (`/field`). Select Zone 5.  
2. Click **`Preset: Failing (0.06 mg/L)`** and click **`Submit Evidence`**. Show the red error banner enforcing continued HOLD.  
3. Click **`Preset: Passing (0.45 mg/L)`** with 15-minute flush confirmed and photo proof attached. Click **`Submit Evidence`**. Show the green banner: `VERIFICATION PASSED — MOVED TO SUPERVISOR APPROVAL`.  
**Narration**:  
> "Next, our mobile-optimized field technician interface coordinates on-the-ground validation. If a technician submits an inadequate chlorine reading—say 0.06 milligrams per liter—the system blocks the workflow and maintains the HOLD. When the technician completes authorized hydrant scour flushing and logs a verified residual of 0.45 milligrams per liter, the gate advances the request to Awaiting Supervisor Approval."

---

### [2:05 - 2:30] Supervisor Authorization & Immutable Audit Trail
**Visual**:  
1. Navigate to **`Supervisor Review`** (`/supervisor`).  
2. Select Zone 5. Show that all criteria (chlorine, pressure, flushing) are verified green and the approval gate is unlocked.  
3. Check the compliance confirmation box and click **`Authorize Service Restoration`**. Zone 5 becomes `Service Restored`.  
4. Navigate to **`Audit Trail`** (`/audit`). Show the complete chronological event stream and click **`Export Audit CSV`**.  
**Narration**:  
> "At the Supervisor Review gate, release is locked until all mandatory evidence passes. As Chief Engineer, I review the verified measurements, confirm the statutory compliance checklist, and authorize service restoration. Zone 5 is safely recharged to 36 psi. Finally, every single action, measurement, and transition is committed to an immutable regulatory audit ledger, ready for CSV export."

---

### [2:30 - 2:50] Technical Architecture & AWS Readiness
**Visual**: Display Mermaid architecture diagram from `docs/ARCHITECTURE.md` or glance at `template.yaml`.  
**Narration**:  
> "Architecturally, SafeRestart is built on Next.js 15, TypeScript strict mode, React Flow, and Recharts. All business logic is strictly decoupled behind an `ISafeRestartAdapter` contract. We developed and tested Phase 2 locally with zero cloud dependencies, backed by a complete AWS SAM specification defining Amazon DynamoDB tables, an EventBridge event bus, and encrypted S3 evidence storage for production."

---

### [2:50 - 3:00] Impact, Safety Guardrails & Conclusion
**Visual**: Return to the Command Center overview. Click **`Reset`** to show deterministic repeatability.  
**Narration**:  
> "SafeRestart does not claim to replace certified laboratory bacteriological testing—it provides the rigorous, auditable operational decision support utilities need to protect public health. Thank you."

---

## Recording Checklist & Fallback Strategy

### Assets to Capture:
- [ ] 1080p full-screen browser capture at 60fps (Dark Navy theme, 100% zoom).
- [ ] Mobile viewport capture of `/field` (e.g., iPhone 15 Pro resolution 393×852).
- [ ] Clean microphone voiceover with crisp audio.

### Demonstration Fallback:
If browser caching or network delays occur during live recording:
1. Click the top-bar **`Reset`** button to return all 5 zones to the baseline instantly.
2. If recording is interrupted, run `npm run dev` to restart the Next.js server; in-memory data deterministically initializes with Zone 1 on HOLD and Zone 4 ready for supervisor sign-off.
