# SafeRestart

> **Field-First Decision-Support System for Restarting Intermittently Supplied Drinking-Water Distribution Networks**  
> *Built for the AWS Environmental Hacks Hackathon*

---

### ⚠️ IMPORTANT SAFETY & REGULATORY LIMITATION
**SafeRestart is an operational decision-support prototype for research, demonstration, and evaluation.** It does **not** certify drinking-water microbiological safety and does not replace statutory municipal water utility operating procedures. All telemetry, network models, and risk scores are simulated demonstration parameters. Final service restoration requires physical testing, certified field validation, and authorized engineering personnel.

---

## 1. Product Vision & Problem

When an **intermittent water-supply (IWS)** distribution zone experiences a prolonged interruption, pressure falls to atmospheric or sub-atmospheric levels. Depressurization dramatically increases vulnerability:
- **Back-siphonage and ingress**: Surrounding groundwater and contaminated soil can be aspirated into porous or cracked pipes through unsealed joints.
- **Biofilm detachment & tuberculation**: Hydraulic transients slough stagnant biofilm from inner pipe walls upon recharge.
- **Disinfection depletion**: Stagnant water consumes free chlorine residual over time.

Existing water sensors, SCADA systems, hydraulic models, and contamination-prediction research already exist. SafeRestart does not claim to invent these technologies. 

**Our differentiation is the structured operational workflow:**
```
INTERRUPTION ➔ ASSESSMENT ➔ HOLD/PROCEED ➔ FIELD VERIFICATION ➔ SUPERVISOR APPROVAL ➔ RESTORATION ➔ IMMUTABLE AUDIT
```

SafeRestart answers the 6 critical operational questions:
1. **What happened to this water-supply zone?** (Interruption duration, minimum observed pressure, depressurization extent)
2. **What evidence is available?** (SCADA pressure curves, bulk flow, last verified chlorine residual)
3. **What risk factors or missing information require attention?** (Aged unlined mains, unisolated collar cracks, stale telemetry)
4. **What should the field worker do next?** (Mobile-optimized directives: scour flushing, leak repair inspection, terminal chlorine sampling)
5. **Have the configured verification requirements been satisfied?** (Chlorine $\ge 0.20\text{ mg/L}$, pressure $\ge 20\text{ psi}$, flushing verified)
6. **Who authorized the restoration, and what evidence supports that decision?** (Attributable supervisor sign-off, immutable audit trail)

---

## 2. Technology Stack

- **Frontend**: Next.js 15 / 16 (App Router), TypeScript (strict mode), Tailwind CSS, Lucide Icons, Recharts (hydraulic time series), React Flow (`@xyflow/react` for interactive water-network topology).
- **Backend / Serverless**: Next.js App Router API Routes, AWS Lambda handlers, Amazon API Gateway HTTP API.
- **Persistence**: Dual-mode data adapter:
  - Local in-memory deterministic simulation store for zero-friction local execution.
  - Amazon DynamoDB (Pay-Per-Request, Point-in-Time Recovery, SSE) for production deployment.
- **Event Orchestration**: Amazon EventBridge custom event bus for asynchronous interruption and lifecycle events.
- **Field Evidence Storage**: Amazon S3 (Server-Side Encryption, Block Public Access) for photo verification.
- **Intelligence**: Amazon Bedrock (`anthropic.claude-3-sonnet`) with local deterministic engineering heuristics fallback.

---

## 3. System Architecture

```
[ Water Network / SCADA Telemetry Stream ]
                     │
                     ▼
       ┌─────────────────────────────┐
       │   Amazon API Gateway / Next  │
       └──────────────┬──────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐             ┌──────────────┐
│  Risk Engine │             │State Machine │
│(Deterministic│             │(Validated    │
│  Heuristics) │             │ Transitions) │
└───────┬──────┘             └──────┬───────┘
        │                           │
        ▼                           ▼
┌───────────────────────────────────────────┐
│       Amazon DynamoDB / Store Adapter     │
│  - Zones & Nodes Topology                 │
│  - Restart Events & Field Tasks           │
│  - Immutable Regulatory Audit Trail       │
└─────────────────────┬─────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐             ┌──────────────┐
│Amazon Bedrock│             │  Amazon S3   │
│(Synthesized  │             │(Photo Proof  │
│ Directives)  │             │   Evidence)  │
└──────────────┘             └──────────────┘
```

