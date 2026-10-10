import { useState, useCallback } from 'react';
import type { Roadmap, SkillNode, OnboardingData, AppTab, ResourceItem } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { RoadmapGraph } from '../components/RoadmapGraph';
import { NodeDetailPanel } from '../components/NodeDetailPanel';
import { ProgressTab } from '../components/ProgressTab';
import { ResourcesTab } from '../components/ResourcesTab';
import { AssistantTab } from '../components/AssistantTab';
import {
  adaptRoadmap,
  explainCareer,
  getResources,
} from '../services/api';
import {
  GitBranch,
  TrendingUp,
  BookOpen,
  MessageCircle,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface Props {
  initialOnboarding: OnboardingData;
  initialRoadmap: Roadmap;
  onReset: () => void;
}

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'roadmap',    label: 'Roadmap',   icon: <GitBranch className="w-4 h-4" /> },
  { id: 'progress',  label: 'Progress',  icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'assistant', label: 'Assistant', icon: <MessageCircle className="w-4 h-4" /> },
];

export function WorkspacePage({ initialOnboarding, initialRoadmap, onReset }: Props) {
  const { roadmap, setRoadmap, updateNodeStatus } = usePersistentState();
  const activeRoadmap = roadmap || initialRoadmap;

  const [activeTab, setActiveTab] = useState<AppTab>('roadmap');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [nodeExplanation, setNodeExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const careerExplanation: string | null = null;
  const [showPanel, setShowPanel] = useState(false);

  const handleNodeClick = useCallback((node: SkillNode) => {
    setSelectedNode(node);
    setNodeExplanation(null);
    setShowPanel(true);
  }, []);

  const handleStatusChange = useCallback(
    (nodeId: string, status: 'not_started' | 'in_progress' | 'completed') => {
      updateNodeStatus(nodeId, status);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(prev => prev ? { ...prev, status } : null);
      }
    },
    [updateNodeStatus, selectedNode]
  );

  const handleExplainNode = useCallback(async (node: SkillNode) => {
    setIsExplaining(true);
    setNodeExplanation(null);
    try {
      const text = await explainCareer(
        initialOnboarding.occupation,
        `Explain the skill: "${node.label}" — ${node.description}`,
        node.label
      );
      setNodeExplanation(text);
    } catch (e) {
      setNodeExplanation(`Error: ${e instanceof Error ? e.message : 'Could not get explanation'}`);
    } finally {
      setIsExplaining(false);
    }
  }, [initialOnboarding.occupation]);

  const handleAskQuestion = useCallback(async (question: string): Promise<string> => {
    return explainCareer(initialOnboarding.occupation, question);
  }, [initialOnboarding.occupation]);

  const handleAdaptRoadmap = useCallback(async () => {
    setIsAdapting(true);
    setAdaptError(null);
    try {
      const completedIds = activeRoadmap.nodes
        .filter(n => n.status === 'completed')
        .map(n => n.id);
      const result = await adaptRoadmap(activeRoadmap, completedIds);
      setRoadmap(result.roadmap);
    } catch (e) {
      setAdaptError(e instanceof Error ? e.message : 'Failed to adapt roadmap');
    } finally {
      setIsAdapting(false);
    }
  }, [activeRoadmap, setRoadmap]);

  const handleLoadResources = useCallback(async () => {
    setIsLoadingResources(true);
    setResourceError(null);
    try {
      const skills = activeRoadmap.nodes.map(n => n.label);
      const items = await getResources(
        initialOnboarding.occupation,
        skills,
        initialOnboarding.budget,
        initialOnboarding.current_level
      );
      setResources(items);
    } catch (e) {
      setResourceError(e instanceof Error ? e.message : 'Failed to load resources');
    } finally {
      setIsLoadingResources(false);
    }
  }, [activeRoadmap.nodes, initialOnboarding]);

  const completedCount = activeRoadmap.nodes.filter(n => n.status === 'completed').length;
  const pct = activeRoadmap.nodes.length > 0
    ? Math.round((completedCount / activeRoadmap.nodes.length) * 100)
    : 0;

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', minHeight: 56 }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
              {initialOnboarding.occupation}
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-1 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}% complete</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'roadmap' && completedCount > 0 && (
            <button
              onClick={handleAdaptRoadmap}
              disabled={isAdapting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.08)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${isAdapting ? 'animate-spin' : ''}`} />
              {isAdapting ? 'Adapting...' : 'AI Adapt'}
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
            <LogOut className="w-3.5 h-3.5" /> New Roadmap
          </button>
        </div>
      </header>

      {adaptError && (
        <div className="px-5 py-2 text-sm border-b"
          style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)', color: '#f87171' }}>
          {adaptError}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="workspace-tab flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            data-active={activeTab === tab.id ? 'true' : 'false'}
            style={{
              background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'roadmap' && (
          <>
            <div className="flex-1 overflow-hidden">
              <RoadmapGraph
                roadmap={activeRoadmap}
                selectedNodeId={selectedNode?.id ?? null}
                onNodeClick={handleNodeClick}
              />
            </div>
            {showPanel && selectedNode && (
              <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: 320, borderLeft: '1px solid var(--border)' }}>
                <NodeDetailPanel
                  node={selectedNode}
                  roadmap={activeRoadmap}
                  onClose={() => { setShowPanel(false); setSelectedNode(null); }}
                  onStatusChange={handleStatusChange}
                  onExplain={handleExplainNode}
                  isLoadingExplanation={isExplaining}
                  explanation={nodeExplanation}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'progress' && (
          <div className="flex-1 overflow-hidden">
            <ProgressTab roadmap={activeRoadmap} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="flex-1 overflow-hidden">
            <ResourcesTab
              resources={resources}
              isLoading={isLoadingResources}
              error={resourceError}
              onLoad={handleLoadResources}
              occupation={initialOnboarding.occupation}
            />
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <AssistantTab
              occupation={initialOnboarding.occupation}
              initialExplanation={careerExplanation}
              onAskQuestion={handleAskQuestion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
