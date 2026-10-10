import React, { useState } from 'react';
import type { OnboardingData, CareerLevel, Budget } from '../types';
import { MapPin, Clock, Target, Zap, BookOpen, DollarSign, ChevronRight, Plus, X, Sparkles } from 'lucide-react';

interface Props {
  onComplete: (data: OnboardingData) => void;
  isLoading?: boolean;
}

const LEVEL_OPTIONS: { value: CareerLevel; label: string; desc: string; emoji: string }[] = [
  { value: 'complete_beginner', label: 'Complete Beginner', desc: 'No experience at all', emoji: '🌱' },
  { value: 'some_experience',   label: 'Some Experience',   desc: 'Dabbled or self-studied', emoji: '📚' },
  { value: 'intermediate',      label: 'Intermediate',      desc: 'Some structured learning or work', emoji: '⚡' },
  { value: 'advanced',          label: 'Advanced',           desc: 'Solid foundation, want to specialise', emoji: '🚀' },
];

const BUDGET_OPTIONS: { value: Budget; label: string; desc: string; emoji: string }[] = [
  { value: 'free',   label: 'Free Only',        desc: 'No paid resources',  emoji: '🆓' },
  { value: 'low',    label: 'Budget-Friendly',   desc: 'Up to ~$50',         emoji: '💰' },
  { value: 'medium', label: 'Moderate',          desc: '$50 – $500',         emoji: '💳' },
  { value: 'high',   label: 'Investment-Ready',  desc: '$500+',              emoji: '🏆' },
];

const PREF_OPTIONS = [
  'Video tutorials', 'Reading / articles', 'Hands-on projects',
  'Interactive exercises', 'Bootcamp-style', 'Self-paced', 'Community learning',
];

const STEP_META = [
  { label: 'Your Goal',   hint: 'Occupation & level'   },
  { label: 'Background',  hint: 'Skills & schedule'    },
  { label: 'Preferences', hint: 'Style & budget'       },
];

/* ─────────────────────────────────────────────────────────
   Reusable sub-components
───────────────────────────────────────────────────────── */

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label
      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2"
      style={{ color: 'var(--text-muted)' }}
    >
      {icon}
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */

