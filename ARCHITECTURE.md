# SafeRestart System Architecture & Design Specification

## 1. Domain Modeling & State Lifecycle

The SafeRestart core workflow models water restart events as a Directed Acyclic Graph (DAG) state machine:

```
        ┌──────────────┐
        │    NORMAL    │
        └───────┬──────┘
                │ (Pressure Drop < 15 psi / Valve Cut)
                ▼
        ┌──────────────┐
   ┌───►│ INTERRUPTED  │
   │    └───────┬──────┘
   │            │ (Restart Request)
   │            ▼
   │    ┌──────────────────┐
   │    │RESTART_REQUESTED │
   │    └───────┬──────────┘
   │            │ (Risk Engine Evaluation)
   │            ▼
   │    ┌──────────────────┐
   │    │ASSESSMENT_REQ    │
   │    └───┬──────────┬───┘
   │        │          │
 (Fail)     ▼          ▼ (Low Risk)
   │    ┌──────┐   ┌───────────────────────┐
   └───┤ HOLD │   │ VERIFICATION_REQUIRED │◄──┐
        └───┬──┘   └───────────┬───────────┘   │
            │                  │               │
            ▼                  ▼               │
    ┌──────────────┐   ┌───────────────────┐   │ (Fail)
    │MITIGATION_REQ│   │ AWAITING_APPROVAL │───┘
    └──────────────┘   └─────────┬─────────┘
                                 │ (Supervisor Sign-Off)
                                 ▼
                         ┌───────────────┐
                         │   RESTORED    │
                         └───────────────┘
```

### State Machine Transition Table

| Current State | Target State | Required Actors | Prerequisite Guards |
| :--- | :--- | :--- | :--- |
| `NORMAL` | `INTERRUPTED` | `SYSTEM_SIMULATOR`, `SUPERVISOR` | Transducer pressure $< 15\text{ psi}$ or manual isolation. |
| `INTERRUPTED` | `RESTART_REQUESTED` | `SUPERVISOR`, `CHIEF_WATER_ENGINEER` | None. Initiates telemetry aggregation. |
| `RESTART_REQUESTED` | `HOLD` or `VERIFICATION_REQUIRED` | `SYSTEM_SIMULATOR` (Risk Engine) | Automatically branched by physical risk indicators. |
| `VERIFICATION_REQUIRED` | `AWAITING_APPROVAL` | `FIELD_TECHNICIAN`, `WATER_QUALITY_SPECIALIST` | Scour flushing completed; Free chlorine $\ge 0.20\text{ mg/L}$; Observed pressure $\ge 20\text{ psi}$. |
| `AWAITING_APPROVAL` | `RESTORED` | `SUPERVISOR`, `CHIEF_WATER_ENGINEER` | Mandatory manual compliance check confirmation; Zero missing evidence items. |
| `AWAITING_APPROVAL` | `HOLD` | `SUPERVISOR`, `CHIEF_WATER_ENGINEER` | Negative biological sample, unresolved leak, or operator discretion. |

---

## 2. Deterministic Risk Engine Specification

The risk engine is implemented in [`src/lib/risk-engine.ts`](file:///Users/bharathadithya/.gemini/antigravity/scratch/saferestart/src/lib/risk-engine.ts). It enforces strict physical heuristics:

1. **Interruption Duration**:
   - $\ge 12\text{ hours}$: Severity `HIGH` (+35 risk points). Back-siphonage and pipe sediment detachment risk.
   - $\ge 4\text{ hours}$: Severity `MEDIUM` (+20 risk points). Stagnation and low pressure ingress.
   - $< 4\text{ hours}$: Severity `LOW` (+5 risk points).
2. **Minimum Observed Pressure**:
   - $\le 5\text{ psi}$: Severity `HIGH` (+40 risk points). Severe negative pressure ingress hazard.
   - $< 15\text{ psi}$: Severity `MEDIUM` (+20 risk points).
   - $\ge 15\text{ psi}$: Severity `LOW`.
3. **Telemetry Freshness**:
   - Data age $> 30\text{ minutes}$: Severity `HIGH` (+25 risk points). Marked as stale; flags missing `fresh_scada_telemetry`.
4. **Physical Pipe Leaks**:
   - Active unresolved leaks: Severity `HIGH` (+30 risk points). Flags missing `leak_isolation_and_repair_verification`.
5. **Disinfection Residual (Free Chlorine)**:
   - Missing or $< 0.20\text{ mg/L}$: Severity `HIGH` (+30 risk points). Missing `free_chlorine_residual_measurement`.
   - $0.20 - 0.49\text{ mg/L}$: Severity `MEDIUM` (+10 risk points).
   - $\ge 0.50\text{ mg/L}$: Severity `LOW`.

**Critical Invariant:** Any factor with `HIGH` severity or any missing evidence strictly forces `action = 'HOLD'`.

---

## 3. AWS Serverless Architecture & Component Matrix

| AWS Component | Service Role | Configuration & Security |
| :--- | :--- | :--- |
| **Amazon API Gateway HTTP API** | Ingress API router | CORS restricted, latency-optimized, IAM/JWT authorizers |
| **Amazon DynamoDB: ZonesTable** | DMA zones and network node assets | On-Demand billing, SSE-KMS, PITR enabled |
| **Amazon DynamoDB: RestartEventsTable**| Active and historical restart events | Global Secondary Index on `zoneId` |
| **Amazon DynamoDB: AuditTrailTable** | Tamper-resistant transition history | Immutable append-only, GSI on `zoneId` + `timestamp` |
| **Amazon S3: EvidenceBucket** | Field technician photos and chain of custody | Public Access Blocked, AES256 server-side encryption |
| **Amazon EventBridge** | Asynchronous event bus | Decouples SCADA telemetry ingestion from state machine transitions |
| **Amazon Bedrock** | Operator narrative structuring & synthesis | Uses Claude 3 Sonnet; strictly decision support; no approval authority |
| **AWS Lambda** | Serverless function runtime | Node.js 20.x / Python 3.12, least-privilege IAM policies |
