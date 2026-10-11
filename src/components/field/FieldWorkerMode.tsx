'use client';

import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Camera,
  Droplet,
  Send,
  AlertTriangle,
  Info,
  Check,
  X,
  HelpCircle,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  UserCheck,
  ExternalLink,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { WaterZone, RestartEvent, VerificationSubmission } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';
import { FieldReportCopilot } from '@/components/copilot/FieldReportCopilot';
import { NextActionCard } from '@/components/ui/NextActionCard';

interface FieldWorkerModeProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onVerificationSubmitted?: (
    submission: VerificationSubmission
  ) => Promise<{ success: boolean; outcome?: string; reasons?: string[] } | void>;
  lang?: 'en' | 'ta';
  onToggleLang?: () => void;
  onFieldReportCommitted?: () => void;
}

// 100% Comprehensive & Authentic Translations for Field Technicians
const TRANSLATIONS = {
  en: {
    title: 'Water Zone Inspection & Safety Checklist',
    subtitle: 'Step-by-step safety protocol before drinking-water restoration',
    
    // Zone selection launchpad
    selectZoneHeading: 'Which water zone needs attention?',
    selectZoneSubtext: 'Select an affected zone below to start or continue your safety check.',
    allZonesNominal: 'All distribution sectors are currently operating normally.',
    
    // Everyday statuses
    statusStopped: 'Water supply stopped — Safety check needed',
    statusVerifying: 'Check needed — Verification in progress',
    statusWaitingApproval: 'Waiting for supervisor review',
    statusHold: 'Do not restart — Safety hold active',
    statusNormal: 'Supply operating normally',
    
    // Action buttons on cards
    btnStartCheck: 'Start Water Check',
    btnContinueCheck: 'Continue Inspection',
    btnViewStatus: 'View Status',
    btnOperating: 'Operating Normally',

    // Stepper
    stepOf: (cur: number, total: number) => `Check ${cur} of ${total}`,
    btnNext: 'Next Check',
    btnBack: 'Previous',
    btnBackToZones: '← Back to all zones',

    // Step 1: Pipe leak
    step1Title: 'Check 1: Physical Pipe Leak Check',
    step1Question: 'Did you inspect the pipe repair and joints? Is the pipe secure with no leaks?',
    step1Help: 'When water pressure drops, cracks can suck dirty groundwater into empty pipes.',
    step1Yes: 'Yes — Leak is repaired & secure',
    step1YesSub: 'Repair clamp or sleeve verified stable',
    step1No: 'No — Pipe is still leaking',
    step1NoSub: 'Groundwater ingress hazard active',
    step1Unable: 'Unable to check / Not accessible',
    step1UnableSub: 'Will keep the water supply on HOLD for safety',

    // Step 2: Flush hydrant
    step2Title: 'Check 2: Flush Hydrant for 15 Minutes',
    step2Question: 'Did you open the terminal hydrant and flush water for at least 15 minutes?',
    step2Help: 'Scour flushing purges stagnant sediment and biofilm that settled during shutdown.',
    step2Yes: 'Yes — Flushed 15 min until clear',
    step2YesSub: 'Sediment and biofilm purged from main',
    step2No: 'No — Flushing not completed',
    step2NoSub: 'Stagnant deposits remain in line',
    step2Unable: 'Unable to flush / No drainage',
    step2UnableSub: 'Will keep the water supply on HOLD for safety',

    // Step 3: Disinfectant residual
    step3Title: 'Check 3: Test Water Disinfectant (Chlorine)',
    step3Question: 'Test the water with your test strip or colorimeter. Is chlorine safe?',
    step3Help: `Water must have at least ${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L of free chlorine to kill harmful bacteria.`,
    step3PresetSafe: 'Safe level: 0.45 mg/L (Recommended)',
    step3PresetSafeSub: 'Meets minimum statutory safety floor',
    step3PresetUnsafe: 'Critical low: 0.06 mg/L (Unsafe)',
    step3PresetUnsafeSub: 'Chlorine depleted — Bacteria risk',
    step3CustomLabel: 'Or enter test reading manually (mg/L):',
    step3SafeBadge: 'Safe disinfectant floor met (>= 0.20 mg/L)',
    step3DangerBadge: 'Unsafe — Below safety floor (< 0.20 mg/L)',

    // Step 4: Photo proof
    step4Title: 'Check 4: Photo Proof of Clean Sample',
    step4Question: 'Attach a photo of the clear water sample or colorimeter vial.',
    step4Help: 'Provides visual proof to protect household health.',
    step4Yes: 'Photo attached (Clear sample verified)',
    step4YesSub: 'Visual chain of custody saved',
    step4No: 'No photo attached',
    step4NoSub: 'Chain of custody will record missing photo',

    // Step 5: Decision & Review
    step5Title: 'Step 5: Review & Plain Decision',
    step5Subtitle: 'Review your answers below before submitting to operations.',
    decisionHoldTitle: 'Do not restart the water supply.',
    decisionHoldDesc: 'One or more safety checks failed or are incomplete. The water network must remain stopped to prevent contaminated water from reaching homes.',
    decisionPassTitle: 'Field checks complete — Ready for supervisor.',
    decisionPassDesc: 'All field safety criteria met. Submitting will send this report to your supervisor for restoration authorization.',
    nextActionHold: 'What to do next: Contact your operations supervisor. Do not open distribution valves.',
    nextActionPass: 'What to do next: Submit this report. Your supervisor must review and authorize service restoration.',
    btnSubmit: 'Submit Report to Supervisor',
    btnSubmitting: 'Submitting report...',

    // Summary labels
    lblLeak: 'Pipe Leak Check',
    lblFlush: '15-Min Flush',
    lblChlorine: 'Chlorine Disinfectant',
    lblPhoto: 'Photo Proof',
    lblNotes: 'Technician Notes (Optional)',

    // Supervisor link
    supervisorBannerText: 'Operations Supervisor? Review submitted evidence and authorize service restoration.',
    btnGoSupervisor: 'Open Supervisor Review',
    viewZoneDetails: 'View zone details →',

    // Real field verification tasks & Copilot
    assignedTasksHeading: 'Active Assigned Field Directives',
    assignedTasksSubtext: 'Directives issued for this incident. Record readings and complete tasks below.',
    btnCopilotOpen: 'Record / Transcribe Field Notes (AI Evidence Copilot)',
    btnCopilotClose: 'Close Field Note Assistant',
    copilotHelper: 'Dictate or paste field observations. You must verify and confirm extracted facts before committing to the incident.',
    lblStatusCompleted: 'Completed',
    lblStatusPending: 'Pending Inspection',
  },
  ta: {
    title: 'களப் பாதுகாப்பு சரிபார்ப்புப் பட்டியல்',
    subtitle: 'குடிநீர் விநியோகத்தை மீண்டும் தொடங்குவதற்கான படிநிலைப் பாதுகாப்பு நெறிமுறை',

    // Zone selection launchpad
    selectZoneHeading: 'எந்த விநியோக மண்டலத்தை சரிபார்க்க வேண்டும்?',
    selectZoneSubtext: 'பாதிக்கப்பட்ட பகுதியைத் தேர்ந்தெடுத்து உங்கள் பாதுகாப்புச் சோதனையைத் தொடங்கவும்.',
    allZonesNominal: 'அனைத்து மண்டலங்களும் தற்போது சாதாரணமாக இயங்குகின்றன.',

    // Everyday statuses
    statusStopped: 'நீர் விநியோகம் நிறுத்தப்பட்டது — பாதுகாப்பு சோதனை தேவை',
    statusVerifying: 'சோதனை தேவை — கள ஆய்வு நடைபெறுகிறது',
    statusWaitingApproval: 'மேற்பார்வையாளர் ஒப்புதலுக்காக காத்திருக்கிறது',
    statusHold: 'தொடங்க வேண்டாம் — பாதுகாப்பு நிறுத்தம் நடைமுறையில் உள்ளது',
    statusNormal: 'விநியோகம் சாதாரணமாக இயங்குகிறது',

    // Action buttons on cards
    btnStartCheck: 'பாதுகாப்பு சோதனையைத் தொடங்கு',
    btnContinueCheck: 'சோதனையைத் தொடரவும்',
    btnViewStatus: 'நிலையைக் காண்க',
    btnOperating: 'சாதாரணமாக இயங்குகிறது',

    // Stepper
    stepOf: (cur: number, total: number) => `சரிபார்ப்பு ${cur} / ${total}`,
    btnNext: 'அடுத்த சரிபார்ப்பு',
    btnBack: 'முந்தையது',
    btnBackToZones: '← அனைத்து மண்டலங்களுக்கும் திரும்புக',

    // Step 1: Pipe leak
    step1Title: 'படி 1: குழாய் கசிவு சரிபார்ப்பு',
    step1Question: 'குழாய் பழுது மற்றும் இணைப்புகளை சரிபார்த்தீர்களா? கசிவு ஏதும் இல்லாமல் பாதுகாப்பாக உள்ளதா?',
    step1Help: 'நீர் அழுத்தம் குறையும் போது சாக்கடை நீர் குழாய்களுக்குள் நுழைய வாய்ப்புள்ளது.',
    step1Yes: 'ஆம் — கசிவு சரிசெய்யப்பட்டது & பாதுகாப்பானது',
    step1YesSub: 'குழாய் இணைப்புகள் பாதுகாப்பாக உள்ளன',
    step1No: 'இல்லை — குழாயில் கசிவு உள்ளது',
    step1NoSub: 'சாக்கடை நீர் நுழையும் ஆபத்து உள்ளது',
    step1Unable: 'சரிபார்க்க முடியவில்லை / அணுக முடியவில்லை',
    step1UnableSub: 'பாதுகாப்பு கருதி நீர் விநியோகம் நிறுத்தி வைக்கப்படும்',

    // Step 2: Flush hydrant
    step2Title: 'படி 2: 15 நிமிட தண்ணீர் வெளியேற்றம்',
    step2Question: 'குழாயில் தேங்கிய அழுக்குகளை வெளியேற்ற 15 நிமிடங்கள் தண்ணீரை வெளியேற்றினீர்களா?',
    step2Help: 'தேங்கிய வண்டல் மற்றும் பாக்டீரியாவை அகற்ற இந்த வெளியேற்றம் அவசியம்.',
    step2Yes: 'ஆம் — 15 நிமிடங்கள் வெளியேற்றப்பட்டது (சுத்தமான நீர் வருகிறது)',
    step2YesSub: 'குழாய்களில் தேங்கிய அழுக்கு வெளியேற்றப்பட்டது',
    step2No: 'இல்லை — வெளியேற்றப்படவில்லை',
    step2NoSub: 'குழாய்களில் தேங்கிய அழுக்கு இன்னும் உள்ளது',
    step2Unable: 'வெளியேற்ற முடியவில்லை',
    step2UnableSub: 'பாதுகாப்பு கருதி நீர் விநியோகம் நிறுத்தி வைக்கப்படும்',

    // Step 3: Disinfectant residual
    step3Title: 'படி 3: குளோரின் அளவு சோதனை',
    step3Question: 'தண்ணீரில் குளோரின் அளவை சோதிக்கவும். குடிப்பதற்கு பாதுகாப்பாக உள்ளதா?',
    step3Help: `நோய் கிருமிகள் அழிய குறைந்தது ${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L குளோரின் இருக்க வேண்டும்.`,
    step3PresetSafe: 'பாதுகாப்பானது: 0.45 mg/L (பரிந்துரைக்கப்பட்ட அளவு)',
    step3PresetSafeSub: 'குடிநீருக்கான குறைந்தபட்ச பாதுகாப்பளவு உள்ளது',
    step3PresetUnsafe: 'ஆபத்தானது: 0.06 mg/L (குளோரின் பற்றாக்குறை)',
    step3PresetUnsafeSub: 'பாக்டீரியா மற்றும் கிருமி தொற்று ஆபத்து',
    step3CustomLabel: 'அல்லது குளோரின் அளவை உள்ளிடவும் (mg/L):',
    step3SafeBadge: 'பாதுகாப்பான அளவு பூர்த்தி (>= 0.20 mg/L)',
    step3DangerBadge: 'ஆபத்து — அனுமதிக்கப்பட்ட அளவுக்கு கீழ் (< 0.20 mg/L)',

    // Step 4: Photo proof
    step4Title: 'படி 4: புகைப்பட ஆதாரம்',
    step4Question: 'சுத்தமான தண்ணீர் அல்லது குளோரின் சோதனைக் குழாயின் புகைப்படத்தை எடுக்கவும்.',
    step4Help: 'பொதுமக்கள் பாதுகாப்பிற்காக புகைப்பட ஆதாரம் சேமிக்கப்படுகிறது.',
    step4Yes: 'புகைப்படம் இணைக்கப்பட்டது (சுத்தமான மாதிரி உறுதி)',
    step4YesSub: 'புகைப்பட ஆதாரம் இணைக்கப்பட்டுள்ளது',
    step4No: 'புகைப்படம் இணைக்கப்படவில்லை',
    step4NoSub: 'புகைப்படம் இல்லாமல் பதிவு செய்யப்படும்',

    // Step 5: Decision & Review
    step5Title: 'படி 5: இறுதி சரிபார்ப்பு & முடிவு',
    step5Subtitle: 'மேற்பார்வையாளருக்கு சமர்ப்பிப்பதற்கு முன் உங்கள் பதில்களை சரிபார்க்கவும்.',
    decisionHoldTitle: 'நீர் விநியோகத்தை தொடங்க வேண்டாம்.',
    decisionHoldDesc: 'ஒன்று அல்லது அதற்கு மேற்பட்ட பாதுகாப்பு சோதனைகள் தோல்வியுற்றன. அசுத்தமான நீர் வீடுகளுக்குச் செல்வதைத் தடுக்க நீர் நிறுத்தி வைக்கப்பட வேண்டும்.',
    decisionPassTitle: 'கள சோதனைகள் முடிந்தது — மேற்பார்வையாளர் ஒப்புதலுக்கு தயார்.',
    decisionPassDesc: 'அனைத்து பாதுகாப்பு விதிகளும் பூர்த்தி செய்யப்பட்டுள்ளன. இந்த அறிக்கை மேற்பார்வையாளரின் ஒப்புதலுக்கு அனுப்பப்படும்.',
    nextActionHold: 'அடுத்து செய்ய வேண்டியது: உங்கள் மேற்பார்வையாளரைத் தொடர்பு கொள்ளவும். வால்வுகளைத் திறக்க வேண்டாம்.',
    nextActionPass: 'அடுத்து செய்ய வேண்டியது: இந்த அறிக்கையை சமர்ப்பிக்கவும். மேற்பார்வையாளர் ஆய்வு செய்து அனுமதிப்பார்.',
    btnSubmit: 'மேற்பார்வையாளருக்கு சமர்ப்பிக்கவும்',
    btnSubmitting: 'சமர்ப்பிக்கப்படுகிறது...',

    // Summary labels
    lblLeak: 'குழாய் கசிவு நிலை',
    lblFlush: '15 நிமிட வெளியேற்றம்',
    lblChlorine: 'குளோரின் அளவு',
    lblPhoto: 'புகைப்பட ஆதாரம்',
    lblNotes: 'குறிப்புகள் (விரும்பினால்)',

    // Supervisor link
    supervisorBannerText: 'மேற்பார்வையாளரா? சமர்ப்பிக்கப்பட்ட ஆதாரங்களை ஆய்வு செய்து நீர் விநியோகத்தை அனுமதிக்கவும்.',
    btnGoSupervisor: 'மேற்பார்வையாளர் அறைக்குச் செல்லவும்',
    viewZoneDetails: 'மண்டல விவரங்கள் →',

    // Real field verification tasks & Copilot
    assignedTasksHeading: 'இந்த சம்பவத்திற்கான களப் பணி உத்தரவுகள்',
    assignedTasksSubtext: 'வழங்கப்பட்ட பணிகளை முடித்து கள அளவீடுகளைப் பதிவு செய்யவும்.',
    btnCopilotOpen: 'களக் குறிப்புகளைப் பதிவு செய்க (AI உதவியாளர்)',
    btnCopilotClose: 'குறிப்பு உதவியாளரை மூடுக',
    copilotHelper: 'கள அவதானிப்புகளை எழுதவும் அல்லது ஒட்டவும். தகவல்கள் பதிவு செய்யப்படுவதற்கு முன் நீங்கள் அவற்றை உறுதிப்படுத்த வேண்டும்.',
    lblStatusCompleted: 'முடிந்தது',
    lblStatusPending: 'ஆய்வு நிலுவையில் உள்ளது',
  },
};

