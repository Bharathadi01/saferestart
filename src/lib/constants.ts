// SafeRestart Demonstration Parameters, Constants & Safety Disclaimers

export const SAFETY_DISCLAIMER = {
  SHORT_BANNER: 'DEMO MODE — SIMULATED NETWORK DATA',
  FULL_DISCLAIMER:
    'SafeRestart is an operational decision-support prototype for research and evaluation. It does not certify drinking-water microbiological safety or replace statutory utility protocols. All telemetry, risk indicators, and thresholds are simulated demonstration parameters. Final service restoration requires physical testing, certified field validation, and authorized supervisor sign-off.',
  COMPLIANCE_NOTE:
    'Thresholds configured in this demonstration (e.g., minimum chlorine residual >= 0.20 mg/L, minimum service pressure >= 20.0 psi) reflect common baseline engineering parameters for demonstration purposes and must be adapted to jurisdiction-specific drinking water regulations.',
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
  SYSTEM_SIMULATOR: 'System Simulator (Telemetry Engine)',
  FIELD_TECHNICIAN: 'Certified Field Technician',
  WATER_QUALITY_SPECIALIST: 'Water Quality Field Specialist',
  SUPERVISOR: 'Distribution Operations Supervisor',
  CHIEF_WATER_ENGINEER: 'Chief Water Works Engineer',
} as const;

export const STATE_CONFIG = {
  NORMAL: {
    label: 'Normal Supply',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    description: 'Pressurized continuous supply within standard operational limits.',
  },
  INTERRUPTED: {
    label: 'Interrupted Supply',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    description: 'Supply suspended or depressurized. Vulnerability assessment pending.',
  },
  RESTART_REQUESTED: {
    label: 'Restart Requested',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
    description: 'Operator has flagged zone for restart. Risk engine evaluation in progress.',
  },
  ASSESSMENT_REQUIRED: {
    label: 'Assessment Required',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
    description: 'Awaiting hydraulic data evaluation and vulnerability check.',
  },
  HOLD: {
    label: 'RESTART HOLD',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
    dot: 'bg-rose-500 animate-pulse',
    description: 'Restart halted due to identified risks or incomplete evidence.',
  },
  MITIGATION_REQUIRED: {
    label: 'Mitigation Required',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
    description: 'Physical field remediation required (e.g. leak isolation, main flushing).',
  },
  VERIFICATION_REQUIRED: {
    label: 'Verification Required',
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-300',
    description: 'Water quality sampling and field pressure verification needed.',
  },
  AWAITING_APPROVAL: {
    label: 'Awaiting Supervisor Approval',
    color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-300',
    description: 'All field tasks complete. Awaiting authorized supervisor sign-off.',
  },
  RESTORED: {
    label: 'Service Restored',
    color: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-300',
    description: 'Zone successfully recharged, verified, authorized, and returned to service.',
  },
} as const;
