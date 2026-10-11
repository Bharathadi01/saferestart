# SafeRestart — Amazon Engineering Interview Preparation & Technical Defense Guide

This document prepares you for a technical interview with Amazon software engineers and bar raisers (e.g., for the WeMakeDevs × AWS Bharat Builds Tour fast-track opportunity). Every question and answer is grounded directly in the SafeRestart codebase.

---

## 1. System Design & Architecture

### Q1: Why did you choose this hexagonal / decoupled architecture instead of putting logic in UI components or directly in AWS Lambda?
- **Code Reference:** [`src/lib/contracts/interfaces.ts`](../src/lib/contracts/interfaces.ts) (`ISafeRestartAdapter`), [`src/lib/adapters/local-store-adapter.ts`](../src/lib/adapters/local-store-adapter.ts).
- **Core Defense:** In environmental technology and critical municipal infrastructure, business rules (hydraulic risk evaluation, safety gating, state machine invariants) must be deterministic and verifiable independent of the cloud runtime. 
- By isolating domain logic behind `ISafeRestartAdapter`, the application runs with 0 cloud dependencies locally, allows instantaneous Vitest unit testing in milliseconds, and can be connected to AWS DynamoDB via `AwsDynamoDbAdapter` / EventBridge without rewriting domain business logic.
- **Trade-off:** Adds an extra abstraction layer and repository boilerplate compared to a direct Next.js database client or direct DynamoDB DocumentClient calls.

### Q2: Why use an explicit Directed Acyclic Graph (DAG) state machine instead of an operational status column?
- **Code Reference:** [`src/lib/state-machine.ts`](../src/lib/state-machine.ts) (`ALLOWED_TRANSITIONS`, `validateTransition`).
- **Core Defense:** In municipal water distribution, state shortcuts are dangerous. If an operator or system could transition directly from `INTERRUPTED` to `RESTORED` without prior physical scour flushing or residual testing, untreated or aspirated water would reach customers.
- The state machine guarantees that every transition satisfies prerequisite entry guards:
  - `AWAITING_APPROVAL` requires verified flushing, free chlorine $\ge 0.20\text{ mg/L}$, and zero pending field tasks.
  - `RESTORED` requires explicit role authorization (`SUPERVISOR` or `CHIEF_WATER_ENGINEER`).
- **Trade-off:** Rigid workflow transitions require explicit remediation branches (e.g. `HOLD` $\rightarrow$ `VERIFICATION_REQUIRED`) rather than quick manual overrides.

### Q3: What architectural changes would be required at city-scale (50,000 valves, 1,000 District Metered Areas)?
- **Scalability Bottlenecks in Current Prototype:** The current in-memory singleton stores zones and events in memory.
- **Production Architecture at Scale:**
  1. **Storage Partitioning:** Single-table DynamoDB partitioned by `PK: UTILITY#<utility_id>#ZONE#<zone_id>` and `SK: EVENT#<event_id>` to ensure single-partition access latency ($< 10\text{ms}$).
  2. **High-Frequency Ingestion:** Hydraulic pressure transducers sample at $1-10\text{ Hz}$. Ingesting raw sensor bursts directly into DynamoDB is cost-prohibitive. We would introduce an Amazon Kinesis Data Stream with AWS Lambda event filtering, emitting aggregated 1-minute summaries to DynamoDB and anomaly events to EventBridge.
  3. **Hydraulic Solver:** Offload hydraulic calculations to an asynchronous worker running EPANET 2.2 in AWS Fargate containers rather than browser-side calculations.

---

## 2. Data Integrity & Concurrency

### Q4: How do you handle duplicate events or concurrent operator requests?
- **Code Reference:** [`src/lib/store.ts`](../src/lib/store.ts) (`requestRestart`), [`tests/simulation-workflow.test.ts`](../tests/simulation-workflow.test.ts) (Scenario 13).
- **Core Defense:** Idempotency. When an operator triggers a restart assessment for a zone that already has an active restart event in flight, the system returns the existing event rather than spawning a duplicate active lifecycle.
- **Production Concurrency Defense:** In Amazon DynamoDB, we would enforce **Optimistic Locking** using a version attribute:
  ```json
  "ConditionExpression": "attribute_exists(id) AND #version = :expectedVersion"
  ```
  If Supervisor A approves while Dispatcher B is modifying notes, the second write fails with `ConditionalCheckFailedException`, prompting the client to re-fetch the latest state.

### Q5: How is the regulatory audit trail preserved? Can an operator alter past logs?
- **Code Reference:** [`src/lib/state-machine.ts`](../src/lib/state-machine.ts), [`src/lib/adapters/local-store-adapter.ts`](../src/lib/adapters/local-store-adapter.ts).
- **Core Defense:** The audit repository interface only exposes `append` and `findAll` methods—there is no `update` or `delete` method in the interface contract.
- In production AWS deployment, the `AuditTrailTable` uses an IAM policy granting only `dynamodb:PutItem` and `dynamodb:Query` with Point-in-Time Recovery (PITR) enabled. No `DeleteItem` permission is granted to application execution roles.

