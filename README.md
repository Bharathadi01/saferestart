# SafeRestart

> **Field-first decision support for safer drinking-water network restarts.**  
> *Built for the WeMakeDevs × AWS Environmental Hacks Hackathon*

[![Next.js](https://img.shields.io/badge/Next.js-15.2.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Amazon Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Nova_Micro_v1-FF9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![AWS Amplify](https://img.shields.io/badge/AWS_Amplify-Hosting_SSR-FF9900?style=flat-square&logo=aws-amplify)](https://aws.amazon.com/amplify/)
[![Tests](https://img.shields.io/badge/Tests-64%2F64_Passing-emerald?style=flat-square&logo=vitest)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

---

> [!CAUTION]
> ### SAFETY & REGULATORY DISCLAIMER
> **SafeRestart is an operational decision-support prototype built for demonstration, engineering evaluation, and hackathon presentation.**  
> It does **not** certify drinking-water microbiological or chemical safety, nor does it replace statutory municipal water utility standard operating procedures, certified laboratory testing, or statutory public health regulations. All sensor streams, pressure curves, water-quality values, and risk scores within this repository are deterministic simulated demonstration data. Actual water-supply restoration requires physical field testing, certified laboratory confirmation, and explicit authorization by licensed municipal waterworks engineers.

---

## Operations Command Center

![SafeRestart Operations Command Center](docs/screenshots/01-command-center.png)
*Figure 1: SafeRestart Operations Command Center (`/`) showing real-time District Metered Area status, pressure telemetry, active restart holds, and demonstration controls.*

---

## Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. The SafeRestart Solution](#2-the-saferestart-solution)
- [3. Key Features: Implemented vs. Planned](#3-key-features-implemented-vs-planned)
- [4. Operational Workflow & User Journey](#4-operational-workflow--user-journey)
- [5. Application Walkthrough & Visual Tour](#5-application-walkthrough--visual-tour)
- [6. Architecture & System Design](#6-architecture--system-design)
- [7. Technology Stack](#7-technology-stack)
- [8. Project Structure](#8-project-structure)
- [9. Installation & Local Development](#9-installation--local-development)
- [10. Configuration & Environment Variables](#10-configuration--environment-variables)
- [11. Testing, Quality & Build Verification](#11-testing-quality--build-verification)
- [12. AWS Architecture & Deployment Guide](#12-aws-architecture--deployment-guide)
- [13. Data Handling, Simulation Mode & Boundaries](#13-data-handling-simulation-mode--boundaries)
- [14. AI Usage Disclosure](#14-ai-usage-disclosure)
- [15. Roadmap & Future Improvements](#15-roadmap--future-improvements)
- [16. Acknowledgements & References](#16-acknowledgements--references)

---

## 1. Problem Statement

Over **one billion people** globally rely on **intermittent water supply (IWS)** networks—distribution systems that alternate between pressurized supply cycles and unpressurized shutdown periods. When an intermittent drinking-water distribution zone experiences an unplanned or prolonged interruption, pipe pressure collapses to zero or sub-atmospheric (negative) levels.

Depressurization triggers severe physical and environmental hazards:

1. **Back-Siphonage & External Contaminant Intrusion**: Negative hydraulic pressure aspirates contaminated groundwater, sewage from proximate lateral trenches, and soil pathogens through cracked pipes, deteriorated gaskets, and unsealed joints.
2. **Biofilm Shearing & Tuberculation Release**: When dry or stagnant pipes are abruptly repressurized, hydraulic transients (water hammer) scour stagnant biofilm and dislodge heavy-metal tuberculation from interior pipe walls.
3. **Disinfectant Decay**: In stagnant distribution mains, free chlorine residual decays rapidly due to organic matter oxidation, eliminating the protective disinfectant barrier.
4. **Operational Blind Spots & Fragmented Communication**: Traditional SCADA systems display telemetry alarms but fail to guide field crews. SCADA operators, field technicians flushing hydrants, and municipal supervisors authorizing release communicate via disconnected phone calls, paper clipboards, and memory. Restorations often occur without verified flushing or certified chlorine residuals.

SafeRestart does not claim to invent water sensors, hydraulic transient models, or lab testing. **SafeRestart solves the operational workflow gap**: bridging SCADA telemetry, physical field validation, and accountable supervisor authorization into a single, transparent audit-logged workflow.

---

## 2. The SafeRestart Solution

SafeRestart transforms uncoordinated water network restarts into a structured, gated, and auditable operational lifecycle:

```
INTERRUPTION ➔ ASSESSMENT ➔ HOLD / REQUIRE VERIFICATION ➔ FIELD VERIFICATION ➔ SUPERVISOR APPROVAL ➔ RESTORATION ➔ REGULATORY AUDIT TRAIL
```

SafeRestart answers the **6 essential operational questions** every water utility faces before opening a valve:

1. **What happened to this water-supply zone?** (Interruption duration, minimum observed pressure, depressurization extent, impacted population).
2. **What evidence is available?** (SCADA pressure time series, supply flow rates, last recorded chlorine residual).
3. **What risk factors require immediate attention?** (Aged unlined cast-iron mains, unisolated collar leaks, pressure transients, stale telemetry).
4. **What must the field worker do next?** (Mobile-first tasks: pipe leak inspection, scouring hydrant flush, DPD colorimeter chlorine sampling).
5. **Have the configured safety criteria been satisfied?** (Enforces strict thresholds: Free Chlorine $\ge 0.20\text{ mg/L}$, Pressure $\ge 20.0\text{ psi}$, Turbidity $\le 1.0\text{ NTU}$).
6. **Who authorized service restoration, and what evidence supports it?** (Attributable supervisor sign-off recorded in an immutable, exportable regulatory audit ledger).

---

## 3. Key Features: Implemented vs. Planned

| Capability / Module | Status | Implementation Details |
| :--- | :--- | :--- |
| **Deterministic Simulation Engine** | **Implemented** | 5 distinct distribution zones with distinct topology, elevation profiles, pipe age, and synthetic telemetry generators. |
| **Interactive Network Topology Map** | **Implemented** | React Flow (`@xyflow/react`) canvas rendering reservoirs, PRVs, pipe segments, junctions, and hydrant sampling taps with live node inspection. |
| **Deterministic Risk Engine** | **Implemented** | Multi-factor rule-based heuristics evaluating interruption duration, negative pressure ingress, and active pipe leaks without black-box opacity. |
| **State Machine Lifecycle** | **Implemented** | Strict state machine DAG preventing unauthorized state jumps (`IDLE` $\rightarrow$ `INTERRUPTED` $\rightarrow$ `AWAITING_VERIFICATION` $\rightarrow$ `AWAITING_APPROVAL` $\rightarrow$ `RESTORED`). |
| **Field Technician Checklist** | **Implemented** | Mobile-optimized interface for field workers to record DPD chlorine, digital pressure, scouring flush duration, and photo verification with judge presets. |
| **Supervisor Authorization Gate** | **Implemented** | Hard-locked sign-off barrier requiring satisfied field evidence, compliance confirmation, and supervisor attribution. |
| **Regulatory Audit Ledger** | **Implemented** | Complete chronological event trail tracking actor identity, previous state, new state, timestamp, and one-click CSV compliance export. |
| **Bedrock AI Advisory Synthesis** | **Implemented** | Amazon Bedrock (`amazon.nova-micro-v1:0` in `ap-southeast-2`) integration with deterministic offline heuristics fallback for natural-language explanations and field note structuring. |
| **Amplify SSR Cloud Authentication** | **Implemented** | AWS SDK default credential provider chain integration for IAM execution roles (SigV4) in AWS Amplify Hosting alongside local bearer-token workflows. |
| **Decoupled Persistence Architecture** | **Implemented** | Clean `ISafeRestartAdapter` interface with fully operational `LocalSafeRestartAdapter` (zero-credential local dev) and `AwsDynamoDbAdapter` for cloud deployment. |
| **Infrastructure-as-Code (IaC)** | **Implemented** | Production-ready AWS SAM specification ([`template.yaml`](template.yaml)) defining API Gateway, Lambda, DynamoDB, S3, and EventBridge. |
| *EPANET 2.2 Hydraulic Engine WASM* | *Planned* | Compiling the EPA EPANET hydraulic solver to WebAssembly for client-side water-age and hydraulic transient calculation. |
| *LoRaWAN Edge Gateway Ingestion* | *Planned* | Direct binary payload parser for physical pressure sensors and cellular telemetry units. |
| *Offline PWA Field Sync* | *Planned* | ServiceWorker IndexedDB queueing for field technicians operating in basement or subterranean vaults without cellular coverage. |
| *Multi-Utility Multi-Tenant Federation* | *Planned* | AWS Cognito user pools with RBAC tenancy for regional water boards managing multiple autonomous municipal districts. |

---

## 4. Operational Workflow & User Journey

SafeRestart coordinates four primary operational roles across the restoration lifecycle:

```mermaid
sequenceDiagram
    autonumber
    actor SCADA as SCADA Operator / Dispatch
    actor Field as Field Technician (Mobile)
    actor Super as Operations Supervisor
    actor Audit as Environmental Auditor
    participant App as SafeRestart System
    participant Store as State Machine & Store

    SCADA->>App: Trigger Interruption / Detect Pressure Loss
    App->>Store: Transition Zone -> INTERRUPTED (Risk Engine Evaluates)
    SCADA->>App: Initiate Restart Request
    App->>Store: Transition -> AWAITING_VERIFICATION (Generates Checklist)
    Field->>App: Open Field Mode (/field) & Conduct Scouring Flush
    Field->>App: Input DPD Chlorine (e.g. 0.45 mg/L) & Pressure (38 psi)
    Field->>App: Submit Field Verification Package
    App->>Store: Validate thresholds -> Transition to AWAITING_APPROVAL
    Super->>App: Review Evidence Package (/supervisor)
    Note over Super,App: Approval Gate unlocked ONLY when all thresholds met
    Super->>App: Authorize Restoration with Regulatory Notes
    App->>Store: Transition -> RESTORED & Log Immutable Audit Entry
    Audit->>App: Review Ledger (/audit) & Export CSV Compliance Report
```

1. **SCADA Dispatcher** (`/`): Observes live pressure drops or valve failures across 5 distribution zones. Initiates restart assessment. The system evaluates pipe age and active leaks, placing vulnerable zones on **HOLD**.
2. **Field Technician** (`/field`): Receives automated directives on their mobile device: repair collar leaks, conduct a 15-minute scouring flush at terminal hydrants, and record DPD colorimeter chlorine samples.
3. **Operations Supervisor** (`/supervisor`): Reviews submitted photo proof, field timestamps, and chemical values. The gated sign-off button remains disabled until all physical criteria ($\ge 0.20\text{ mg/L}$ free chlorine, $\ge 20\text{ psi}$) are verified. Authorizes water service restoration.
4. **Compliance Auditor** (`/audit`): Inspects the chronological transition ledger, verifies actor attribution (`marcus.vance@utility.gov`), and exports the audit record for regulatory reporting.

---

## 5. Application Walkthrough & Visual Tour

Every screenshot below captures the genuine, pixel-perfect user interface of the running SafeRestart application:

### 1. Operations Command Center
The central command dashboard provides a high-level operational overview across all 5 municipal water-supply zones, aggregate restart holds, evidence completeness progress bars, and simulation controls.

![Operations Command Center](docs/screenshots/01-command-center.png)
*Figure 1: Operations Command Center (`/`) showing zone grid, pressure indicators, and demonstration controls.*

### 2. Interactive Water Network Topology
Built with React Flow (`@xyflow/react`), this interactive schematic allows engineers to inspect reservoirs, control valves, junctions, pipe age, and terminal sampling hydrants with real-time inspection sidebars.

![Zone Detail and Topology](docs/screenshots/02-zone-topology.png)
*Figure 2: Zone Detail View (`/zones/zone-1`) featuring interactive hydraulic node graph and real-time pressure time series.*

### 3. Deterministic Risk Evaluation & AI Advisory Synthesis
Transparent risk breakdown highlighting interruption duration, negative-pressure ingress hazards, and active pipe leaks with Amazon Bedrock operator explanations.

![Risk Engine Panel](docs/screenshots/03-risk-engine-panel.png)
*Figure 3: Deterministic risk engine score card and Amazon Bedrock advisory synthesis (`/events/EVT-2026-001`).*

### 4. Field Technician Verification & Mobile Safety Checklist
Step-by-step checklist designed for utility crews in the field to log chlorine measurements, flush hydrants, and record physical evidence—optimized for both desktop workstations and mobile field devices.

| Desktop Workstation Viewport | Mobile Field Handheld Viewport |
| :---: | :---: |
| ![Field Worker Interface](docs/screenshots/04-field-worker-interface.png) | <img src="docs/screenshots/07-mobile-field-worker.png" width="300" alt="Mobile Field Worker Viewport" /> |
| *Figure 4a: Field Worker Mode (`/field`) desktop layout with quick evaluation presets.* | *Figure 4b: Mobile-optimized field technician checklist.* |

### 5. Supervisor Authorization Gate
Gated sign-off interface that locks out service restoration until all configured physical criteria are met. The sign-off button is hard-disabled until compliance checks are verified.

![Supervisor Authorization Gate](docs/screenshots/05-supervisor-authorization-gate.png)
*Figure 5: Supervisor Review Gate (`/supervisor`) displaying compliance checks, signature input, and release controls.*

### 6. Regulatory Audit Trail & Compliance Ledger
Filterable, searchable compliance ledger with full actor attribution, prior/new state transitions, and one-click CSV export.

![Regulatory Audit Trail](docs/screenshots/06-audit-trail-ledger.png)
*Figure 6: Immutable Regulatory Audit Trail (`/audit`) with transition logs and CSV export.*

---

## 6. Architecture & System Design

SafeRestart follows a modular, decoupled architecture where domain business logic is strictly isolated from infrastructure and persistence adapters.

### High-Level System Architecture

```mermaid
flowchart TD
    subgraph UI ["Client Presentation Layer (Next.js 15 App Router)"]
        CC["Operations Command Center (/)"]
        ZT["Network Topology & Detail (/zones/[id])"]
        FW["Mobile Field Worker Mode (/field)"]
        SV["Supervisor Approval Gate (/supervisor)"]
        AT["Regulatory Audit Ledger (/audit)"]
    end

    subgraph Core ["Deterministic Domain Engine"]
        SM["State Machine Engine\n(State DAG & Invariant Enforcement)"]
        RE["Risk Engine\n(Duration, Negative Pressure, Leaks)"]
        TE["Deterministic Telemetry Engine\n(5 Simulated Zones)"]
    end

    subgraph Adapter ["Persistence Abstraction Layer (ISafeRestartAdapter)"]
        LSA["LocalSafeRestartAdapter\n(In-Memory Store - Active Local Mode)"]
        DDBA["AwsDynamoDbAdapter\n(Amazon DynamoDB - Production Target)"]
    end

    subgraph Hosting ["AWS Cloud Hosting & AI"]
        AMP["AWS Amplify Hosting SSR\n(Next.js 15 Compute IAM Role - SigV4)"]
        BEDROCK["Amazon Bedrock\n(amazon.nova-micro-v1:0 in ap-southeast-2)"]
    end

    subgraph AWS ["Target AWS Cloud Infrastructure (AWS SAM)"]
        APIGW["Amazon API Gateway HTTP API"]
        LAMBDA["AWS Lambda Microservices"]
        DDB["Amazon DynamoDB\n(Single-Table Design)"]
        S3["Amazon S3\n(Encrypted Evidence Storage)"]
        EB["Amazon EventBridge\n(Domain Event Bus)"]
    end

    UI --> Core
    Core --> Adapter
    Adapter -. Local Dev .-> LSA
    Adapter -. AWS Deployment .-> DDBA
    DDBA --> DDB
    UI --> AMP
    AMP --> BEDROCK
    UI --> APIGW
    APIGW --> LAMBDA
    LAMBDA --> EB
    LAMBDA --> S3
```

### State Machine Lifecycle DAG

SafeRestart enforces a strict state machine preventing invalid shortcuts:

```mermaid
stateDiagram-v2
    [*] --> IDLE: Zone Operational
    IDLE --> INTERRUPTED: Pressure Loss / Valve Shutdown
    INTERRUPTED --> AWAITING_VERIFICATION: Restart Request Initiated
    AWAITING_VERIFICATION --> AWAITING_APPROVAL: Field Checks Satisfied
    AWAITING_VERIFICATION --> HOLD: Critical Leak or Zero Residual
    HOLD --> AWAITING_VERIFICATION: Remediation Completed
    AWAITING_APPROVAL --> RESTORED: Supervisor Sign-Off Authorized
    AWAITING_APPROVAL --> HOLD: Supervisor Rejects / New Anomaly Detected
    RESTORED --> IDLE: Operational Normalization
```

Detailed architectural specifications, data schemas, and mathematical heuristics are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 7. Technology Stack

| Layer | Technology | Version | Purpose in SafeRestart |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 15.2.1 | Unified full-stack framework for server-rendered UI and REST API routes. |
| **Language** | TypeScript | 5.8+ | Strict type safety with zero runtime surprises; strict mode enabled. |
| **UI Library** | React | 19.0.0 | Component rendering, hooks, and responsive state synchronization. |
| **Styling** | Tailwind CSS | 3.4.17 | Accessible civic public-works light design system (`slate-50`, `#f8fafc`). |
| **Network Topology** | React Flow (`@xyflow/react`) | 12.4.4 | Interactive hydraulic schematic displaying reservoirs, pipes, valves, and junctions. |
| **Hydraulic Charts** | Recharts | 2.15.1 | Responsive time-series charts rendering pressure curves and chlorine depletion. |
| **Icons** | Lucide React | 0.477.0 | Consistent iconography for hydraulic assets, status badges, and warnings. |
| **Unit & Integration Tests**| Vitest | 3.0.7 | Fast unit and integration test runner (64 passing tests across 6 test suites). |
| **Generative AI** | Amazon Bedrock | Cloud Target | Operator advisory summaries & note structuring via `amazon.nova-micro-v1:0` (`ap-southeast-2`). |
| **Cloud Hosting** | AWS Amplify Hosting | Cloud Target | Next.js 15 SSR hosting with managed compute and IAM execution roles. |
| **Database (Production)** | Amazon DynamoDB | Cloud Target | Serverless single-table persistence via `AwsDynamoDbAdapter`. |
| **Event Bus (Production)**| Amazon EventBridge | Cloud Target | Asynchronous decoupling for interruption events and audit logging. |
| **Object Store (Production)**| Amazon S3 | Cloud Target | Server-side encrypted storage for field verification photo evidence. |
| **Cloud IaC** | AWS SAM | Specification | Infrastructure-as-code template defining AWS cloud services. |

---

## 8. Project Structure

```
saferestart/
├── amplify.yml                      # AWS Amplify Hosting build and deploy specification
├── template.yaml                    # AWS SAM serverless infrastructure specification
├── package.json                     # Scripts, dependencies, and project metadata
├── vitest.config.ts                 # Vitest unit and integration test runner config
├── .env.example                     # Reference environment variable configuration
│
├── docs/                            # In-depth architectural & evaluation documentation
│   ├── ARCHITECTURE.md              # Canonical domain architecture and state machine spec
│   ├── DEMO_SCRIPT.md               # 3-minute video presentation and walkthrough script
│   ├── TESTING.md                   # Complete test strategy and verification guide
│   ├── SUBMISSION_WRITEUP.md        # Official hackathon submission write-up
│   ├── KNOWN_LIMITATIONS.md         # Scientific boundaries and prototype scope
│   ├── INTERVIEW_PREPARATION.md     # Amazon technical defense and design interview prep
│   └── screenshots/                 # Authentic application screenshots (Figures 1-7)
│
├── src/
│   ├── app/                         # Next.js 15 App Router routes and API handlers
│   │   ├── page.tsx                 # Operations Command Center (/)
│   │   ├── field/page.tsx           # Mobile Field Worker Mode (/field)
│   │   ├── supervisor/page.tsx      # Supervisor Review & Approval Gate (/supervisor)
│   │   ├── audit/page.tsx           # Regulatory Audit Ledger (/audit)
│   │   ├── zones/[id]/page.tsx      # Network Topology & Zone Details (/zones/[id])
│   │   ├── events/[id]/page.tsx     # Restart Event Details & AI Advisory (/events/[id])
│   │   └── api/                     # REST API handlers for zones, events, audit & Bedrock
│   │
│   ├── components/                  # Modular React presentation components
│   │   ├── dashboard/               # Command Center dashboard components
│   │   ├── field/                   # Mobile field checklist and measurement inputs
│   │   ├── supervisor/              # Supervisor review gate and authorization forms
│   │   ├── audit/                   # Audit log view and CSV export controls
│   │   ├── copilot/                 # Bedrock field report structuring widget
│   │   ├── zone/                    # React Flow topology graph and Recharts time-series
│   │   └── ui/                      # Shared design system components (badges, banners, cards)
│   │
│   └── lib/                         # Core domain logic, adapters, and contracts
│       ├── contracts/               # Formal TypeScript repository and store interfaces
│       ├── adapters/                # Local in-memory and AWS DynamoDB persistence adapters
│       ├── state-machine.ts         # Validated state machine DAG and guard functions
│       ├── risk-engine.ts           # Deterministic multi-factor hydraulic risk rules
│       ├── aws-client.ts            # Amazon Bedrock client (SigV4 IAM role & bearer token)
│       ├── copilot.ts               # Bedrock Converse API structuring and offline fallback
│       ├── synthetic-data.ts        # Deterministic 5-zone distribution data generator
│       └── store.ts                 # Central singleton simulation store and event bus
│
├── tests/                           # Vitest automated test suites (64 passing tests)
│   ├── unit/                        # Risk engine, state machine, and adapter unit tests
│   ├── integration/                 # End-to-end 15-scenario simulation workflow tests
│   ├── aws-integration.test.ts      # Bedrock auth, SigV4 IAM roles, and safety invariant tests
│   └── copilot.test.ts              # Bedrock Copilot prompt sanitization and fallback tests
│
└── scripts/                         # Operational verification utilities
    ├── verify-aws.mjs               # Standalone AWS Bedrock live endpoint verification
    └── validate-docs.mjs            # Automated markdown link and image validator
```

---

## 9. Installation & Local Development

### Prerequisites

- **Node.js**: v20.x or v22.x LTS (v24+ also supported)
- **npm**: v10+
- **Git**: v2.30+

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Bharathadi01/saferestart.git
   cd saferestart
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   *Note: No AWS credentials are required for local development. The project runs out-of-the-box using the deterministic in-memory persistence adapter.*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to access the Operations Command Center.

---

## 10. Configuration & Environment Variables

All environment variables have safe fallback defaults for local execution. See [`.env.example`](.env.example):

```ini
# Node Environment
NODE_ENV=development

# AWS Region (Defaults to ap-southeast-2 Sydney, matching verified Bedrock deployment)
AWS_REGION=ap-southeast-2

# Amazon Bedrock Model Configuration (Defaults to amazon.nova-micro-v1:0)
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# Production AWS IAM Role / Default Credential Provider Chain
# In AWS Amplify Hosting SSR or ECS/Lambda, role-based SigV4 auth is automatically discovered.
# Static keys or bearer tokens are NOT required in production.
# AWS_USE_IAM_ROLE=true

# AWS Authentication (Option 1: Short-term Bedrock API Key bearer token - Local dev testing)
# AWS_BEARER_TOKEN_BEDROCK=ey...

# AWS Authentication (Option 2: Standard IAM Credentials - Local dev alternative)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_SESSION_TOKEN=

# Storage & Persistence (Defaults to false / in-memory until real tables are provisioned)
USE_DYNAMODB=false
# ZONES_TABLE=saferestart-zones-dev
# RESTART_EVENTS_TABLE=saferestart-events-dev
# AUDIT_TRAIL_TABLE=saferestart-audit-dev

# Amazon S3 Field Evidence Bucket
# EVIDENCE_BUCKET=saferestart-evidence-dev

# Amazon EventBridge Custom Event Bus
# EVENT_BUS_NAME=saferestart-bus-dev
```

When AWS credentials are omitted, SafeRestart automatically routes data through `LocalSafeRestartAdapter`, maintaining complete statefulness in memory without cloud dependencies or billing.

---

## 11. Testing, Quality & Build Verification

SafeRestart adheres to strict engineering quality standards. Six verification commands are available:

```bash
# 1. Run ESLint (must pass with 0 warnings and 0 errors)
npm run lint

# 2. Strict TypeScript type check (noEmit)
npm run typecheck

# 3. Unit and integration tests with Vitest (64/64 passing across 6 suites)
npm test

# 4. Standalone live AWS Bedrock integration diagnostic
npm run verify:aws

# 5. Production Next.js build compilation (all 18 routes compiled)
npm run build

# 6. Documentation link and screenshot asset validation
node scripts/validate-docs.mjs
```

### Test Coverage Highlights

- `tests/risk-engine.test.ts`: Verifies mathematical boundary conditions, negative-pressure ingress penalties, aged cast-iron risk factors, and missing telemetry deductions.
- `tests/state-machine.test.ts`: Enforces state transition invariants, preventing restarts without prior field verification or unassigned supervisor sign-offs.
- `tests/adapters.test.ts`: Validates persistence contract adherence between local in-memory stores and cloud interfaces.
- `tests/simulation-workflow.test.ts`: Executes the complete end-to-end lifecycle from interruption to restoration across multiple synthetic zones (15 scenarios).
- `tests/aws-integration.test.ts`: 21 comprehensive integration and safety invariant tests verifying:
  - AWS SDK default credential provider chain for Amplify SSR compute IAM execution roles (SigV4).
  - Bedrock SDK bearer-token auth (`httpBearerAuth`) for local development.
  - Converse API payload formatting for `amazon.nova-micro-v1:0` in `ap-southeast-2`.
  - Graceful deterministic offline fallback upon `AccessDeniedException` or network timeout.
  - Strict safety guarantees that AI explanations never override deterministic safety engine `HOLD` decisions.
- `tests/copilot.test.ts`: Validates field report structuring, operator guidance, prompt injection sanitization, and fallback behavior.

For detailed testing documentation, see [`docs/TESTING.md`](docs/TESTING.md).

---

## 12. AWS Architecture & Deployment Guide

SafeRestart is architected following cloud-native, serverless AWS best practices:

| AWS Service | Architectural Role | Implementation Status | Verification Artifact |
| :--- | :--- | :--- | :--- |
| **AWS Amplify Hosting** | Next.js 15 SSR hosting with compute IAM execution role (SigV4) | **Production Target** | [`amplify.yml`](amplify.yml) |
| **Amazon Bedrock** | GenAI advisory synthesis & note structuring via `amazon.nova-micro-v1:0` (`ap-southeast-2`) | **Implemented** (Live route with fallback) | [`src/lib/aws-client.ts`](src/lib/aws-client.ts), [`src/app/api/bedrock/explain/route.ts`](src/app/api/bedrock/explain/route.ts) |
| **Amazon DynamoDB** | Single-table persistence for zones, restart events, and immutable audit logs | **Active in Local Adapter** / **Cloud Adapter Ready** | [`src/lib/adapters/dynamodb-adapter.ts`](src/lib/adapters/dynamodb-adapter.ts), [`template.yaml`](template.yaml) |
| **Amazon API Gateway** | HTTP API frontend routing REST requests to serverless backends | **IaC Specified** (AWS SAM) | [`template.yaml`](template.yaml) |
| **AWS Lambda** | Stateless compute for risk engine, event processing, and audit recording | **IaC Specified** (AWS SAM) | [`template.yaml`](template.yaml) |
| **Amazon S3** | Encrypted object storage for field verification photo evidence | **IaC Specified** (AWS SAM) | [`template.yaml`](template.yaml) |
| **Amazon EventBridge** | Custom domain event bus for asynchronous interruption orchestration | **IaC Specified** (AWS SAM) | [`template.yaml`](template.yaml) |
| **AWS IAM** | Least-privilege role policies for execution boundaries | **IaC Specified** (AWS SAM) | [`template.yaml`](template.yaml) |

### Deploying to AWS Amplify Hosting

1. Connect your repository to AWS Amplify Hosting in the AWS Management Console.
2. Select Next.js 15 with SSR compute support.
3. Attach an IAM execution role to Amplify SSR compute with `bedrock:InvokeModel` permissions.
4. Set environment variables:
   - `AWS_REGION`: `ap-southeast-2`
   - `BEDROCK_MODEL_ID`: `amazon.nova-micro-v1:0`
5. Deploy using the included [`amplify.yml`](amplify.yml) build specification.

### Deploying Serverless Stack via AWS SAM

```bash
# 1. Validate the SAM template
sam validate

# 2. Build the serverless application
sam build

# 3. Guided deployment to your AWS account
sam deploy --guided
```

This provisions `SafeRestartHttpApi`, `ZonesTable`, `RestartEventsTable`, `AuditTrailTable`, `EvidenceBucket`, `SafeRestartEventBus`, and least-privilege IAM roles.

---

## 13. Data Handling, Simulation Mode & Boundaries

SafeRestart includes a deterministic synthetic telemetry generator modeling **5 realistic water-distribution zones**:

1. **Zone 1: Central Business & Historic District** (Aged unlined cast iron, high connectivity, active collar leak on pipe `Z1-P-104`).
2. **Zone 2: North Ridge High-Elevation Zone** (Booster-dependent, steep elevation gradients, severe negative pressure risk).
3. **Zone 3: East Industrial & Port Zone** (High-diameter ductile iron mains, heavy diurnal demand swings).
4. **Zone 4: Valley Park Residential District** (Stable PVC network, pre-populated demonstration restart event).
5. **Zone 5: West Hills Peripheral Zone** (Dead-end branch geometry, high water age, rapid chlorine residual decay).

### Simulation Integrity Principles

- **Deterministic Seeds**: The simulation does not use uncontrolled random numbers. Actions produce predictable, reproducible trajectories for reliable evaluation.
- **Physical Plausibility**: Telemetry calculations adhere to hydraulic principles: pressure drops when inflow ceases; chlorine decays exponentially as water age increases; negative pressures flag external contamination vulnerability.
- **No Masquerading**: Telemetry streams are explicitly marked `SIMULATED` across every screen to prevent confusion with actual utility operations.

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for complete details on mathematical assumptions and operational boundaries.

---

## 14. AI Usage Disclosure

In compliance with hackathon transparency guidelines:

1. **AI Development Assistance**: AI coding assistants (including Google Antigravity and Gemini coding agents) were utilized as pair-programming tools during development for drafting TypeScript interfaces, writing Vitest test cases, crafting Tailwind styling, and authoring technical documentation. All generated code and documentation were manually reviewed, edited, and validated by the maintainer.
2. **Application-Level AI (Amazon Bedrock)**: SafeRestart integrates Amazon Bedrock (`amazon.nova-micro-v1:0` in `ap-southeast-2`) through [`/api/bedrock/explain`](src/app/api/bedrock/explain/route.ts) and [`/api/copilot/structure-report`](src/app/api/copilot/structure-report/route.ts). Bedrock's role is strictly limited to **synthesizing natural-language operator briefings and extracting structured parameters from informal field briefings**.
3. **Deterministic Authority Boundary**: **The LLM never makes authoritative safety or restoration decisions.** All risk scoring, threshold evaluations, and state machine transitions are executed exclusively by deterministic TypeScript algorithms. If Bedrock is unreachable or credentials are not supplied, the system seamlessly falls back to local deterministic engineering heuristics without degradation. Every AI response is transparently labelled with its origin (`source: 'BEDROCK_LIVE'` or `'LOCAL_FALLBACK'`).

See [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) for complete details.

---

## 15. Roadmap & Future Improvements

- [ ] **EPANET 2.2 WebAssembly Integration**: Run dynamic hydraulic simulations (Hazen-Williams / Darcy-Weisbach) directly in the browser.
- [ ] **Physical Sensor Ingestion**: Real-time MQTT / LoRaWAN adapter for cellular field loggers.
- [ ] **Offline-First PWA Mode**: IndexedDB background sync for field crews in cellular dead zones.
- [ ] **Spatial GIS Layer**: Mapbox GL / OpenLayers integration for municipal shapefile and GeoJSON asset overlays.
- [ ] **Multi-Tenant Utility RBAC**: AWS Cognito user pools with partitioned DynamoDB multitenancy for regional water boards.

---

## 16. Acknowledgements & References

- **World Health Organization (WHO)**: *Guidelines for Drinking-water Quality (4th Edition)*, particularly Chapter 4 (Water Safety Plans) and Chapter 7 (Microbial Aspects).
- **American Water Works Association (AWWA)**: *AWWA Standard C651 (Disinfecting Water Mains)* and *Manual M31 (Distribution System Requirements for Water Quality)*.
- **US Environmental Protection Agency (EPA)**: *EPA 816-R-01-014 (Planning for an Emergency Drinking Water Supply)*.
- **WeMakeDevs & AWS Environmental Hacks**: For organizing this hackathon focused on impactful environmental technology solutions.

---

## License

This project is licensed under the [MIT License](LICENSE).