export function OnboardingForm({ onComplete, isLoading }: Props) {
  const [step, setStep]               = useState(1);
  const [occupation, setOccupation]   = useState('');
  const [level, setLevel]             = useState<CareerLevel>('complete_beginner');
  const [knownSkills, setKnownSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput]   = useState('');
  const [hoursPerWeek, setHoursPerWeek]   = useState(10);
  const [targetMonths, setTargetMonths]   = useState(6);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budget, setBudget]           = useState<Budget>('free');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !knownSkills.includes(s)) {
      setKnownSkills(prev => [...prev, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setKnownSkills(prev => prev.filter(s => s !== skill));

  const togglePref = (p: string) =>
    setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSubmit = () => {
    onComplete({
      occupation: occupation.trim(),
      current_level: level,
      known_skills: knownSkills,
      hours_per_week: hoursPerWeek,
      target_months: targetMonths,
      learning_preferences: preferences,
      budget,
    });
  };

  const canProceed = step === 1 ? occupation.trim().length >= 2 : true;

  /* ── Shared input style helpers ── */
  const inputBase: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-14 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Centred container, max-width 860px ── */}
      <div className="relative w-full fade-in" style={{ maxWidth: 860 }}>

        {/* ── Brand header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-5">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                width: 52, height: 52,
                boxShadow: '0 0 32px rgba(99,102,241,0.45)',
              }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}
            >
              Reverse Career Roadmapper
            </h1>
          </div>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Tell us your goal. We'll build a personalised, AI-powered learning path to get you there.
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center gap-0 mb-8 select-none">
          {STEP_META.map((meta, idx) => {
            const s = idx + 1;
            const active  = s === step;
            const done    = s < step;
            const pending = s > step;
            return (
              <React.Fragment key={s}>
                {/* Step bubble + label */}
                <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 88 }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                    style={{
                      background: done
                        ? '#10b981'
                        : active
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'var(--bg-elevated)',
                      color: pending ? 'var(--text-muted)' : 'white',
                      boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.3)' : 'none',
                      border: pending ? '2px solid var(--border)' : 'none',
                    }}
                  >
                    {done ? '✓' : s}
                  </div>
                  <div className="text-center" style={{ lineHeight: 1.3 }}>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {meta.label}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {meta.hint}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                {s < 3 && (
                  <div
                    className="flex-1 h-0.5 mb-5 rounded-full transition-all duration-500"
                    style={{
                      background: s < step ? '#6366f1' : 'var(--border)',
                      maxWidth: 80,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl border"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            padding: '2.5rem',
            boxShadow: '0 4px 40px rgba(0,0,0,0.35)',
          }}
        >
          {/* ════════ STEP 1 ════════ */}
          {step === 1 && (
            <div className="fade-in">
              <SectionHeading
                title="What career do you want to pursue?"
                subtitle="Enter any occupation — software engineer, nurse, chef, accountant, graphic designer, architect…"
              />

              {/* Occupation input */}
              <div className="mb-7">
                <FieldLabel icon={<Target className="w-3.5 h-3.5" />}>
                  Target Occupation
                </FieldLabel>
                <input
                  id="occupation-input"
                  type="text"
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="e.g. Data Scientist, UX Designer, Physical Therapist…"
                  autoFocus
                  className="w-full rounded-xl border outline-none transition-all text-base"
                  style={{
                    ...inputBase,
                    padding: '14px 18px',
                    fontSize: '1rem',
                    letterSpacing: '0.01em',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.18)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow   = 'none';
                  }}
                  onKeyDown={e => e.key === 'Enter' && canProceed && setStep(2)}
                />
                {occupation.trim().length > 0 && occupation.trim().length < 2 && (
                  <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>
                    Please enter at least 2 characters.
                  </p>
                )}
              </div>

              {/* Experience level */}
              <div>
                <FieldLabel icon={<Zap className="w-3.5 h-3.5" />}>
                  Current Experience Level
                </FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {LEVEL_OPTIONS.map(opt => {
                    const selected = level === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setLevel(opt.value)}
                        className="text-left rounded-xl border transition-all duration-200"
                        style={{
                          padding: '14px 16px',
                          background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                          borderColor: selected ? '#6366f1' : 'var(--border)',
                          borderWidth: selected ? 2 : 1,
                          boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                          outline: 'none',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg leading-none">{opt.emoji}</span>
                          <span
                            className="font-semibold text-sm"
                            style={{ color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                          >
                            {opt.label}
                          </span>
                          {selected && (
                            <span
                              className="ml-auto w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: '#6366f1', color: 'white' }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs pl-7" style={{ color: 'var(--text-muted)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 2 ════════ */}
          {step === 2 && (
            <div className="fade-in">
              <SectionHeading
                title="What do you already know?"
                subtitle="We'll skip skills you've already mastered so the roadmap starts where you are."
              />

              {/* Known skills */}
              <div className="mb-7">
                <FieldLabel icon={<BookOpen className="w-3.5 h-3.5" />}>
                  Known Skills&nbsp;<span className="normal-case font-normal">(optional)</span>
                </FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    placeholder="Type a skill and press Enter or +"
                    className="flex-1 rounded-xl border outline-none text-sm transition-all"
                    style={{ ...inputBase, padding: '11px 16px' }}
                    onFocus={e => {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.18)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.boxShadow   = 'none';
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 rounded-xl flex items-center gap-1 text-sm font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', minWidth: 44 }}
                    title="Add skill"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {knownSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {knownSkills.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(99,102,241,0.3)',
                        }}
                      >
                        {s}
                        <button
                          onClick={() => removeSkill(s)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                          title={`Remove ${s}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hours + timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <FieldLabel icon={<Clock className="w-3.5 h-3.5" />}>
                    Hours per week&ensp;
                    <span className="text-sm font-bold normal-case" style={{ color: '#6366f1' }}>
                      {hoursPerWeek}h
                    </span>
                  </FieldLabel>
                  <input
                    type="range" min={1} max={60} value={hoursPerWeek}
                    onChange={e => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-500 mt-1"
                  />
                  <div className="flex justify-between text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>1h</span><span>60h</span>
                  </div>
                </div>
                <div>
                  <FieldLabel icon={<Target className="w-3.5 h-3.5" />}>
                    Target timeline&ensp;
                    <span className="text-sm font-bold normal-case" style={{ color: '#6366f1' }}>
                      {targetMonths} month{targetMonths !== 1 ? 's' : ''}
                    </span>
                  </FieldLabel>
                  <input
                    type="range" min={1} max={24} value={targetMonths}
                    onChange={e => setTargetMonths(Number(e.target.value))}
                    className="w-full accent-indigo-500 mt-1"
                  />
                  <div className="flex justify-between text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>1 month</span><span>2 years</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 3 ════════ */}
          {step === 3 && (
            <div className="fade-in">
              <SectionHeading
                title="How do you learn best?"
                subtitle="We'll tailor resources and milestones to match your style and budget."
              />

              {/* Learning preferences */}
              <div className="mb-7">
                <FieldLabel icon={<BookOpen className="w-3.5 h-3.5" />}>
                  Learning Preferences&nbsp;<span className="normal-case font-normal">(pick any)</span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PREF_OPTIONS.map(p => {
                    const on = preferences.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePref(p)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border"
                        style={{
                          background:   on ? 'rgba(99,102,241,0.18)' : 'var(--bg-elevated)',
                          borderColor:  on ? '#6366f1' : 'var(--border)',
                          color:        on ? '#a5b4fc' : 'var(--text-secondary)',
                          borderWidth:  on ? 1.5 : 1,
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div>
                <FieldLabel icon={<DollarSign className="w-3.5 h-3.5" />}>
                  Learning Budget
                </FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {BUDGET_OPTIONS.map(opt => {
                    const selected = budget === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setBudget(opt.value)}
                        className="text-left rounded-xl border transition-all duration-200"
                        style={{
                          padding: '14px 16px',
                          background:   selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                          borderColor:  selected ? '#6366f1' : 'var(--border)',
                          borderWidth:  selected ? 2 : 1,
                          boxShadow:    selected ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg leading-none">{opt.emoji}</span>
                          <span
                            className="font-semibold text-sm"
                            style={{ color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                          >
                            {opt.label}
                          </span>
                          {selected && (
                            <span
                              className="ml-auto w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: '#6366f1', color: 'white' }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs pl-7" style={{ color: 'var(--text-muted)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation row ── */}
          <div
            className="flex items-center justify-between mt-10 pt-6"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Back */}
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                opacity: step === 1 ? 0 : 1,
                pointerEvents: step === 1 ? 'none' : 'auto',
              }}
            >
              ← Back
            </button>

            {/* Right side: hint + action button */}
            <div className="flex items-center gap-3">
              {step === 1 && !canProceed && (
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                  Enter an occupation to continue
                </p>
              )}

              {step < 3 ? (
                <button
                  id="continue-btn"
                  disabled={!canProceed}
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    padding: '11px 26px',
                    boxShadow: canProceed ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="generate-btn"
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    padding: '11px 26px',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate My Roadmap
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Privacy footnote */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          🔒 Your data stays on your device. We only use it to generate your personalised roadmap.
        </p>
      </div>
    </div>
  );
}