---

## 3. Responsible AI & Guardrails

### Q6: Why did you not let Amazon Bedrock determine whether water is safe to restore?
- **Code Reference:** [`src/lib/copilot.ts`](../src/lib/copilot.ts), [`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md).
- **Core Defense:** Hallucination and legal liability. Large language models are non-deterministic and can produce persuasive but physically incorrect deductions. A simulated risk score or LLM synthesis cannot prove microbiological safety.
- **SafeRestart Design Principle:** The LLM is strictly an **Evidence Copilot**:
  1. *Capability A:* Explains deterministic risk factors in plain language for human operators.
  2. *Capability B:* Structures messy, free-text field notes into a draft schema while preserving uncertainty (`SUSPECTED` leak vs confirmed; unmentioned reading = `null`, not zero).
- The deterministic TypeScript rules engine governs all state transitions. If Bedrock goes offline or returns malformed text, the application continues running seamlessly using local heuristics without safety degradation.

### Q7: How do you defend against prompt injection in free-text field notes?
- **Code Reference:** [`src/lib/copilot.ts`](../src/lib/copilot.ts) (`sanitizeInput`), [`tests/copilot.test.ts`](../tests/copilot.test.ts).
- **Core Defense:** 
  1. **Strict Input Sanitization:** Control characters are stripped and payload is bounded to 1,000 characters.
  2. **System Prompt Guardrails:** Explicit instructions enforce that the model only outputs JSON and is forbidden from modifying application state or certifying water quality.
  3. **Architectural Isolation:** The Copilot's output is strictly typed as `isDraft: true` and `requiresOperatorConfirmation: true`. The output never writes directly to the authoritative state machine—it requires human review and validation against physical sensors.

---

## 4. Cloud Architecture & AWS Scoping

### Q8: What AWS services are used, and what are the cost and latency considerations?
- **Code Reference:** [`template.yaml`](../template.yaml), [`src/lib/copilot.ts`](../src/lib/copilot.ts), [`src/lib/aws-client.ts`](../src/lib/aws-client.ts).
- **Services:**
  - **Amazon Bedrock (`amazon.nova-micro-v1:0` in `ap-southeast-2`):** Low-cost, fast inference ($<\$0.001$ per query, zero idle cost). Latency: $\sim 300-800\text{ms}$.
  - **AWS Amplify Hosting:** Next.js 15 SSR hosting with IAM execution role authentication via the AWS SDK default credential provider chain (no static keys needed).
  - **Amazon DynamoDB (On-Demand):** Pay-per-request billing. Zero fixed monthly server cost. Single-digit millisecond latency.
  - **AWS Lambda (Node.js 20.x):** Serverless execution with 30s timeout and least-privilege IAM policies.
  - **Amazon S3:** AES-256 server-side encryption with public access blocked for field photograph storage.
- **Resilience:** The application features an 8-second client-side abort timeout on Bedrock calls, gracefully falling back to deterministic local heuristics with explicit visual indicators (`Local explanation — Amazon Bedrock was not called`).

---

## 5. Security & Principle of Least Privilege

### Q9: How are credentials and permissions managed?
- **Code Reference:** [`template.yaml`](../template.yaml), [`src/lib/aws-client.ts`](../src/lib/aws-client.ts).
- **Core Defense:**
  - Zero hardcoded keys: `.env.local` is gitignored.
  - In production AWS Amplify Hosting or ECS, authentication automatically relies on the SSR compute IAM role with SigV4 signing via the AWS SDK default credential provider chain. Static access keys and bearer tokens are never required in production.
  - In local development, temporary Bedrock bearer tokens or standard IAM keys can optionally be used for diagnostics without committing secrets.
  - No client-side AWS SDK: All AWS calls execute inside server-side Node.js routes (`src/app/api/...`), completely shielding credentials from browser bundles.

---

## 6. Personal Contributions & Transparent Boundaries

### Q10: How did you use AI coding assistants during this hackathon?
- **Honest Truthful Disclosure:**
  - **My Role:** System Architect and Technical Lead. I designed the operational lifecycle (`INTERRUPTION` $\rightarrow$ `RESTORATION`), established the domain safety boundaries (disinfectant residual floors, depressurization penalties), architected the decoupled adapter pattern, and reviewed every line of code.
  - **AI Pair-Programmer (Google Antigravity / Gemini):** Accelerated boilerplate generation: scaffolding repetitive TypeScript interfaces, generating synthetic 5-zone coordinate topology, drafting Vitest assertion suites, and formatting Tailwind CSS components.
  - **Verification:** Every component was manually audited and verified via strict TypeScript checking (`tsc --noEmit`), ESLint, 64 automated Vitest unit/integration tests across 6 suites, and production build compilation.
