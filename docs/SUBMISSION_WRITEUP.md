# SafeRestart — Hackathon Project Submission Write-Up
**WeMakeDevs × AWS Environmental Hacks Hackathon**

---

## 1. Project Information
- **Project Name**: SafeRestart
- **Tagline**: Field-first decision support for safer drinking-water network restarts
- **Repository**: [https://github.com/Bharathadi01/saferestart](https://github.com/Bharathadi01/saferestart)
- **Primary AWS Services**: Amazon Bedrock (`amazon.nova-micro-v1:0` in `ap-southeast-2`), AWS Amplify Hosting (Next.js 15 SSR), Amazon DynamoDB (Single-table architecture), Amazon EventBridge, Amazon S3, AWS IAM.

---

## 2. The Environmental Problem

Over one billion people globally reside in urban and semi-urban communities served by **Intermittent Water Supply (IWS)** networks. In these systems, water is rationed and pumped for only a few hours per day or week.

When water is shut off, distribution mains depressurize:
1. **Contaminant Ingress & Back-Siphonage**: Surrounding high-water-table groundwater, sewer exfiltration, and contaminated soil aspirate into cracked pipes and unsealed joints through negative pressure suction.
2. **Sediment & Biofilm Sloughing**: Internal pipe tuberculation and stagnant microbial biofilm detach under the hydraulic shock of water rushing back during recharge.
3. **Disinfectant Depletion**: Stagnant water sitting in warm mains rapidly exhausts its free chlorine residual barrier.

When water supply returns, municipal operators face an urgent public health decision: *When and how is it safe to restore service to homes, schools, and hospitals?*

Existing tools either:
- Focus solely on SCADA telemetry dashboards without operational action workflows.
- Offer black-box machine learning predictions that operators cannot explain or legally justify.
- Rely on scattered paper logs and ad-hoc phone calls between dispatchers, field technicians, and engineers.

---

## 3. The SafeRestart Solution

SafeRestart does not claim to invent new water sensors or hydraulic solvers. **Our differentiation is the structured operational workflow**:

```
INTERRUPTION ➔ ASSESSMENT ➔ HOLD / PROCEED ➔ FIELD VERIFICATION ➔ SUPERVISOR APPROVAL ➔ RESTORATION ➔ AUDIT TRAIL
```

SafeRestart coordinates:
1. **Automated Interruption Capture**: Detects depressurization events and isolates vulnerability zones.
2. **Deterministic Risk Assessment**: Evaluates physical indicators (duration, minimum observed pressure, active pipe leaks, disinfectant residual, telemetry freshness) using transparent, explainable rules.
3. **Mandatory Safety Gating**: Missing or failing evidence strictly triggers an operational `HOLD`.
4. **Mobile Field Technician Directives**: Dispatches explicit physical checklists (scour flushing, repair sleeve verification, DPD colorimeter chlorine testing) directly to technicians on their mobile devices.
5. **Supervisor Release Gate**: Locks restoration approval until mandatory field evidence is reviewed by a designated supervisor.
6. **Structured Regulatory Audit Log**: Commits an attributed chronological audit record of every measurement, action, and supervisor decision.

---

## 4. Target Users

- **Municipal Water Distribution Operators**: Dispatchers monitoring daily supply schedules across District Metered Areas (DMAs).
- **Field Utility Technicians & Water Quality Officers**: Technicians scouring terminal hydrants and taking chemical residual measurements.
- **Chief Engineers & Utility Supervisors**: Authorized professionals who hold statutory legal responsibility for authorizing water releases.
- **Environmental Regulators & Health Inspectors**: Independent auditors reviewing historical service restoration evidence and incident logs.

---

## 5. What Makes This Approach Useful

Unlike black-box AI models that attempt to "predict safety" with unverifiable probabilities:
- **Zero Hallucinated Safety**: A low risk score is never treated as proof of safety. Water cannot be restored without physical field verification and authorized human sign-off.
- **Missing Evidence is a Hard Blocker**: Missing data never defaults to a passing score; it strictly blocks release.
- **Explainable to Municipal Judges**: Every single HOLD decision cites explicit physical facts (e.g., *"Interruption exceeded 12 hours"*, *"Free chlorine residual unverified"*).

---

## 6. Technical Implementation

- **Frontend**: Next.js 15 (App Router), TypeScript in strict mode, Tailwind CSS (accessible civic public-works light design system), Lucide React.
- **Network Visualization**: Interactive water network graph using React Flow (`@xyflow/react`) displaying reservoirs, PRV valves, junctions, hydrants, and leak status.
- **Time-Series Dynamics**: Pressure curves and chlorine depletion timelines using Recharts.
- **Decoupled Architecture**: Persistence and event processing are isolated behind `ISafeRestartAdapter` contracts ([`src/lib/contracts/interfaces.ts`](../src/lib/contracts/interfaces.ts)), enabling zero-dependency local execution while remaining 100% cloud-ready.
- **Target AWS Serverless Specification**: Complete AWS SAM template ([`template.yaml`](../template.yaml)) defining Amazon DynamoDB (3 tables), Amazon EventBridge (custom event bus), Amazon S3 (evidence bucket), and API Gateway HTTP API.
- **Cloud Native Hosting**: Configured for AWS Amplify Hosting SSR with execution IAM roles utilizing the AWS SDK default credential provider chain.

---

## 7. AWS Integration Status Matrix

| AWS Component | Purpose in Architecture | Implementation Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Amazon Bedrock** | Operator narrative structuring and field directive synthesis via `amazon.nova-micro-v1:0` (`ap-southeast-2`) | **Live SDK Route** (SigV4 IAM role in production / bearer token in local dev, with deterministic fallback) | [`src/lib/aws-client.ts`](../src/lib/aws-client.ts), [`src/app/api/bedrock/explain/route.ts`](../src/app/api/bedrock/explain/route.ts), [`scripts/verify-aws.mjs`](../scripts/verify-aws.mjs) |
| **AWS Amplify Hosting** | Next.js 15 SSR hosting with managed compute and environment configuration | **Configured** (`amplify.yml`, SSR compute IAM role) | [`amplify.yml`](../amplify.yml), [`README.md`](../README.md) |
| **Amazon DynamoDB** | Persistent storage for Zones, Restart Events, and Audit Logs | **Active in Local Adapter** & **IaC Specified** (SAM) | [`template.yaml`](../template.yaml), [`src/lib/adapters/dynamodb-adapter.ts`](../src/lib/adapters/dynamodb-adapter.ts) |
| **Amazon EventBridge** | Asynchronous decoupling of SCADA triggers and workflow events | Simulated locally via `IEventPublisher` (SAM IaC defined) | [`template.yaml`](../template.yaml), [`tests/adapters.test.ts`](../tests/adapters.test.ts) |
| **Amazon S3** | Encrypted photo evidence and field verification chain of custody | Simulated URI schema (SAM IaC defined) | [`template.yaml`](../template.yaml), [`src/components/field/FieldWorkerMode.tsx`](../src/components/field/FieldWorkerMode.tsx) |
| **AWS API Gateway / Lambda** | Serverless REST API endpoints for distribution zones and lifecycle | Implemented locally via Next.js App Router API Routes | [`src/app/api/...`](../src/app/api), [`template.yaml`](../template.yaml) |

---

## 8. Role of AI Tools

1. **AI-Assisted Development**: Google Antigravity and Gemini coding agents were utilized during development for scaffolding TypeScript domain types, Next.js boilerplate, accessible styling, and automated test writing.
2. **Runtime Application AI**: When configured, Amazon Bedrock (`amazon.nova-micro-v1:0` in `ap-southeast-2`) structures unstructured operator field notes and translates hydraulic parameters into concise technician directives. The model is **strictly prohibited from approving restarts, overriding holds, or fabricating test results**.
3. **Deterministic Authority Boundary**: The deterministic risk engine and state machine maintain 100% authority. If Bedrock is unavailable or unconfigured, the system seamlessly uses local deterministic heuristics without safety degradation.

---

## 9. What is Demonstrated Today

In the current working prototype:
- Complete end-to-end user journey across all 5 District Metered Areas.
- Interactive interruption triggering with immediate pressure drops and valve status changes.
- Automated risk engine assessment enforcing operational HOLDs.
- Mobile-first field technician task completion and measurement entry.
- Strict gating: low chlorine ($0.06\text{ mg/L}$) fails verification and keeps the event on HOLD; compliant chlorine ($\ge 0.20\text{ mg/L}$) unlocks the supervisor gate.
- Attributable supervisor authorization repressing the network to $36\text{ psi}$ and restoring normal topology.
- Real-time audit trail recording every state change with CSV export.
- **64 automated unit and integration tests** passing in Vitest with 0 errors across 6 test suites.

---

## 10. Future Roadmap

1. **Phase 3 Cloud Deployment**: Deploy `template.yaml` to AWS using AWS SAM to connect live Amazon DynamoDB tables and Amazon EventBridge.
2. **Cognito Multi-Tenancy**: Integrate Amazon Cognito User Pools for cryptographic JWT authorization and tenant segregation.
3. **EPANET Hydraulic Engine Integration**: Connect EPANET 2.2 WebAssembly solver for real-time transient surge simulations during gradual valve recharge.
