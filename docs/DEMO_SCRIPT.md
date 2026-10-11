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

### [0:40 - 1:05] Interruption & Deterministic Risk Engine HOLD
**Visual**:  
1. Click **`Cut Supply`** on **Zone 5 (Eastern Green Foothills)**. Pressure drops below 15 psi, flow drops to zero, and state switches to `Interrupted Supply`.  
2. Click **`Assess Restart`**. State updates to `RESTART HOLD`.  
3. Click **`Inspect`** to open the Zone Detail page (`/zones/zone-5`).  
4. Show the React Flow network topology graph (inlet valve shows CLOSED, junctions show HOLD).  
5. Highlight the Risk Engine Evaluation Card (Action: HOLD, Score: 75/100, missing chlorine residual flagged). Click **`Synthesize Directives`** to show the Copilot explanation card with its attribution badge.  
**Narration**:  
> "Let's simulate a sudden main interruption on Zone 5. Instantly, pressure collapses below our 15-psi threshold. The operator initiates a restart assessment. Immediately, our deterministic risk engine enforces an operational HOLD. Why? Because the pressure dropped into negative aspiration territory and residual chlorine is unverified. Our rules engine refuses to greenlight recharge on missing data."

---

### [1:05 - 1:30] SafeRestart Evidence Copilot (AI Structuring & Explanation)
**Visual**:  
1. In the Command Center, scroll to the **`Evidence Copilot — Field Note Structuring`** widget.  
2. Click the preset: **`Zone 2 Suspected Leak & Missing Residual`**.  
3. Click **`Structure Field Report with AI`**.  
4. Highlight the structured draft output:  
   - Extracted Zone 2 matched to schema.  
   - Suspected fault preserved with uncertainty (`SUSPECTED` leak near valve V-04).  
   - Missing info flagged: free chlorine reading absent.  
   - Prominent attribution badge: `Local explanation — Amazon Bedrock was not called` (or active Bedrock model ID).  
**Narration**:  
> "To assist operators with messy field communications, our Evidence Copilot converts unstructured briefings into structured drafts. It preserves critical uncertainty—flagging a reported leak as 'SUSPECTED' rather than confirmed, and noting that missing chlorine is unknown, not zero. Crucially, the AI is strictly advisory: it cannot authorize service restoration."

---

### [1:30 - 1:55] Mobile Field Worker Mode & Verification Protection
**Visual**:  
1. Navigate to **`Field Worker Mode`** (`/field`). Select Zone 5.  
2. Click **`Preset: Failing (0.06 mg/L)`** and click **`Submit Evidence`**. Show the red error banner enforcing continued HOLD.  
3. Click **`Preset: Passing (0.45 mg/L)`** with 15-minute flush confirmed and photo proof attached. Click **`Submit Evidence`**. Show the green banner: `VERIFICATION PASSED — MOVED TO SUPERVISOR APPROVAL`.  
**Narration**:  
> "Next, our mobile-optimized field technician interface coordinates on-the-ground validation. If a technician submits an inadequate chlorine reading—say 0.06 milligrams per liter—the system blocks the workflow and maintains the HOLD. When the technician completes authorized hydrant scour flushing and logs a verified residual of 0.45 milligrams per liter, the gate advances the request to Awaiting Supervisor Approval."

---

### [1:55 - 2:20] Supervisor Authorization & Immutable Audit Trail
**Visual**:  
1. Navigate to **`Supervisor Review`** (`/supervisor`).  
2. Select Zone 5. Show that all criteria (chlorine, pressure, flushing) are verified green and the approval gate is unlocked.  
3. Check the compliance confirmation box and click **`Authorize Service Restoration`**. Zone 5 becomes `Service Restored` at nominal 36 psi.  
4. Navigate to **`Audit Trail`** (`/audit`). Show the newly committed chronological transition record and click **`Export Audit CSV`**.  
**Narration**:  
> "At the Supervisor Review gate, release is locked until all mandatory evidence passes. As Chief Engineer, I review the verified measurements, confirm the statutory compliance checklist, and authorize service restoration. Zone 5 is safely recharged. Finally, every single action, measurement, and transition is committed to an immutable regulatory audit ledger, ready for CSV export."

---

### [2:20 - 2:45] Technical Architecture & AWS Readiness
**Visual**: Display Mermaid architecture diagram from `docs/ARCHITECTURE.md` or show `template.yaml`.  
**Narration**:  
> "Architecturally, SafeRestart is built on Next.js 15, TypeScript strict mode, React Flow, and Recharts. All business logic is decoupled behind an `ISafeRestartAdapter` contract. We developed and tested the product with zero cloud dependencies, backed by a production-ready AWS SAM template defining Amazon DynamoDB, EventBridge, Lambda handlers, and Bedrock integration."

---

### [2:50 - 3:00] Impact, Safety Guardrails & Conclusion
**Visual**: Return to the Command Center overview. Click **`Reset`** to show deterministic repeatability.  
**Narration**:  
> "SafeRestart does not claim to replace certified laboratory bacteriological testing—it provides the rigorous, auditable operational decision support utilities need to protect public health. Thank you."

---

## Recording Checklist & Fallback Strategy

### Assets to Capture:
- [ ] 1080p full-screen browser capture at 60fps (Civic light high-contrast theme, 100% zoom).
- [ ] Mobile viewport capture of `/field` (e.g., iPhone 15 Pro resolution 393×852).
- [ ] Clean microphone voiceover with crisp audio.

### Demonstration Fallback:
If browser caching or network delays occur during live recording:
1. Click the top-bar **`Reset`** button to return all 5 zones to the baseline instantly.
2. If recording is interrupted, run `npm run dev` to restart the Next.js server; in-memory data deterministically initializes with Zone 1 on HOLD and Zone 4 ready for supervisor sign-off.