---

## 4. Key Screens & Capabilities

1. **Operations Command Center (`/`)**: Executive statistics across all 5 zones (Total Zones, Restart Holds, Pending Checks, Approvals). Matrix table featuring current pressure, flow, chlorine status, and evidence completeness bars. Quick simulation controls (Trigger Interruption, Advance +1h, Reset Scenario).
2. **Zone Detail View (`/zones/[id]`)**: Interactive React Flow water topology map displaying reservoirs, PRV valves, junctions, pipes, and terminal hydrants with node inspection drawers. Pressure dynamics and chlorine history charts using Recharts. Active leak incident alerts.
3. **Deterministic Risk Engine (`RiskPanel`)**: Returns structured severity, physical explanation, and missing evidence lists. Evaluates duration, negative pressure ingress, and active leaks.
4. **Mobile-First Field Worker Mode (`/field`)**: Step-by-step field technician checklist (leak repair verification, hydrant scouring flush, DPD colorimeter chlorine entry, turbidity, pressure). Quick scenario presets for judges.
5. **Supervisor Review & Authorization Gate (`/supervisor`)**: Strict gating prevents service release when evidence is missing or values are below demonstration safety floors. Attributable sign-off for Operations Supervisors and Chief Water Works Engineers.
6. **Regulatory Audit Trail (`/audit`)**: Filterable, searchable immutable ledger with actor attribution, state transitions, timestamp, and CSV export.

---

## 5. Local Quickstart

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/Bharathadi01/saferestart.git
cd saferestart

# Install dependencies
npm install

# Run unit test suite
npm run test

# Run TypeScript strict typecheck
npm run typecheck

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. AWS Serverless Deployment

A complete AWS SAM template is provided at [`template.yaml`](file:///Users/bharathadithya/.gemini/antigravity/scratch/saferestart/template.yaml).

```bash
# Validate SAM template
sam validate

# Build SAM application
sam build

# Deploy to AWS (guided first-time deployment)
sam deploy --guided
```

This deploys:
- `SafeRestartHttpApi`: API Gateway HTTP API
- `ZonesTable`: DynamoDB Table (`saferestart-zones-dev`)
- `RestartEventsTable`: DynamoDB Table (`saferestart-events-dev`)
- `AuditTrailTable`: DynamoDB Table (`saferestart-audit-dev`)
- `EvidenceBucket`: S3 Bucket with SSE-S3 encryption and public access blocked
- `SafeRestartEventBus`: Amazon EventBridge custom event bus
- Least-privilege IAM policies for each Lambda execution role.

---

## 7. Deterministic 3-Minute Demonstration Walkthrough

Follow this deterministic script during evaluation:

1. **Inspect Command Center (`/`)**:
   - Notice the prominent banner: `DEMO MODE — SIMULATED NETWORK DATA`.
   - Observe **Zone 1 (Central Business)** on **HOLD** due to an active leak on pipe `Z1-P-104` and missing chlorine data.
   - Observe **Zone 4 (Valley Park)** in **Awaiting Approval** state.
2. **Inspect Zone 1 Detail (`/zones/zone-1`)**:
   - Explore the React Flow network topology graph. Click `Z1-JNC-01` to view elevation and pressure.
   - Note the dashed red pipe `Z1-P-104` marked `LEAK SUSPECTED`.
   - View the Risk Engine card showing `ACTION: HOLD` and missing evidence requirements.
   - Click **Explain Decision with AI** to view Bedrock synthesis.
3. **Execute Field Verification (`/field`)**:
   - Select `Central Business & Historic District`.
   - Click judge preset: **Load Passing Sample (0.45 mg/L)**.
   - Click **Submit Evidence for Supervisor Review**.
4. **Perform Supervisor Authorization (`/supervisor`)**:
   - Select the updated restart request.
   - Verify that the Approval Gate is unlocked with green passing badges for chlorine, pressure, and flushing.
   - Check the compliance confirmation box and click **Authorize Drinking Water Service Restoration**.
5. **Verify Audit Trail (`/audit`)**:
   - View the newly committed `TRANSITION_AWAITING_APPROVAL_TO_RESTORED` record with actor name and timestamp.
   - Export CSV.
