# SafeRestart REST API Specification

All endpoints communicate via JSON over HTTPS.

## Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/zones` | Retrieve all 5 DMA zones with telemetry summaries and cloud status. |
| `GET` | `/api/zones/{id}` | Retrieve single zone with network topology nodes, pipes, and telemetry history. |
| `GET` | `/api/restart-events` | List all restart events. |
| `GET` | `/api/restart-events/{id}` | Retrieve restart event details, associated field tasks, and audit logs. |
| `POST` | `/api/restart-events/{id}/request` | Initiate or re-evaluate restart workflow for an interrupted zone. |
| `POST` | `/api/restart-events/{id}/verification` | Submit field verification (free chlorine, pressure, flushing checklist, photo). |
| `POST` | `/api/restart-events/{id}/approve` | Authorized supervisor sign-off to restore service or enforce HOLD. |
| `POST` | `/api/simulation/interruption` | Simulate supply interruption and pressure drop in a selected zone. |
| `POST` | `/api/simulation/advance` | Advance the simulation clock by $N$ hours. |
| `POST` | `/api/simulation/reset` | Reset simulation state to initial deterministic baseline. |
| `GET` | `/api/audit` | Query immutable audit ledger with optional `zoneId` or `eventId` filters. |
| `POST` | `/api/bedrock/explain` | Synthesize plain-language risk engine explanation using Amazon Bedrock. |

---

## Detailed Payloads

### 1. `POST /api/restart-events/{id}/verification`
**Request Body:**
```json
{
  "submittedBy": "Tech A. Rivera (Field ID #2041)",
  "role": "WATER_QUALITY_SPECIALIST",
  "freeChlorineMgL": 0.45,
  "turbidityNtu": 0.35,
  "observedPressurePsi": 30.0,
  "flushingCompleted": true,
  "leakInspectedAndSecured": true,
  "photoProofAttached": true,
  "notes": "Terminal hydrant H-401 flushed for 15 minutes. Free chlorine residual verified stable."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "EVT-2026-001",
    "state": "AWAITING_APPROVAL",
    "updatedAt": "2026-10-10T04:20:00.000Z",
    "verificationSubmission": { ... }
  },
  "audit": {
    "id": "AUD-17382910",
    "action": "TRANSITION_VERIFICATION_REQUIRED_TO_AWAITING_APPROVAL"
  }
}
```

---

### 2. `POST /api/restart-events/{id}/approve`
**Request Body:**
```json
{
  "supervisorName": "Chief Engineer Helena Miller, P.E.",
  "supervisorRole": "CHIEF_WATER_ENGINEER",
  "decision": "APPROVE",
  "rationale": "Field chlorine residual (0.45 mg/L) and system pressure (30.0 psi) meet demonstration compliance floors. Service release authorized.",
  "complianceChecksVerified": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "EVT-2026-001",
    "state": "RESTORED",
    "updatedAt": "2026-10-10T04:22:00.000Z"
  },
  "audit": {
    "id": "AUD-17382999",
    "action": "TRANSITION_AWAITING_APPROVAL_TO_RESTORED"
  }
}
```
