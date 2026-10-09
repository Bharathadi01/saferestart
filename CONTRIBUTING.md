# Contributing to SafeRestart

Thank you for your interest in contributing to **SafeRestart**! SafeRestart is an open-source, field-first operational decision-support system designed to coordinate evidence, field tasks, and supervisor authorization when restarting intermittently supplied drinking-water networks.

Please review this guide before submitting issues or pull requests.

---

## 1. Safety and Domain Ground Rules

SafeRestart deals with drinking-water operational workflows. As a contributor, you must adhere to several non-negotiable principles:

1. **Decision Support, Not Water Safety Certification**: SafeRestart structures operational workflows, risk checks, and field verification. It does **not** certify microbiological or chemical water safety. Code must not present simulated risk outputs or automated routines as regulatory safety releases.
2. **Prominent Simulation Labeling**: Any synthetic telemetry, hydraulic calculations, or simulated sensor streams must be prominently identified as simulated. Never generate fake telemetry that masquerades as real municipal data.
3. **Deterministic Core Logic**: Risk evaluations, state machine transitions, and gating rules must remain deterministic and auditable. AI models (e.g., Bedrock LLMs) are used strictly for synthesizing operator summaries and advisory explanations—never as authoritative decision-makers.

---

## 2. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please treat all participants with respect, courtesy, and constructive professionalism.

---

## 3. Development Workflow

### Prerequisites

- **Node.js**: v20.x or v22.x LTS (v24+ also supported)
- **npm**: v10+
- **Git**: v2.30+

### Setting Up Your Local Environment

1. Fork the repository on GitHub and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/saferestart.git
   cd saferestart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(No AWS credentials are required for local development. The project runs out-of-the-box using the deterministic in-memory persistence adapter.)*

4. Run the development server:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to inspect the application.

---

## 4. Verification and Quality Standards

Before submitting any code changes, ensure all verification suites pass cleanly without errors or warnings:

```bash
# 1. Run ESLint (must exit with 0 errors and 0 warnings)
npm run lint

# 2. Strict TypeScript type check (noEmit)
npm run typecheck

# 3. Vitest unit and integration test suite
npm test

# 4. Production Next.js build
npm run build
```

### TypeScript & Style Guidelines

- **TypeScript Strict Mode**: TypeScript strict mode is enabled. Do not use `any` unless there is a documented, unavoidable constraint. Use discriminated unions and strict interfaces.
- **Component Design**: Keep UI components modular. Separate business logic (risk heuristics, state machine transitions) from presentation components.
- **Styling**: Use Tailwind CSS utility classes adhering to the operational dark navy palette (`slate-900`, `slate-950`, `sky-500`, `amber-500`, `emerald-500`, `rose-500`).
- **Persistence Boundary**: New features needing persistence must interface through `ISafeRestartAdapter` in `src/lib/adapters/index.ts` so both local in-memory simulation and AWS DynamoDB backends remain supported.

---

## 5. Branching & Commit Conventions

### Branch Names

Use descriptive branch prefixes:
- `feat/<feature-name>`: New functionality or workflows
- `fix/<bug-name>`: Bug fixes
- `docs/<doc-name>`: Documentation improvements
- `refactor/<refactor-name>`: Code refactoring without behavioral changes
- `test/<test-name>`: New or expanded tests

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) convention:
```
<type>(<scope>): <short description>

[optional body]
```

Examples:
- `feat(risk): add negative pressure ingress factor to restart evaluation`
- `fix(field): correct DPD colorimeter calibration step range check`
- `docs(testing): update operational scenario verification table`
- `refactor(adapters): decouple DynamoDB batch write from local store`

---

## 6. Pull Request Process

1. Ensure your branch is rebased on the latest `main`.
2. Verify all 4 checks pass: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
3. If introducing new logic, provide accompanying Vitest tests in `tests/`.
4. Submit your pull request with:
   - A clear description of the operational or technical problem solved.
   - Screenshots or terminal outputs verifying the change.
   - Reference to any related GitHub issues.
5. Maintainers will review the PR for architectural adherence, safety boundaries, and test coverage.

---

## 7. Reporting Issues

- **Bug Reports**: Open an issue detailing the exact steps to reproduce, expected vs actual behavior, environment details (Node version, OS, browser), and relevant console logs.
- **Feature Requests**: Describe the user journey (operator, field worker, or supervisor), the operational problem addressed, and how it aligns with SafeRestart's safety-first mission.