export function FieldWorkerMode({
  zones,
  events,
  onVerificationSubmitted,
  lang = 'en',
  onFieldReportCommitted,
}: FieldWorkerModeProps) {
  const t = TRANSLATIONS[lang];

  // Selected zone state
  const candidateZones = zones.filter((z) => z.activeRestartEventId && events[z.activeRestartEventId]);
  const defaultZoneId = candidateZones[0]?.id || zones[0]?.id || 'zone-1';
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>(defaultZoneId);
  const [isInspecting, setIsInspecting] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showAssignedTasks, setShowAssignedTasks] = useState(true);

  // Field task answers
  const [leakState, setLeakState] = useState<'YES' | 'NO' | 'UNABLE'>('YES');
  const [flushState, setFlushState] = useState<'YES' | 'NO' | 'UNABLE'>('YES');
  const [freeChlorine, setFreeChlorine] = useState<string>('0.45');
  const [photoAttached, setPhotoAttached] = useState<boolean>(true);
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    'Hydrant scour flush complete. Free chlorine verified >= 0.20 mg/L.'
  );

  const handleReportCommitted = (data: any) => {
    if (data?.explicitEvidence?.freeChlorineMgL !== null && data?.explicitEvidence?.freeChlorineMgL !== undefined) {
      setFreeChlorine(String(data.explicitEvidence.freeChlorineMgL));
    }
    if (data?.suspectedFault?.status === 'NONE') {
      setLeakState('YES');
    } else if (data?.suspectedFault?.status === 'CONFIRMED' || data?.suspectedFault?.status === 'SUSPECTED') {
      setLeakState('NO');
    }
    onFieldReportCommitted?.();
  };

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: 'PASSED' | 'FAILED';
    title: string;
    description: string;
    nextAction: string;
  } | null>(null);

  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const activeEvent = currentZone?.activeRestartEventId
    ? events[currentZone.activeRestartEventId]
    : undefined;

  // Evaluation criteria
  const chlorineNum = parseFloat(freeChlorine) || 0;
  const isChlorineSafe = chlorineNum >= DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;
  const allChecksPassed =
    leakState === 'YES' &&
    flushState === 'YES' &&
    isChlorineSafe &&
    photoAttached;

  const handleStartInspection = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setIsInspecting(true);
    setStep(1);
    setSubmissionResult(null);
  };

  const handleSubmit = async () => {
    if (!activeEvent || !onVerificationSubmitted) return;

    setSubmitting(true);
    const submission: VerificationSubmission = {
      eventId: activeEvent.id,
      submittedBy: 'Field Tech A. Rivera (Crew ID #2041)',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: chlorineNum,
      turbidityNtu: 0.35,
      observedPressurePsi: 30.0,
      flushingCompleted: flushState === 'YES',
      leakInspectedAndSecured: leakState === 'YES',
      photoProofAttached: photoAttached,
      notes: technicianNotes,
    };

    try {
      const res = await onVerificationSubmitted(submission);
      if (res && res.outcome === 'FAILED') {
        setSubmissionResult({
          status: 'FAILED',
          title: t.decisionHoldTitle,
          description:
            res.reasons?.join(' ') ||
            'Field checks did not meet minimum safety requirements. Water supply placed on HOLD.',
          nextAction: t.nextActionHold,
        });
      } else {
        setSubmissionResult({
          status: 'PASSED',
          title: t.decisionPassTitle,
          description:
            'Inspection report saved and verified. Sent to supervisor for authorization before water recharge.',
          nextAction: t.nextActionPass,
        });
      }
    } catch {
      setSubmissionResult({
        status: 'FAILED',
        title: 'Submission Error',
        description: 'Unable to save inspection. Please check connection and try again.',
        nextAction: 'Contact supervisor if the error persists.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getZoneStatusBadge = (zone: WaterZone) => {
    const evt = zone.activeRestartEventId ? events[zone.activeRestartEventId] : undefined;
    if (zone.operationalState === 'HOLD') {
      return {
        label: t.statusHold,
        color: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-600',
        btnText: t.btnStartCheck,
        needsAction: true,
      };
    }
    if (zone.operationalState === 'VERIFICATION_REQUIRED') {
      return {
        label: t.statusVerifying,
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-600',
        btnText: t.btnContinueCheck,
        needsAction: true,
      };
    }
    if (zone.operationalState === 'AWAITING_APPROVAL') {
      return {
        label: t.statusWaitingApproval,
        color: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-600',
        btnText: t.btnViewStatus,
        needsAction: false,
      };
    }
    if (zone.operationalState === 'INTERRUPTED') {
      return {
        label: t.statusStopped,
        color: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-600',
        btnText: t.btnStartCheck,
        needsAction: true,
      };
    }
    return {
      label: t.statusNormal,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
      btnText: t.btnOperating,
      needsAction: false,
    };
  };

  const priorityZone = zones.find(
    (z) => z.operationalState === 'HOLD' || z.operationalState === 'INTERRUPTED' || z.operationalState === 'VERIFICATION_REQUIRED'
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* SCREEN 1: ZONE LAUNCHPAD (Answer the 3 key questions) */}
      {!isInspecting ? (
        <div className="space-y-6">
          {/* Main Plain Heading */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {t.subtitle}
            </p>

            {/* Quick Answer Banner */}
            <div className="mt-4 p-4 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start space-x-3">
              <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm text-sky-900">
                  {lang === 'ta' ? 'களப் பணியாளருக்கான முக்கிய வழிகாட்டுதல்:' : 'Field Worker Safety Principle:'}
                </span>
                <p className="leading-relaxed">
                  {lang === 'ta'
                    ? 'நீர் நிறுத்தம் ஏற்பட்ட பின் குழாய்களில் சாக்கடை நீர் மற்றும் கிருமி கலந்திருக்கலாம். ஆய்வு செய்து குளோரின் அளவை உறுதி செய்யும் வரை நீர் விநியோகத்தை தொடங்க வேண்டாம்.'
                    : 'When water stops, negative pressure can pull dirty groundwater through pipe cracks. Do not turn water back on until you complete physical flushing and verify safe chlorine disinfectant.'}
                </p>
              </div>
            </div>
          </div>

          {/* Priority Next Action */}
          {priorityZone ? (
            <NextActionCard
              situation={
                lang === 'ta'
                  ? `${priorityZone.name} (${priorityZone.code}) மண்டலத்தில் விநியோக நிறுத்தம் ஏற்பட்டுள்ளது. நீர் விநியோகத்தை தொடங்குவதற்கு முன் கள ஆய்வு அவசியம்.`
                  : `${priorityZone.name} (${priorityZone.code}) distribution line experienced shutoff. Water supply is halted until physical safety verification is completed.`
              }
              safetyStatus={priorityZone.operationalState === 'VERIFICATION_REQUIRED' ? 'CAUTION' : 'HOLD'}
              safetyLabel={
                lang === 'ta'
                  ? (priorityZone.operationalState === 'VERIFICATION_REQUIRED' ? 'சரிபார்ப்பு தேவை' : 'பாதுகாப்பு நிறுத்தம் செயலில்')
                  : (priorityZone.operationalState === 'VERIFICATION_REQUIRED' ? 'FIELD VERIFICATION IN PROGRESS' : 'CRITICAL SAFETY HOLD')
              }
              responsibleRole={lang === 'ta' ? 'கள ஆய்வாளர் (Field Technician)' : 'Certified Field Technician'}
              evidenceNotes={[
                lang === 'ta' ? 'குழாய் பழுது மற்றும் கசிவு ஆய்வு அவசியம்' : 'Physical pipe integrity and joint inspection required',
                lang === 'ta' ? '15 நிமிட முனைய வெளியேற்றம் (Flush) தேவை' : '15-minute terminal scour flushing required',
                lang === 'ta' ? 'குளோரின் அளவு >= 0.20 mg/L இருக்க வேண்டும்' : 'Free chlorine residual must meet >= 0.20 mg/L floor',
              ]}
              nextAction={
                lang === 'ta'
                  ? `மண்டலம் ${priorityZone.code} க்கான ஆய்வு சரிபார்ப்புப் பட்டியலை உடனடியாகத் தொடங்கவும்.`
                  : `Start the physical inspection checklist for ${priorityZone.name}.`
              }
              actionButton={{
                label: lang === 'ta' ? `ஆய்வைத் தொடங்கு (${priorityZone.code})` : `Start Water Check for ${priorityZone.code}`,
                onClick: () => handleStartInspection(priorityZone.id),
                variant: 'primary',
              }}
            />
          ) : (
            <NextActionCard
              situation={
                lang === 'ta'
                  ? 'அனைத்து 5 நீர் விநியோக மண்டலங்களும் சாதாரண அழுத்தத்தில் சுத்தமான குடிநீரை வழங்கி வருகின்றன.'
                  : 'All 5 municipal distribution sectors are operating normally within pressure and safety parameters.'
              }
              safetyStatus="STABLE"
              safetyLabel={lang === 'ta' ? 'விநியோகம் சீரானது' : 'NOMINAL SUPPLY ACTIVE'}
              responsibleRole={lang === 'ta' ? 'வழக்கமான கண்காணிப்பு' : 'Continuous Quality Monitoring'}
              nextAction={
                lang === 'ta'
                  ? 'எந்த அவசர நடவடிக்கையும் தேவையில்லை. அழுத்த கண்காணிப்பைத் தொடரவும்.'
                  : 'No field intervention required. Maintain continuous SCADA pressure monitoring.'
              }
            />
          )}

          {/* Question 1: Which zone needs attention? */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {t.selectZoneHeading}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {zones.length} {lang === 'ta' ? 'மண்டலங்கள்' : 'Distribution Sectors'}
              </span>
            </div>

            <div className="space-y-3">
              {zones.map((zone) => {
                const badge = getZoneStatusBadge(zone);
                const hasEvent = !!zone.activeRestartEventId && events[zone.activeRestartEventId];

                return (
                  <div
                    key={zone.id}
                    className={`p-5 rounded-xl border bg-white transition-all shadow-xs hover:border-slate-300 ${
                      badge.needsAction ? 'border-amber-300/80 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.color}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {zone.code}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {zone.name}
                        </h3>

                        <p className="text-xs text-slate-600 leading-normal max-w-lg">
                          {zone.operationalState === 'HOLD'
                            ? (lang === 'ta'
                                ? 'குழாயில் கசிவு அல்லது குளோரின் பற்றாக்குறை கண்டறியப்பட்டது. ஆய்வு தேவை.'
                                : 'Water pressure dropped below safe limit. Ground water ingress suspected.')
                            : zone.operationalState === 'VERIFICATION_REQUIRED'
                            ? (lang === 'ta'
                                ? 'குழாய் வெளியேற்றம் முடிந்தது; குளோரின் அளவு சோதனை தேவை.'
                                : 'Line flushed; final chlorine disinfectant test needed before release.')
                            : zone.operationalState === 'AWAITING_APPROVAL'
                            ? (lang === 'ta'
                                ? 'அனைத்து சோதனைகளும் முடிந்தது (0.44 mg/L குளோரின்). மேற்பார்வையாளர் ஆய்வு செய்கிறார்.'
                                : 'All field checks completed (0.44 mg/L chlorine). Awaiting supervisor approval.')
                            : (lang === 'ta'
                                ? 'சாதாரண அழுத்தத்தில் சுத்தமான குடிநீர் விநியோகம் நடைபெறுகிறது.'
                                : 'Normal continuous supply. No action required.')}
                        </p>
                      </div>

                      {/* Obvious Primary Action Button (>= 48px touch target) & Secondary Zone Details Link */}
                      <div className="shrink-0 flex flex-col sm:items-end gap-2">
                        {hasEvent ? (
                          <button
                            type="button"
                            onClick={() => handleStartInspection(zone.id)}
                            className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs"
                          >
                            <span>{badge.btnText}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-slate-400 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            {t.btnOperating}
                          </span>
                        )}
                        <Link
                          href={`/zones/${zone.id}`}
                          className="text-xs text-sky-700 hover:text-sky-900 hover:underline font-medium inline-flex items-center gap-1 self-start sm:self-end"
                        >
                          <span>{t.viewZoneDetails}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Link to Supervisor Review */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>{t.supervisorBannerText}</span>
            </div>
            <Link
              href="/supervisor"
              className="text-sky-700 hover:text-sky-900 font-semibold underline underline-offset-2 shrink-0"
            >
              {t.btnGoSupervisor} →
            </Link>
          </div>
        </div>
      ) : (
        /* SCREEN 2: GUIDED MOBILE CHECKLIST (One question at a time) */
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Back link & Sector Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setIsInspecting(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>{t.btnBackToZones}</span>
            </button>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block">
                {currentZone?.name}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentZone?.code}
              </span>
            </div>
          </div>

          {/* Active Assigned Field Directives (Real Incident Tasks) */}
          {activeEvent?.fieldTasks && activeEvent.fieldTasks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowAssignedTasks(!showAssignedTasks)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-sky-700" />
                  <span className="font-bold text-slate-800">{t.assignedTasksHeading}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px]">
                    {activeEvent.fieldTasks.length}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                  <span>{showAssignedTasks ? 'Hide' : 'Show'}</span>
                  {showAssignedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showAssignedTasks && (
                <div className="p-3.5 pt-0 border-t border-slate-200/60 space-y-2 mt-2">
                  <p className="text-[11px] text-slate-500">{t.assignedTasksSubtext}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeEvent.fieldTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-lg border bg-white flex items-start justify-between gap-2 ${
                          task.status === 'COMPLETED' ? 'border-emerald-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 text-xs">{task.title}</div>
                          <div className="text-[11px] text-slate-500 leading-snug">{task.description}</div>
                          {task.measurementsRecorded && (
                            <div className="text-[10px] text-slate-600 font-mono pt-1">
                              {task.measurementsRecorded.chlorineMgL !== undefined && (
                                <span>Chlorine: {task.measurementsRecorded.chlorineMgL} mg/L </span>
                              )}
                              {task.measurementsRecorded.flushingDurationMinutes !== undefined && (
                                <span>Flush: {task.measurementsRecorded.flushingDurationMinutes}m</span>
                              )}
                            </div>
                          )}
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {task.status === 'COMPLETED' ? t.lblStatusCompleted : t.lblStatusPending}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assistant Note Extractor / Copilot Drawer */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-sky-950">
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span>{t.btnCopilotOpen}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCopilot(!showCopilot)}
                className="px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 text-xs font-medium transition-colors shadow-xs"
              >
                {showCopilot ? t.btnCopilotClose : 'Open Assistant'}
              </button>
            </div>

            {showCopilot && (
              <div className="pt-2 border-t border-sky-200 animate-in fade-in duration-150 space-y-2">
                <p className="text-[11px] text-sky-900 leading-relaxed">{t.copilotHelper}</p>
                <FieldReportCopilot
                  activeEventId={activeEvent?.id}
                  activeZoneId={currentZone?.id}
                  onReportCommitted={handleReportCommitted}
                />
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {!submissionResult && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>{t.stepOf(step, 5)}</span>
                <span>{Math.round((step / 5) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-sky-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 1: PIPE LEAK CHECK */}
          {!submissionResult && step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.step1Title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {t.step1Help}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {t.step1Question}
                </p>
              </div>

              {/* Tap Choices (>= 48px height) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setLeakState('YES')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    leakState === 'YES'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        leakState === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1Yes}</div>
                      <div className="text-xs text-slate-500">{t.step1YesSub}</div>
                    </div>
                  </div>
                  {leakState === 'YES' && <span className="text-xs font-bold text-emerald-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLeakState('NO')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    leakState === 'NO'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        leakState === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1No}</div>
                      <div className="text-xs text-slate-500">{t.step1NoSub}</div>
                    </div>
                  </div>
                  {leakState === 'NO' && <span className="text-xs font-bold text-rose-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLeakState('UNABLE')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    leakState === 'UNABLE'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        leakState === 'UNABLE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1Unable}</div>
                      <div className="text-xs text-amber-800">{t.step1UnableSub}</div>
                    </div>
                  </div>
                  {leakState === 'UNABLE' && <span className="text-xs font-bold text-amber-700">✓</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FLUSH HYDRANT */}
          {!submissionResult && step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.step2Title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {t.step2Help}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {t.step2Question}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setFlushState('YES')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    flushState === 'YES'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        flushState === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2Yes}</div>
                      <div className="text-xs text-slate-500">{t.step2YesSub}</div>
                    </div>
                  </div>
                  {flushState === 'YES' && <span className="text-xs font-bold text-emerald-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFlushState('NO')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    flushState === 'NO'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        flushState === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2No}</div>
                      <div className="text-xs text-slate-500">{t.step2NoSub}</div>
                    </div>
                  </div>
                  {flushState === 'NO' && <span className="text-xs font-bold text-rose-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFlushState('UNABLE')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    flushState === 'UNABLE'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        flushState === 'UNABLE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2Unable}</div>
                      <div className="text-xs text-amber-800">{t.step2UnableSub}</div>
                    </div>
                  </div>
                  {flushState === 'UNABLE' && <span className="text-xs font-bold text-amber-700">✓</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DISINFECTANT RESIDUAL */}
          {!submissionResult && step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.step3Title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {t.step3Help}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {t.step3Question}
                </p>
              </div>

              {/* Fast Presets */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setFreeChlorine('0.45')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    freeChlorine === '0.45'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        freeChlorine === '0.45' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step3PresetSafe}</div>
                      <div className="text-xs text-slate-500">{t.step3PresetSafeSub}</div>
                    </div>
                  </div>
                  {freeChlorine === '0.45' && <span className="text-xs font-bold text-emerald-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFreeChlorine('0.06')}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    freeChlorine === '0.06'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        freeChlorine === '0.06' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step3PresetUnsafe}</div>
                      <div className="text-xs text-slate-500">{t.step3PresetUnsafeSub}</div>
                    </div>
                  </div>
                  {freeChlorine === '0.06' && <span className="text-xs font-bold text-rose-700">✓</span>}
                </button>
              </div>

              {/* Custom Number Entry */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.step3CustomLabel}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5.0"
                    value={freeChlorine}
                    onChange={(e) => setFreeChlorine(e.target.value)}
                    className="w-32 bg-white border border-slate-300 rounded-lg p-2.5 text-base font-bold text-slate-900 text-center focus:border-sky-500"
                  />
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      isChlorineSafe
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {isChlorineSafe ? t.step3SafeBadge : t.step3DangerBadge}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PHOTO PROOF */}
          {!submissionResult && step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.step4Title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {t.step4Help}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {t.step4Question}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPhotoAttached(true)}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    photoAttached
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        photoAttached ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step4Yes}</div>
                      <div className="text-xs text-slate-500">{t.step4YesSub}</div>
                    </div>
                  </div>
                  {photoAttached && <span className="text-xs font-bold text-emerald-700">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoAttached(false)}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    !photoAttached
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        !photoAttached ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step4No}</div>
                      <div className="text-xs text-slate-500">{t.step4NoSub}</div>
                    </div>
                  </div>
                  {!photoAttached && <span className="text-xs font-bold text-amber-700">✓</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PLAIN DECISION */}
          {!submissionResult && step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.step5Title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {t.step5Subtitle}
                </p>
              </div>

              {/* Prominent Next Action Decision Callout */}
              <NextActionCard
                situation={
                  allChecksPassed
                    ? (lang === 'ta'
                        ? 'அனைத்து களப் பாதுகாப்பு அளவுகோல்களும் திருப்திகரமாக நிறைவடைந்துள்ளன.'
                        : 'All physical field safety criteria are verified and meet statutory thresholds.')
                    : (lang === 'ta'
                        ? 'ஒன்று அல்லது அதற்கு மேற்பட்ட பாதுகாப்பு சோதனைகள் தோல்வியடைந்தன அல்லது முழுமையடையவில்லை.'
                        : 'One or more physical safety checks failed or are incomplete.')
                }
                safetyStatus={allChecksPassed ? 'PROCEED' : 'HOLD'}
                safetyLabel={allChecksPassed ? t.decisionPassTitle : t.decisionHoldTitle}
                responsibleRole={lang === 'ta' ? 'கள ஆய்வாளர் (Field Technician)' : 'Certified Field Technician'}
                evidenceNotes={[
                  `${t.lblLeak}: ${leakState === 'YES' ? 'Secure' : 'Unsecured / Active hazard'}`,
                  `${t.lblFlush}: ${flushState === 'YES' ? '15-min scour verified' : 'Incomplete'}`,
                  `${t.lblChlorine}: ${freeChlorine} mg/L (${isChlorineSafe ? 'Safe >= 0.20' : 'Unsafe < 0.20'})`,
                  `${t.lblPhoto}: ${photoAttached ? 'Attached' : 'Missing'}`,
                ]}
                nextAction={allChecksPassed ? t.nextActionPass : t.nextActionHold}
                actionButton={{
                  label: submitting ? t.btnSubmitting : t.btnSubmit,
                  onClick: handleSubmit,
                  variant: allChecksPassed ? 'teal' : 'secondary',
                  disabled: submitting,
                }}
              />

              {/* Answers Summary Table */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 flex items-center justify-between font-semibold text-slate-700">
                  <span>{t.lblLeak}</span>
                  <span className={leakState === 'YES' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {leakState === 'YES' ? '✓ Repaired & Secure' : leakState === 'NO' ? '✗ Leaking' : '⚠ Unable to check'}
                  </span>
                </div>
                <div className="p-3 bg-white flex items-center justify-between font-semibold text-slate-700">
                  <span>{t.lblFlush}</span>
                  <span className={flushState === 'YES' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {flushState === 'YES' ? '✓ Flushed 15 Minutes' : flushState === 'NO' ? '✗ Not flushed' : '⚠ Unable to flush'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 flex items-center justify-between font-semibold text-slate-700">
                  <span>{t.lblChlorine}</span>
                  <span className={isChlorineSafe ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {isChlorineSafe ? `✓ ${freeChlorine} mg/L (Safe)` : `✗ ${freeChlorine} mg/L (Unsafe < 0.20)`}
                  </span>
                </div>
                <div className="p-3 bg-white flex items-center justify-between font-semibold text-slate-700">
                  <span>{t.lblPhoto}</span>
                  <span className={photoAttached ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {photoAttached ? '✓ Attached' : '✗ Missing'}
                  </span>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.lblNotes}
                </label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-sky-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? t.btnSubmitting : t.btnSubmit}</span>
              </button>
            </div>
          )}

          {/* SUBMISSION RESULT FEEDBACK */}
          {submissionResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div
                className={`p-6 rounded-xl border text-center space-y-3 ${
                  submissionResult.status === 'PASSED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-xl bg-white shadow-xs">
                  {submissionResult.status === 'PASSED' ? (
                    <Check className="w-6 h-6 text-emerald-700" />
                  ) : (
                    <AlertOctagon className="w-6 h-6 text-rose-700" />
                  )}
                </div>

                <h3 className="text-lg font-bold">
                  {submissionResult.title}
                </h3>

                <p className="text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                  {submissionResult.description}
                </p>

                <div className="p-3 bg-white/80 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200/60 max-w-md mx-auto">
                  {submissionResult.nextAction}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsInspecting(false)}
                  className="w-full sm:w-1/2 min-h-[48px] py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                >
                  {t.btnBackToZones}
                </button>
                <Link
                  href="/supervisor"
                  className="w-full sm:w-1/2 min-h-[48px] py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 text-center"
                >
                  <span>{t.btnGoSupervisor}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Stepper Navigation (Previous / Next) */}
          {!submissionResult && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.btnBack}</span>
                </button>
              ) : (
                <div />
              )}

              {step < 5 && (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="min-h-[44px] px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <span>{t.btnNext}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
