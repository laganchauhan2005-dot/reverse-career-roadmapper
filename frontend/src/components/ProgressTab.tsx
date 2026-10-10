import type { Roadmap } from '../types';
import { CheckCircle2, Clock3, Circle, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  roadmap: Roadmap;
}

export function ProgressTab({ roadmap }: Props) {
  const total = roadmap.nodes.length;
  const completed = roadmap.nodes.filter(n => n.status === 'completed').length;
  const inProgress = roadmap.nodes.filter(n => n.status === 'in_progress').length;
  const notStarted = roadmap.nodes.filter(n => n.status === 'not_started').length;

  const completedNodes = roadmap.nodes.filter(n => n.status === 'completed');
  const inProgressNodes = roadmap.nodes.filter(n => n.status === 'in_progress');
  const upcomingNodes = roadmap.nodes.filter(n => {
    if (n.status !== 'not_started') return false;
    const prereqsDone = n.prerequisites.every(pid => {
      const p = roadmap.nodes.find(x => x.id === pid);
      return p?.status === 'completed';
    });
    return prereqsDone;
  });

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const completedHours = completedNodes.reduce((s, n) => s + n.estimated_hours, 0);
  const remainingHours = roadmap.nodes
    .filter(n => n.status !== 'completed')
    .reduce((s, n) => s + n.estimated_hours, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
          Career Progress
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {roadmap.occupation} — roadmap progress tracker
        </p>
        <p className="text-xs mt-1 px-3 py-1.5 rounded-lg inline-block"
          style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Progress % reflects roadmap completion, not job-readiness.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Completed', value: completed, total, color: '#10b981', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'In Progress', value: inProgress, total, color: '#f59e0b', icon: <Clock3 className="w-5 h-5" /> },
          { label: 'Not Started', value: notStarted, total, color: '#64748b', icon: <Circle className="w-5 h-5" /> },
          { label: 'Hours Done', value: `${completedHours}h`, total: null, color: '#6366f1', icon: <TrendingUp className="w-5 h-5" /> },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Completion</span>
          <span className="text-2xl font-bold" style={{ color: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : 'var(--accent-primary)' }}>
            {pct}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' :
                          pct >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                          'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }} />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          ~{remainingHours}h of learning remaining
        </p>
      </div>

      {/* Sections */}
      {[
        { title: '✅ Completed Skills', nodes: completedNodes, emptyMsg: 'No skills completed yet.', color: '#10b981' },
        { title: '🔄 In Progress', nodes: inProgressNodes, emptyMsg: 'Nothing in progress yet.', color: '#f59e0b' },
        { title: '⚡ Ready to Start', nodes: upcomingNodes, emptyMsg: 'Complete prerequisites to unlock more.', color: '#6366f1' },
      ].map(section => (
        <div key={section.title} className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
          </div>
          <div className="p-4">
            {section.nodes.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>{section.emptyMsg}</p>
            ) : (
              <div className="space-y-2">
                {section.nodes.map(node => (
                  <div key={node.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: section.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{node.label}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                        {node.category.replace('_', ' ')} · {node.estimated_hours}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
