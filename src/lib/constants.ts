// SafeRestart Demonstration Parameters, Constants & Safety Disclaimers

export const SAFETY_DISCLAIMER = {
  SHORT_BANNER: 'DEMO PROTOTYPE',
  FULL_DISCLAIMER:
    'SafeRestart is an operational decision-support prototype for research and evaluation. It does not certify drinking-water microbiological safety or replace statutory utility protocols. All telemetry, risk indicators, and thresholds are simulated demonstration parameters. Final service restoration requires physical testing, certified field validation, and authorized supervisor sign-off.',
  COMPLIANCE_NOTE:
    'Demonstration thresholds (minimum free chlorine >= 0.20 mg/L, minimum service pressure >= 20.0 psi) represent baseline engineering parameters for evaluation and must be configured to jurisdictional standards.',
};

export const DEMO_THRESHOLDS = {
  // Pressure (psi)
  MIN_NORMAL_PRESSURE_PSI: 25.0,
  CRITICAL_LOW_PRESSURE_PSI: 15.0,
  NEGATIVE_PRESSURE_RISK_PSI: 5.0,

  // Chlorine Residual (mg/L)
  MIN_REQUIRED_FREE_CHLORINE_MG_L: 0.20,
  OPTIMAL_FREE_CHLORINE_MG_L: 0.50,
  MAX_FREE_CHLORINE_MG_L: 4.0,

  // Turbidity (NTU)
  MAX_ACCEPTABLE_TURBIDITY_NTU: 1.0,

  // Duration (hours)
  MAX_SAFE_INTERRUPTION_HOURS: 4.0,
  SEVERE_INTERRUPTION_HOURS: 12.0,

  // Freshness (minutes)
  TELEMETRY_STALE_MINUTES: 30,
  CHLORINE_STALE_MINUTES: 120, // 2 hours
};

export const ROLE_LABELS = {
  SYSTEM_SIMULATOR: 'Simulation Engine',
  FIELD_TECHNICIAN: 'Field Technician',
  WATER_QUALITY_SPECIALIST: 'Water Quality Specialist',
  SUPERVISOR: 'Operations Supervisor',
  CHIEF_WATER_ENGINEER: 'Chief Water Engineer',
} as const;

export const STATE_CONFIG = {
  NORMAL: {
    label: 'Supply operating normally',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    description: 'Pressurized continuous supply within standard operational limits.',
  },
  INTERRUPTED: {
    label: 'Water supply stopped',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    description: 'Supply suspended or depressurized. Safety checks required.',
  },
  RESTART_REQUESTED: {
    label: 'Restart requested',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    description: 'Operator has requested restart. Evaluating safety indicators.',
  },
  ASSESSMENT_REQUIRED: {
    label: 'Assessment needed',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    description: 'Awaiting hydraulic data evaluation and vulnerability check.',
  },
  HOLD: {
    label: 'Do not restart (HOLD)',
    color: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
    dot: 'bg-rose-600',
    description: 'Restart halted due to identified risks or incomplete evidence.',
  },
  MITIGATION_REQUIRED: {
    label: 'Repairs required',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-600',
    description: 'Physical field remediation required (e.g. leak isolation, main flushing).',
  },
  VERIFICATION_REQUIRED: {
    label: 'Check needed in field',
    color: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    dot: 'bg-amber-600',
    description: 'Field line flushing and disinfectant residual check required.',
  },
  AWAITING_APPROVAL: {
    label: 'Waiting for supervisor review',
    color: 'bg-purple-50 text-purple-800 border-purple-200 font-semibold',
    dot: 'bg-purple-600',
    description: 'Field tasks completed. Awaiting authorized supervisor sign-off.',
  },
  RESTORED: {
    label: 'Service restored',
    color: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
    description: 'Zone successfully recharged, verified, authorized, and returned to service.',
  },
} as const;
