import { useState, useCallback } from 'react';
import type { Roadmap, OnboardingData } from '../types';

const STORAGE_KEY = 'rcr_state_v1';

interface PersistedState {
  onboarding: OnboardingData | null;
  roadmap: Roadmap | null;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return { onboarding: null, roadmap: null };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {/* ignore */}
}

export function usePersistentState() {
  const [state, setStateInternal] = useState<PersistedState>(loadState);

  const setState = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setStateInternal(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setOnboarding = useCallback((onboarding: OnboardingData) => {
    setState(prev => ({ ...prev, onboarding }));
  }, [setState]);

  const setRoadmap = useCallback((roadmap: Roadmap) => {
    setState(prev => ({ ...prev, roadmap }));
  }, [setState]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(() => ({ onboarding: null, roadmap: null }));
  }, [setState]);

  const updateNodeStatus = useCallback(
    (nodeId: string, status: 'not_started' | 'in_progress' | 'completed') => {
      setState(prev => {
        if (!prev.roadmap) return prev;
        const nodes = prev.roadmap.nodes.map(n =>
          n.id === nodeId ? { ...n, status } : n
        );
        return { ...prev, roadmap: { ...prev.roadmap, nodes } };
      });
    },
    [setState]
  );

  return {
    onboarding: state.onboarding,
    roadmap: state.roadmap,
    setOnboarding,
    setRoadmap,
    resetAll,
    updateNodeStatus,
  };
}
