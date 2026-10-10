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
  Gauge,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Languages,
  ShieldCheck,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import { WaterZone, RestartEvent, FieldTask, VerificationSubmission } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';

interface FieldWorkerModeProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onVerificationSubmitted?: (
    submission: VerificationSubmission
  ) => Promise<{ success: boolean; outcome?: string; reasons?: string[] } | void>;
  onTaskUpdated?: (
    eventId: string,
    taskId: string,
    update: {
      status?: string;
      measurementsRecorded?: Record<string, number>;
      fieldNotes?: string;
      photoUrl?: string;
    }
  ) => Promise<void>;
}

// Dual-Language Dictionary (English & Authentic Tamil)
const TRANSLATIONS = {
  en: {
    appTitle: 'Field Safety Verification Checklist',
    appSubtitle: 'Step-by-step water recharge safety protocol for field crews',
    switchLang: 'தமிழ்',
    selectZone: 'Selected Water Supply Sector',
    noEventNotice: 'This sector is currently operating normally. No restart verification required.',
    stepOf: (cur: number, total: number) => `Check ${cur} of ${total}`,
    next: 'Next Check',
    previous: 'Previous',
    reviewAndSubmit: 'Review & Send to Supervisor',
    presetPass: 'Preset: Safe Pass (0.45 mg/L)',
    presetFail: 'Preset: Critical Fail (0.06 mg/L)',
    
    // Step 1: Pipe Leak
    step1Title: 'Check 1: Physical Pipe Leak Check',
    step1Question: 'Did you inspect the pipe repair and joints? Is the pipe secure with no leaks?',
    step1Subtitle: 'Negative pressure during shutoff can pull dirty groundwater through open pipe leaks.',
    step1Yes: 'YES — LEAK IS SECURED & SEALED',
    step1No: 'NO — ACTIVE LEAK DETECTED',
    step1Unable: 'UNABLE TO CHECK / NOT ACCESSIBLE',
    step1UnableWarning: 'Leaving this unchecked will place the water supply on HOLD for safety.',

    // Step 2: Hydrant Flush
    step2Title: 'Check 2: Flush Hydrant for 15 Minutes',
    step2Question: 'Did you open the terminal hydrant and flush water for at least 15 minutes?',
    step2Subtitle: 'Scour flushing purges stagnant biofilm, rust, and dirt that settled in pipes during shutdown.',
    step2Yes: 'YES — FLUSHED 15 MIN (WATER RUNNING CLEAR)',
    step2No: 'NO — FLUSHING NOT COMPLETED',
    step2Unable: 'UNABLE TO FLUSH / NO DRAINAGE',

    // Step 3: Disinfectant Test
    step3Title: 'Check 3: Test Water Disinfectant (Chlorine)',
    step3Question: 'Test the water with your field test strip or colorimeter. Is chlorine safe?',
    step3Subtitle: `Water must have at least ${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L of disinfectant to kill dangerous bacteria.`,
    step3PresetSafe: 'SAFE LEVEL: 0.45 mg/L (Recommended Floor Met)',
    step3PresetUnsafe: 'CRITICAL LOW: 0.06 mg/L (Depleted — Bacteria Risk)',
    step3CustomInput: 'Or enter measured reading manually (mg/L):',
    step3StatusSafe: 'SAFE — DISINFECTANT FLOOR MET (>= 0.20 mg/L)',
    step3StatusDanger: 'DANGER — BELOW SAFETY LIMIT (< 0.20 mg/L)',

    // Step 4: Photo Proof
    step4Title: 'Check 4: Photo Proof of Clean Sample',
    step4Question: 'Take or attach a photo of the clear water sample or test vial.',
    step4Subtitle: 'Provides photographic chain of custody to protect consumer health.',
    step4Yes: 'PHOTO ATTACHED (CLEAR SAMPLE VERIFIED)',
    step4No: 'NO PHOTO ATTACHED',

    // Step 5: Summary
    step5Title: 'Step 5: Review & Submit to Supervisor',
    step5Subtitle: 'Verify all answers below before sending this safety report to the operations supervisor.',
    step5LeakStatus: 'Pipe Leak Secured:',
    step5FlushStatus: '15-Min Scour Flush:',
    step5ChlorineStatus: 'Disinfectant Residual:',
    step5PhotoStatus: 'Photo Proof Attached:',
    step5HoldNotice: 'NOTICE: One or more checks are incomplete or failed. Submitting will enforce an immediate operational HOLD.',
    step5PassNotice: 'READY: All checks meet demonstration safety floors. Submitting will advance to Supervisor Approval.',
    submitButton: 'SUBMIT REPORT TO SUPERVISOR',
    submittingButton: 'Submitting Safety Report...',
  },
  ta: {
    appTitle: 'களப் பாதுகாப்பு சரிபார்ப்புப் பட்டியல்',
    appSubtitle: 'குடிநீர் விநியோகத்தை மீண்டும் தொடங்குவதற்கான படிநிலைப் பாதுகாப்பு நெறிமுறை',
    switchLang: 'English',
    selectZone: 'தேர்ந்தெடுக்கப்பட்ட விநியோக மண்டலம்',
    noEventNotice: 'இந்த மண்டலம் சாதாரணமாக இயங்குகிறது. மறுதொடக்கம் சரிபார்ப்பு தேவையில்லை.',
    stepOf: (cur: number, total: number) => `சரிபார்ப்பு ${cur} / ${total}`,
    next: 'அடுத்த சரிபார்ப்பு',
    previous: 'முந்தையது',
    reviewAndSubmit: 'சரிபார்த்து மேற்பார்வையாளருக்கு அனுப்பவும்',
    presetPass: 'மாதிரி: பாதுகாப்பானது (0.45 mg/L)',
    presetFail: 'மாதிரி: ஆபத்தானது (0.06 mg/L)',

    // Step 1: Pipe Leak
    step1Title: 'படி 1: குழாய் கசிவு சரிபார்ப்பு',
    step1Question: 'குழாய் பழுது மற்றும் இணைப்புகளை சரிபார்த்தீர்களா? கசிவு ஏதும் இல்லாமல் பாதுகாப்பாக உள்ளதா?',
    step1Subtitle: 'நீர் அழுத்தம் குறையும் போது சாக்கடை நீர் குழாய்களுக்குள் நுழைய வாய்ப்புள்ளது.',
    step1Yes: 'ஆம் — கசிவு சரிசெய்யப்பட்டது & பாதுகாப்பானது',
    step1No: 'இல்லை — குழாயில் கசிவு உள்ளது',
    step1Unable: 'சரிபார்க்க முடியவில்லை / அணுக முடியவில்லை',
    step1UnableWarning: 'இதை சரிபார்க்காவிட்டால், பாதுகாப்பு கருதி நீர் விநியோகம் நிறுத்தி வைக்கப்படும்.',

    // Step 2: Hydrant Flush
    step2Title: 'படி 2: 15 நிமிட தண்ணீர் வெளியேற்றம்',
    step2Question: 'குழாயில் தேங்கிய அழுக்குகளை வெளியேற்ற 15 நிமிடங்கள் தண்ணீரை வெளியேற்றினீர்களா?',
    step2Subtitle: 'தேங்கிய வண்டல் மற்றும் பாக்டீரியாவை அகற்ற இந்த வெளியேற்றம் அவசியம்.',
    step2Yes: 'ஆம் — 15 நிமிடங்கள் வெளியேற்றப்பட்டது (சுத்தமான நீர் வருகிறது)',
    step2No: 'இல்லை — வெளியேற்றப்படவில்லை',
    step2Unable: 'வெளியேற்ற முடியவில்லை',

    // Step 3: Disinfectant Test
    step3Title: 'படி 3: குளோரின் அளவு சோதனை',
    step3Question: 'தண்ணீரில் குளோரின் அளவை சோதிக்கவும். குடிப்பதற்கு பாதுகாப்பாக உள்ளதா?',
    step3Subtitle: `நோய் கிருமிகள் அழிய குறைந்தது ${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L குளோரின் இருக்க வேண்டும்.`,
    step3PresetSafe: 'பாதுகாப்பானது: 0.45 mg/L (பாதுகாப்பு அளவு பூர்த்தி)',
    step3PresetUnsafe: 'ஆபத்தானது: 0.06 mg/L (குளோரின் பற்றாக்குறை)',
    step3CustomInput: 'அல்லது குளோரின் அளவை உள்ளிடவும் (mg/L):',
    step3StatusSafe: 'பாதுகாப்பானது — தகுதியான அளவு (>= 0.20 mg/L)',
    step3StatusDanger: 'ஆபத்து — அனுமதிக்கப்பட்ட அளவுக்கு கீழ் (< 0.20 mg/L)',

    // Step 4: Photo Proof
    step4Title: 'படி 4: புகைப்பட ஆதாரம்',
    step4Question: 'சுத்தமான தண்ணீர் அல்லது குளோரின் சோதனைக் குழாயின் புகைப்படத்தை எடுக்கவும்.',
    step4Subtitle: 'பொதுமக்கள் பாதுகாப்பிற்காக புகைப்பட ஆதாரம் சேமிக்கப்படுகிறது.',
    step4Yes: 'புகைப்படம் இணைக்கப்பட்டது (சுத்தமான மாதிரி உறுதி செய்யப்பட்டது)',
    step4No: 'புகைப்படம் இணைக்கப்படவில்லை',

    // Step 5: Summary
    step5Title: 'படி 5: சரிபார்த்து சமர்ப்பிக்கவும்',
    step5Subtitle: 'மேற்பார்வையாளருக்கு அனுப்புவதற்கு முன் உங்கள் பதில்களை சரிபார்க்கவும்.',
    step5LeakStatus: 'குழாய் கசிவு நிலை:',
    step5FlushStatus: '15 நிமிட தண்ணீர் வெளியேற்றம்:',
    step5ChlorineStatus: 'குளோரின் அளவு:',
    step5PhotoStatus: 'புகைப்பட ஆதாரம்:',
    step5HoldNotice: 'எச்சரிக்கை: ஏதேனும் சோதனை தோல்வியுற்றால் நீர் விநியோகம் நிறுத்தி வைக்கப்படும்.',
    step5PassNotice: 'தயார்: அனைத்து சோதனைகளும் பாதுகாப்பு விதிகளுக்கு உட்பட்டுள்ளன.',
    submitButton: 'மேற்பார்வையாளருக்கு சமர்ப்பிக்கவும்',
    submittingButton: 'சமர்ப்பிக்கப்படுகிறது...',
  },
};

