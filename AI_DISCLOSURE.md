# AI Tools & Model Disclosure

This document discloses all generative AI models, tools, and assistance used in the design, architecture, and implementation of **SafeRestart** for the AWS Environmental Hacks Hackathon.

## 1. Generative AI Tools Used During Development

- **Google Antigravity & Gemini 3.8 / 2.5 Coding Agents**: Used as an AI pair programmer for scaffolding TypeScript domain types, Next.js 15 App Router boilerplate, Tailwind color schemes, and synthetic network data generation.
- **Amazon Bedrock (Claude 3 Sonnet)**: Integrated directly into the runtime application architecture for decision support:
  - Synthesizing unstructured operator notes into structured incident fields.
  - Translating hydraulic engineering risk factors into clear, prioritized field directives for field workers.
  - Explaining deterministic risk engine HOLD decisions in plain language.

## 2. Architectural Guardrails on Runtime AI

In compliance with water utility safety requirements:
1. **No Autonomous Approval**: The AI model is strictly prohibited from authorizing service restoration, clearing a HOLD, or modifying state machine transitions.
2. **No Data Fabrication**: The AI model is never permitted to invent sensor readings, fabricate chlorine residuals, or simulate passing bacteriological tests.
3. **Deterministic Core**: All state transitions, risk factors, and safety thresholds are governed by pure deterministic TypeScript logic and validated state machines, ensuring reliable operation even if the cloud AI model is offline or unreachable.
4. **Attributable Auditability**: All final decisions require human supervisor sign-off and are recorded in an immutable audit ledger.
