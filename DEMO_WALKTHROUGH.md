# SafeRestart — End-to-End Demonstration Walkthrough Script

This script walks through the complete operational lifecycle in **under 3 minutes**, using the interactive SafeRestart web interface.

---

### Step 1: Start at the Operations Command Center (`/`)
1. Open [http://localhost:3000](http://localhost:3000).
2. Note the prominent header banner: **`DEMO MODE — SIMULATED NETWORK DATA`**.
3. Locate **Zone 5 (Eastern Green Foothills)** in the matrix table:
   - State: **`Normal Supply`** (Green badge)
   - Pressure: **~38.0 psi** (Nominal)
   - Flow: **~30.0 L/s**
   - Free Chlorine: **0.65 mg/L**

---

### Step 2: Trigger Supply Interruption
1. In the Zone 5 row, click the red button: **`Cut Supply`** (or click **`Simulate Cut`** in the top navigation).
2. **Observe Instant Real-Time Reaction**:
   - Zone 5 state immediately flips to **`Interrupted Supply`** (Amber badge).
   - Pressure falls rapidly to **3.8 psi** (Critical low pressure warning).
   - Flow drops to **0.5 L/s**.
   - Chlorine reading disappears (**`MEASUREMENT MISSING`** badge).
   - An active restart event is assigned: `EVT-2026-XXXX`.
   - The button flips to **`Assess Restart`**.
   - A new transition audit entry appears at the bottom of the screen: `TRANSITION_NORMAL_TO_INTERRUPTED`.

---

### Step 3: Request Restart & Evaluate Risk
1. In the Zone 5 row, click **`Assess Restart`**.
2. **Observe Automated Risk Engine Evaluation**:
   - The state transitions: `INTERRUPTED` $\rightarrow$ `RESTART_REQUESTED` $\rightarrow$ `ASSESSMENT_REQUIRED` $\rightarrow$ **`RESTART HOLD`** (Red pulsating badge).
   - Click **`Inspect`** to open [`/zones/zone-5`](http://localhost:3000/zones/zone-5).
   - View the **Network Topology Graph**: Isolation valve `Z5-VLV-01` displays `CLOSED` and junction nodes display depressurized `HOLD`.
   - View the **Risk Engine Evaluation Panel**:
     - Action: **`ACTION: HOLD`**
     - Risk Score: **~75/100**
     - Primary contributors highlighted:
       - `[HIGH] Interruption duration & depressurization hazard`
       - `[HIGH] No chlorine residual measurement recorded`
     - Critical missing evidence callout: `free chlorine residual measurement`, `fresh scada telemetry`.
   - Click **`Explain Decision with AI`** to generate an automated operator synthesis.

---

### Step 4: Dispatch Field Worker Verification (`/field`)
1. In the top navigation, click **`Field Worker Mode`**.
2. Select **`Eastern Green Foothills (ZONE-EAST)`** from the sector dropdown.
3. Observe the generated tasks:
   - Task 1: *Execute authorized scour flushing in Eastern Green Foothills* (`PENDING`)
   - Task 2: *Measure free chlorine residual at terminal hydrant* (`PENDING`)
4. **Demonstrate Failed Verification Protection (Judge Scenario A)**:
   - Click **`Preset: Failing (0.06 mg/L)`**.
   - Note the values: Free Chlorine = `0.06 mg/L` (Below $0.20\text{ mg/L}$ floor), Pressure = `18.0 psi`.
   - Click **`Submit Evidence for Supervisor Review`**.
   - **Observe Guardrail**: The system rejects the release:
     `VERIFICATION FAILED — OPERATIONAL HOLD ENFORCED: Free chlorine residual (0.06 mg/L) below minimum demonstration safety floor (0.20 mg/L).`
     The event remains on `HOLD`.
5. **Submit Passing Verification (Judge Scenario B)**:
   - Click **`Preset: Passing (0.45 mg/L)`**.
   - Note the compliant values: Free Chlorine = `0.45 mg/L`, Pressure = `30.0 psi`, Flushing = `15 min`, Joint secured = `true`.
   - Click **`Submit Evidence for Supervisor Review`**.
   - **Observe Transition**:
     `VERIFICATION PASSED — MOVED TO SUPERVISOR APPROVAL.`
     Event advances to `AWAITING_APPROVAL`.

---

### Step 5: Supervisor Authorization & Service Release (`/supervisor`)
1. In the top navigation, click **`Supervisor Review`**.
2. Select the restart request for Eastern Green Foothills.
3. **Observe the Gated Protection**:
   - The checklist shows: Free Chlorine: **0.45 mg/L (PASS)**, Pressure: **30.0 psi (PASS)**, Flushing: **VERIFIED**.
   - The banner announces: **`APPROVAL GATE UNLOCKED: ALL STATUTORY CRITERIA SATISFIED`**.
4. Check the compliance confirmation box:
   *`I hereby certify that all field telemetry, disinfection records, and scouring protocols were reviewed...`*
5. Click the green button: **`Authorize Service Restoration`**.
6. **Observe Service Restoration**:
   - Zone operational state transitions to **`Service Restored`** (Emerald badge).
   - Pressure recovers to **36.0 psi** nominal supply.
   - Network graph valves open and topology returns to `NORMAL`.

---

### Step 6: Verify the Regulatory Audit Trail (`/audit`)
1. Click **`Audit Trail`** in the navigation bar.
2. Observe the complete chronological event stream:
   - `TRANSITION_NORMAL_TO_INTERRUPTED` (SCADA Telemetry Engine)
   - `TRANSITION_INTERRUPTED_TO_RESTART_REQUESTED` (Operator J. Vance)
   - `TRANSITION_RESTART_REQUESTED_TO_HOLD` (Risk Engine)
   - `VERIFICATION_FAILED_HOLD` (Field Technician A. Rivera - failing test recorded)
   - `TRANSITION_HOLD_TO_AWAITING_APPROVAL` (Field Technician A. Rivera - passing test recorded)
   - `TRANSITION_AWAITING_APPROVAL_TO_RESTORED` (Chief Engineer Helena Miller, P.E.)
3. Click **`Export Audit CSV`** to download the regulatory compliance file.

---

### Step 7: Reset Scenario
1. Click the **`Reset`** button in the top navigation bar.
2. The entire network deterministically returns to the initial state, ready for another demonstration.
