import { useState, useEffect } from 'react';
import { OnboardingForm } from './components/OnboardingForm';
import { WorkspacePage } from './pages/WorkspacePage';
import { usePersistentState } from './hooks/usePersistentState';
import { generateRoadmap, checkHealth } from './services/api';
import type { OnboardingData } from './types';

type AppView = 'onboarding' | 'loading' | 'workspace' | 'error';

function LoadingScreen({ occupation }: { occupation: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
          Generating your roadmap...
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Building a personalized path to become a <strong style={{ color: 'var(--accent-primary)' }}>{occupation}</strong>
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          This usually takes 10–20 seconds
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--accent-primary)',
              animation: `bounce 1s infinite ${i * 0.2}s`,
            }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ErrorScreen({ message, onRetry, onBack }: { message: string; onRetry?: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(244,63,94,0.1)', border: '2px solid rgba(244,63,94,0.3)' }}>
        <span className="text-3xl">⚠️</span>
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button onClick={onRetry}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
              Try Again
            </button>
          )}
          <button onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { onboarding, roadmap, setOnboarding, setRoadmap, resetAll } = usePersistentState();
  const [view, setView] = useState<AppView>(() => {
    // If we have saved data, start at workspace
    if (onboarding && roadmap) return 'workspace';
    return 'onboarding';
  });
  const [error, setError] = useState<string | null>(null);
  const [pendingOnboarding, setPendingOnboarding] = useState<OnboardingData | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setOnboarding(data);
    setPendingOnboarding(data);
    setView('loading');
    setError(null);
    try {
      const generated = await generateRoadmap(data);
      setRoadmap(generated);
      setView('workspace');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate roadmap');
      setView('error');
    }
  };

  const handleRetry = async () => {
    if (!pendingOnboarding) { setView('onboarding'); return; }
    await handleOnboardingComplete(pendingOnboarding);
  };

  const handleReset = () => {
    resetAll();
    setView('onboarding');
    setError(null);
    setPendingOnboarding(null);
  };

  return (
    <>
      {/* Backend status warning */}
      {backendOk === false && view === 'onboarding' && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs text-center"
          style={{ background: 'rgba(245,158,11,0.9)', color: '#1c1917' }}>
          ⚠️ Backend not reachable at {import.meta.env.VITE_API_URL || 'http://localhost:8000'} — start the Python server first.
        </div>
      )}

      {view === 'onboarding' && (
        <OnboardingForm
          onComplete={handleOnboardingComplete}
          isLoading={false}
        />
      )}

      {view === 'loading' && pendingOnboarding && (
        <LoadingScreen occupation={pendingOnboarding.occupation} />
      )}

      {view === 'error' && (
        <ErrorScreen
          message={error || 'Unknown error'}
          onRetry={handleRetry}
          onBack={handleReset}
        />
      )}

      {view === 'workspace' && onboarding && roadmap && (
        <WorkspacePage
          initialOnboarding={onboarding}
          initialRoadmap={roadmap}
          onReset={handleReset}
        />
      )}
    </>
  );
}
