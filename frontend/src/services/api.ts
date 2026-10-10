import type {
  OnboardingData,
  Roadmap,
  ResourceItem,
} from '../types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {/* ignore */}
    throw new Error(detail);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

export async function generateRoadmap(onboarding: OnboardingData): Promise<Roadmap> {
  const data = await post<{ roadmap: Roadmap }>('/api/roadmap/generate', { onboarding });
  return data.roadmap;
}

export async function adaptRoadmap(
  roadmap: Roadmap,
  completedSkillIds: string[]
): Promise<{ roadmap: Roadmap; changes_summary: string }> {
  return post('/api/roadmap/adapt', {
    roadmap,
    completed_skill_ids: completedSkillIds,
  });
}

export async function explainCareer(
  occupation: string,
  question?: string,
  context?: string
): Promise<string> {
  const data = await post<{ explanation: string }>('/api/assistant/explain', {
    occupation,
    question,
    context,
  });
  return data.explanation;
}

export async function getResources(
  occupation: string,
  skills: string[],
  budget: string,
  currentLevel: string
): Promise<ResourceItem[]> {
  const data = await post<{ resources: ResourceItem[] }>('/api/resources/recommend', {
    occupation,
    skills,
    budget,
    current_level: currentLevel,
  });
  return data.resources;
}
