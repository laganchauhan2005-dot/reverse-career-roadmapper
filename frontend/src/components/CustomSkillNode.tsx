import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SkillNode, NodeCategory } from '../types';
import { CheckCircle2, Circle, Clock3, Layers, Wrench, Brain, FolderKanban, Star, Flag } from 'lucide-react';

interface CustomNodeData {
  skillNode: SkillNode;
  isSelected: boolean;
  onClick: () => void;
  [key: string]: unknown;
}

const CATEGORY_CONFIG: Record<NodeCategory, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  foundation:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: <Layers className="w-3 h-3" />,       label: 'Foundation' },
  technical:   { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   icon: <Brain className="w-3 h-3" />,         label: 'Technical' },
  soft_skill:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Star className="w-3 h-3" />,          label: 'Soft Skill' },
  tool:        { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: <Wrench className="w-3 h-3" />,        label: 'Tool' },
  domain:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <FolderKanban className="w-3 h-3" />,  label: 'Domain' },
  project:     { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   icon: <FolderKanban className="w-3 h-3" />, label: 'Project' },
  milestone:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <Flag className="w-3 h-3" />,          label: 'Milestone' },
};

export const CustomSkillNode = memo(({ data }: NodeProps) => {
  const { skillNode, isSelected, onClick } = data as CustomNodeData;
  const config = CATEGORY_CONFIG[skillNode.category] || CATEGORY_CONFIG.foundation;
  const isCompleted = skillNode.status === 'completed';
  const isInProgress = skillNode.status === 'in_progress';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border transition-all"
      style={{
        width: 200,
        background: isCompleted ? 'rgba(16,185,129,0.1)' : config.bg,
        borderColor: isSelected
          ? '#6366f1'
          : isCompleted
          ? '#10b981'
          : isInProgress
          ? '#f59e0b'
          : config.color,
        borderWidth: isSelected ? 2.5 : 1,
        boxShadow: isSelected ? `0 0 0 3px rgba(99,102,241,0.35)` : 'none',
        padding: '12px 14px',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: config.color, width: 8, height: 8, borderRadius: 3 }} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span style={{ color: config.color }}>{config.icon}</span>
            <span className="text-xs font-medium" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
          <div className="text-sm font-semibold leading-tight" style={{ color: '#f1f5f9' }}>
            {skillNode.label}
          </div>
          <div className="flex items-center gap-1 mt-1.5" style={{ color: '#64748b' }}>
            <Clock3 className="w-3 h-3" />
            <span className="text-xs">{skillNode.estimated_hours}h</span>
          </div>
        </div>
        <div>
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />
          ) : isInProgress ? (
            <Clock3 className="w-5 h-5" style={{ color: '#f59e0b' }} />
          ) : (
            <Circle className="w-5 h-5" style={{ color: '#475569' }} />
          )}
        </div>
      </div>

      {skillNode.category === 'milestone' && (
        <div className="mt-1.5 px-2 py-0.5 rounded-full text-xs font-bold text-center"
          style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          🏆 Milestone
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: config.color, width: 8, height: 8, borderRadius: 3 }} />
    </div>
  );
});

CustomSkillNode.displayName = 'CustomSkillNode';
