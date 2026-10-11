# SafeRestart — Test Strategy & Verification Guide

This document outlines the testing architecture, operational test matrix, and verification procedures for **SafeRestart**.

---

## 1. Testing Philosophy

Water distribution networks present high-consequence operational decisions. In an intermittent supply regime, software errors can cause operators to mistakenly recharge a compromised zone. Therefore, the testing strategy emphasizes:
1. **Deterministic Verification**: Zero reliance on random values for risk decisions.
2. **Strict Guard Validation**: Testing that missing or stale evidence strictly triggers an operational `HOLD`.
3. **Role Gating Security**: Verifying that unauthorized actors cannot approve service restoration.
4. **Idempotent Transitions**: Ensuring repeated requests or network retries do not duplicate events or jump states.
5. **Full Audit Ledger Integrity**: Verifying that every state transition records actor, timestamp, and explicit rationale.
6. **Authentication & Cloud Resilience**: Verifying role-based Amplify SSR IAM execution roles (SigV4) alongside local bearer tokens and offline fallbacks.

---

## 2. Test Suite Structure

The test suite is built on **Vitest** and located in the `tests/` directory (64 passing tests across 6 test suites):

| Test File | Focus | Tests | Scenarios Tested |
| :--- | :--- | :--- | :--- |
| [`tests/risk-engine.test.ts`](../tests/risk-engine.test.ts) | Pure deterministic risk engine logic | 7 | Prolonged duration, severe depressurization, missing chlorine, stale SCADA, passing parameters, invalid input handling. |
| [`tests/state-machine.test.ts`](../tests/state-machine.test.ts) | DAG transition rules and guards | 6 | Valid transitions, illegal jumps, flushing guards, chlorine floor guards, role authorization, audit generation. |
| [`tests/adapters.test.ts`](../tests/adapters.test.ts) | Decoupled persistence & event publishing | 2 | Local repository queries, in-memory event publishing with zero cloud credentials. |
| [`tests/simulation-workflow.test.ts`](../tests/simulation-workflow.test.ts) | Complete end-to-end lifecycle | 15 | 15 comprehensive operational scenarios from interruption to restoration across multiple synthetic zones. |
| [`tests/aws-integration.test.ts`](../tests/aws-integration.test.ts) | AWS Bedrock, IAM role & SigV4 auth | 21 | Amplify SSR compute IAM execution role (SigV4), bearer token auth, Converse API payloads, offline heuristics fallback, safety invariants. |
| [`tests/copilot.test.ts`](../tests/copilot.test.ts) | Bedrock Copilot structuring & safety | 13 | Field report structuring, operator guidance, prompt injection sanitization, parameter bounding, fallback behavior. |

---

## 3. The 15 Mandatory Operational Test Scenarios

These 15 scenarios in [`tests/simulation-workflow.test.ts`](../tests/simulation-workflow.test.ts) validate the complete lifecycle:

1. **Normal zone receiving an interruption**: Transitions state from `NORMAL` to `INTERRUPTED`, drops pressure below 15 psi, and logs audit record.
2. **Interrupted zone requesting restart**: Captures hydraulic telemetry, runs risk engine, and transitions into evaluation.
3. **High-risk event placed on HOLD**: Prolonged interruption ($\ge 12\text{h}$) and unresolved leak trigger mandatory `HOLD`.
4. **Missing chlorine measurement blocking verification**: Missing disinfectant evidence forces `HOLD` and flags missing evidence.
5. **Stale telemetry flagged**: Data older than 30 minutes is flagged as a high-severity contributor.
6. **Unresolved leak creating field task**: Seeded leak incident generates an `INSPECT_LEAK` task.
7. **Incomplete tasks preventing verification**: Missing flushing completion prevents advancing to `AWAITING_APPROVAL`.
8. **Failed verification keeping event on HOLD**: Free chlorine reading below 0.20 mg/L fails verification and logs `VERIFICATION_FAILED_HOLD`.
9. **Successful verification moving to AWAITING_APPROVAL**: Compliant chlorine ($\ge 0.20\text{ mg/L}$), pressure ($\ge 20\text{ psi}$), and flushing advance the event.
10. **Unauthorized actor unable to approve**: Field technicians or unauthorized roles are blocked from approving restoration.
11. **Authorized approval moving to RESTORED**: Supervisor or Chief Engineer sign-off releases water and represses network.
12. **Invalid state transitions rejected**: Direct illegal jumps (e.g., `INTERRUPTED` $\rightarrow$ `RESTORED`) are rejected with explicit errors.
13. **Duplicate requests idempotent**: Retrying a restart request does not duplicate active restart events.
14. **Audit records generated for all transitions**: Each transition appends an immutable, attributed audit entry.
15. **Reset restoring initial state**: Reset clears active workflows and returns all 5 zones to the known demonstration baseline.

---

## 4. Running the Tests Locally

### Run All Unit & Integration Tests:
```bash
npm test
```
*Expected output: 6 passed test files, 64 passed tests.*

### Run Strict Code Linting:
```bash
npm run lint
```
*Expected output: Exit code 0, 0 warnings, 0 errors.*

### Run TypeScript Strict Typecheck:
```bash
npm run typecheck
```
*Expected output: Exit code 0, 0 type errors.*

### Run Standalone AWS Bedrock Diagnostic:
```bash
npm run verify:aws
```
*Verifies live Amazon Bedrock Nova Micro endpoint or confirms deterministic fallback.*

### Run Production Build:
```bash
npm run build
```
*Expected output: All 18 Next.js App Router routes compiled cleanly.*
