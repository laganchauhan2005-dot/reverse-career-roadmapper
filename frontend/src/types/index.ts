export type CareerLevel = 'complete_beginner' | 'some_experience' | 'intermediate' | 'advanced';
export type Budget = 'free' | 'low' | 'medium' | 'high';
export type SkillStatus = 'not_started' | 'in_progress' | 'completed';
export type NodeCategory =
  | 'foundation'
  | 'technical'
  | 'soft_skill'
  | 'tool'
  | 'domain'
  | 'project'
  | 'milestone';

export interface OnboardingData {
  occupation: string;
  current_level: CareerLevel;
  known_skills: string[];
  hours_per_week: number;
  target_months: number;
  learning_preferences: string[];
  budget: Budget;
}

export interface SkillNode {
  id: string;
  label: string;
  category: NodeCategory;
  description: string;
  estimated_hours: number;
  prerequisites: string[];
  resources: string[];
  level: number;
  status: SkillStatus;
}

export interface RoadmapEdge {
  source: string;
  target: string;
}

export interface Roadmap {
  id: string;
  occupation: string;
  nodes: SkillNode[];
  edges: RoadmapEdge[];
  total_estimated_hours: number;
  summary: string;
}

export interface ResourceItem {
  title: string;
  provider: string;
  url: string;
  type: 'video' | 'course' | 'article' | 'book' | 'community';
  cost: string;
  skill_tags: string[];
  description: string;
}

export type AppTab = 'roadmap' | 'progress' | 'resources' | 'assistant';

export interface AppState {
  onboarding: OnboardingData | null;
  roadmap: Roadmap | null;
  activeTab: AppTab;
  selectedNodeId: string | null;
  explanation: string | null;
  resources: ResourceItem[];
}