export function FieldWorkerMode({
  zones,
  events,
  onVerificationSubmitted,
  onTaskUpdated,
}: FieldWorkerModeProps) {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const t = TRANSLATIONS[lang];

  // Candidates zones that have active restart events
  const candidateZones = zones.filter((z) => z.activeRestartEventId && events[z.activeRestartEventId]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    candidateZones[0]?.id || zones[0]?.id || 'zone-1'
  );

  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const activeEvent = currentZone?.activeRestartEventId
    ? events[currentZone.activeRestartEventId]
    : undefined;

  // Step Wizard State (1 to 5)
  const [step, setStep] = useState<number>(1);

  // Field Verification State
  const [leakState, setLeakState] = useState<'YES' | 'NO' | 'UNABLE'>('YES');
  const [flushState, setFlushState] = useState<'YES' | 'NO' | 'UNABLE'>('YES');
  const [freeChlorine, setFreeChlorine] = useState<string>('0.45');
  const [photoAttached, setPhotoAttached] = useState<boolean>(true);
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    'Hydrant scour flush complete. Free chlorine confirmed >= 0.20 mg/L.'
  );

  // Observed secondary numbers (maintained for contract compatibility)
  const [observedPressure, setObservedPressure] = useState<string>('30.0');
  const [turbidity, setTurbidity] = useState<string>('0.35');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    messages: string[];
  } | null>(null);

  // Quick Preset Actions
  const applyPresetPassing = () => {
    setLeakState('YES');
    setFlushState('YES');
    setFreeChlorine('0.45');
    setObservedPressure('30.0');
    setTurbidity('0.32');
    setPhotoAttached(true);
    setTechnicianNotes('All safety parameters passed: Line flushed clean, chlorine verified >= 0.20 mg/L.');
    setFeedback(null);
  };

  const applyPresetFailing = () => {
    setLeakState('NO');
    setFlushState('NO');
    setFreeChlorine('0.06'); // Critical fail below 0.20 mg/L
    setObservedPressure('18.0');
    setTurbidity('1.40');
    setPhotoAttached(false);
    setTechnicianNotes('Failing safety check: Chlorine depleted below 0.20 mg/L limit. Re-flushing required.');
    setFeedback(null);
  };

  const chlorineValue = parseFloat(freeChlorine) || 0;
  const isChlorineSafe = chlorineValue >= DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;

  // Overall check summary
  const isPassingSummary =
    leakState === 'YES' &&
    flushState === 'YES' &&
    isChlorineSafe &&
    photoAttached;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    setSubmitting(true);
    setFeedback(null);

    const submission: VerificationSubmission = {
      eventId: activeEvent.id,
      submittedBy: 'Tech A. Rivera (Field ID #2041)',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: chlorineValue,
      turbidityNtu: parseFloat(turbidity) || 0.35,
      observedPressurePsi: parseFloat(observedPressure) || 30.0,
      flushingCompleted: flushState === 'YES',
      leakInspectedAndSecured: leakState === 'YES',
      photoProofAttached: photoAttached,
      notes: technicianNotes,
    };

    try {
      if (onVerificationSubmitted) {
        const result = await onVerificationSubmitted(submission);
        if (result && result.outcome === 'FAILED') {
          setFeedback({
            type: 'warning',
            title: lang === 'ta' ? 'பாதுகாப்பு நிறுத்தம் (HOLD) விதிக்கப்பட்டது' : 'OPERATIONAL HOLD ENFORCED',
            messages:
              result.reasons || [
                lang === 'ta'
                  ? 'பாதுகாப்பு விதிகள் பூர்த்தியாகாததால் நீர் விநியோகம் நிறுத்தி வைக்கப்பட்டது.'
                  : 'Safety criteria not met. Water supply kept on HOLD to protect public health.',
              ],
          });
        } else {
          setFeedback({
            type: 'success',
            title:
              lang === 'ta'
                ? 'சரிபார்ப்பு முடிந்தது — மேற்பார்வையாளர் ஒப்புதலுக்கு அனுப்பப்பட்டது'
                : 'VERIFICATION PASSED — SENT TO SUPERVISOR',
            messages: [
              lang === 'ta'
                ? 'அனைத்து கள சோதனைகளும் பாதுகாப்பு விதிகளுக்கு உட்பட்டுள்ளன.'
                : 'All field safety checks passed demonstration requirements.',
              lang === 'ta'
                ? 'மேற்பார்வையாளர் ஒப்புதல் அளித்த பிறகு நீர் விநியோகம் தொடங்கும்.'
                : 'Supervisor review is required before pumps can recharge.',
            ],
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setFeedback({
        type: 'error',
        title: 'Error',
        messages: [msg],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                  {t.appTitle}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Language Toggle & Demo Presets */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors"
              title="Toggle language / மொழியை மாற்றவும்"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{t.switchLang}</span>
            </button>
            <button
              type="button"
              onClick={applyPresetPassing}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold transition-colors hidden sm:inline-block"
              title="Auto-fill passing values"
            >
              Pass (0.45)
            </button>
            <button
              type="button"
              onClick={applyPresetFailing}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-bold transition-colors hidden sm:inline-block"
              title="Auto-fill failing values"
            >
              Fail (0.06)
            </button>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-slate-400 font-mono text-xs uppercase mb-1.5 font-semibold">
            {t.selectZone}:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {zones.map((z) => {
              const isSelected = z.id === selectedZoneId;
              const hasEvent = !!(z.activeRestartEventId && events[z.activeRestartEventId]);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setSelectedZoneId(z.id);
                    setFeedback(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-white ring-2 ring-cyan-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{z.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        hasEvent
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {z.operationalState}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Code: {z.code} • {hasEvent ? 'Field Checks Required' : 'Nominal'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeEvent ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
          {/* Progress Bar & Step Tracker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {t.stepOf(step, 5)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {step === 5 ? (lang === 'ta' ? 'இறுதி சரிபார்ப்பு' : 'Final Review') : `${Math.round((step / 5) * 100)}%`}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: PIPE LEAK CHECK */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </span>
                  <span>{t.step1Title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.step1Subtitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {t.step1Question}
                </p>
              </div>

              {/* Big Touch Target Action Buttons (>= 56px height) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setLeakState('YES')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    leakState === 'YES'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        leakState === 'YES' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1Yes}</div>
                      <div className="text-xs text-slate-400">Repair sleeve or clamp secured</div>
                    </div>
                  </div>
                  {leakState === 'YES' && <span className="text-xs text-emerald-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLeakState('NO')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    leakState === 'NO'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        leakState === 'NO' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1No}</div>
                      <div className="text-xs text-slate-400">Groundwater ingress hazard active</div>
                    </div>
                  </div>
                  {leakState === 'NO' && <span className="text-xs text-rose-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLeakState('UNABLE')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    leakState === 'UNABLE'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        leakState === 'UNABLE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step1Unable}</div>
                      <div className="text-xs text-amber-400/90">{t.step1UnableWarning}</div>
                    </div>
                  </div>
                  {leakState === 'UNABLE' && <span className="text-xs text-amber-400 font-mono font-bold">SELECTED</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: HYDRANT FLUSH */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    2
                  </span>
                  <span>{t.step2Title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.step2Subtitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {t.step2Question}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setFlushState('YES')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    flushState === 'YES'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        flushState === 'YES' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2Yes}</div>
                      <div className="text-xs text-slate-400">Biofilm and rust purged from main feeder</div>
                    </div>
                  </div>
                  {flushState === 'YES' && <span className="text-xs text-emerald-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFlushState('NO')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    flushState === 'NO'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        flushState === 'NO' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2No}</div>
                      <div className="text-xs text-slate-400">Unpurged sediment remains in distribution lines</div>
                    </div>
                  </div>
                  {flushState === 'NO' && <span className="text-xs text-rose-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFlushState('UNABLE')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    flushState === 'UNABLE'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        flushState === 'UNABLE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step2Unable}</div>
                      <div className="text-xs text-amber-400/90">{t.step1UnableWarning}</div>
                    </div>
                  </div>
                  {flushState === 'UNABLE' && <span className="text-xs text-amber-400 font-mono font-bold">SELECTED</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DISINFECTANT / CHLORINE TEST */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    3
                  </span>
                  <span>{t.step3Title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.step3Subtitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {t.step3Question}
                </p>
              </div>

              {/* Prominent One-Tap Presets */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setFreeChlorine('0.45')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    freeChlorine === '0.45'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        freeChlorine === '0.45' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step3PresetSafe}</div>
                      <div className="text-xs text-slate-400">Protects against coliform & bacterial ingress</div>
                    </div>
                  </div>
                  {freeChlorine === '0.45' && <span className="text-xs text-emerald-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setFreeChlorine('0.06')}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    freeChlorine === '0.06'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        freeChlorine === '0.06' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step3PresetUnsafe}</div>
                      <div className="text-xs text-slate-400">Will trigger operational safety HOLD</div>
                    </div>
                  </div>
                  {freeChlorine === '0.06' && <span className="text-xs text-rose-400 font-mono font-bold">SELECTED</span>}
                </button>
              </div>

              {/* Custom Value Entry */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  {t.step3CustomInput}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5.0"
                    value={freeChlorine}
                    onChange={(e) => setFreeChlorine(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-lg font-bold font-mono text-white text-center focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex-1">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold font-mono border ${
                        isChlorineSafe
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {isChlorineSafe ? t.step3StatusSafe : t.step3StatusDanger}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PHOTO PROOF */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    4
                  </span>
                  <span>{t.step4Title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.step4Subtitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {t.step4Question}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPhotoAttached(true)}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    photoAttached
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        photoAttached ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step4Yes}</div>
                      <div className="text-xs text-slate-400">Encrypted visual proof attached to record</div>
                    </div>
                  </div>
                  {photoAttached && <span className="text-xs text-emerald-400 font-mono font-bold">SELECTED</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoAttached(false)}
                  className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between transition-all ${
                    !photoAttached
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        !photoAttached ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.step4No}</div>
                      <div className="text-xs text-amber-400/90">Chain of custody will show missing photograph</div>
                    </div>
                  </div>
                  {!photoAttached && <span className="text-xs text-amber-400 font-mono font-bold">SELECTED</span>}
                </button>
              </div>

              {/* Photo Preview Simulation */}
              {photoAttached && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
                    <Droplet className="w-6 h-6" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">hydrant_discharge_sample_2041.jpg</div>
                    <div className="text-slate-400 text-[11px]">Turbidity: 0.35 NTU • Timestamp: Just now</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    5
                  </span>
                  <span>{t.step5Title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.step5Subtitle}
                </p>
              </div>

              {/* Status Outcome Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  isPassingSummary
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800 text-amber-200'
                }`}
              >
                {isPassingSummary ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {isPassingSummary ? t.step5PassNotice : t.step5HoldNotice}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {isPassingSummary
                      ? 'Decision engine will allow the supervisor to review and authorize water release.'
                      : 'Missing or failed checks prevent water release to protect households from contamination.'}
                  </div>
                </div>
              </div>

              {/* Summary Cards of Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">{t.step5LeakStatus}</span>
                  <div className="flex items-center space-x-2 font-bold">
                    {leakState === 'YES' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Fixed & Secure
                      </span>
                    ) : leakState === 'NO' ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <X className="w-4 h-4" /> Active Leak Detected
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" /> Unable to Check
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">{t.step5FlushStatus}</span>
                  <div className="flex items-center space-x-2 font-bold">
                    {flushState === 'YES' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Flushed 15 Minutes
                      </span>
                    ) : flushState === 'NO' ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <X className="w-4 h-4" /> Not Completed
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" /> Unable to Flush
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">{t.step5ChlorineStatus}</span>
                  <div className="flex items-center space-x-2 font-bold">
                    {isChlorineSafe ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> {freeChlorine} mg/L (Safe)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <X className="w-4 h-4" /> {freeChlorine} mg/L (Depleted &lt; 0.20)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">{t.step5PhotoStatus}</span>
                  <div className="flex items-center space-x-2 font-bold">
                    {photoAttached ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Attached
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <X className="w-4 h-4" /> Not Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technician Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Field Notes:
                </label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Feedback Alert if submitted */}
              {feedback && (
                <div
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : feedback.type === 'warning'
                      ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-amber-400" />
                    )}
                    <span>{feedback.title}</span>
                  </div>
                  <ul className="text-xs space-y-1 pl-5 list-disc opacity-90">
                    {feedback.messages.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit Button (>= 56px touch target) */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[56px] py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center space-x-2 shadow-xl shadow-cyan-950/30 disabled:text-slate-500"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? t.submittingButton : t.submitButton}</span>
              </button>
            </div>
          )}

          {/* Stepper Navigation Buttons (Prev / Next) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-[48px] px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.previous}</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="min-h-[48px] px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors flex items-center space-x-2 shadow-lg"
              >
                <span>{t.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-xs text-slate-400 space-y-3">
          <Info className="w-10 h-10 text-cyan-400 mx-auto" />
          <div className="text-sm font-bold text-slate-200">
            {lang === 'ta' ? 'இந்த மண்டலத்தில் செயலில் உள்ள நிகழ்வு ஏதுமில்லை' : 'No Active Restart Event in Selected Zone'}
          </div>
          <p className="max-w-md mx-auto">{t.noEventNotice}</p>
        </div>
      )}
    </div>
  );
}
