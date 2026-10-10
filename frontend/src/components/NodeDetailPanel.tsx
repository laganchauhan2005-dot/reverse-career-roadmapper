import type { SkillNode, Roadmap } from '../types';
import { X, Clock3, CheckCircle2, Play, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  node: SkillNode;
  roadmap: Roadmap;
  onClose: () => void;
  onStatusChange: (nodeId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onExplain: (node: SkillNode) => void;
  isLoadingExplanation: boolean;
  explanation?: string | null;
}

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: '#64748b', Icon: RotateCcw },
  in_progress:  { label: 'In Progress', color: '#f59e0b', Icon: Play       },
  completed:    { label: 'Completed',   color: '#10b981', Icon: CheckCircle2 },
} as const;

/** Thin horizontal rule between sections */
function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />;
}

/** Small section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </div>
  );
}

export function NodeDetailPanel({
  node,
  roadmap,
  onClose,
  onStatusChange,
  onExplain,
  isLoadingExplanation,
  explanation,
}: Props) {
  const prereqNodes     = roadmap.nodes.filter(n => node.prerequisites.includes(n.id));
  const dependentNodes  = roadmap.nodes.filter(n => n.prerequisites.includes(node.id));

  const cfg        = STATUS_CONFIG[node.status];
  const statusColor = cfg.color;
  const statusLabel = cfg.label;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-card)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-start justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex-1 min-w-0 pr-3">
          {/* Badges row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-2">
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
            >
              {node.category.replace('_', ' ')}
            </span>
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${statusColor}22`, color: statusColor }}
            >
              {statusLabel}
            </span>
          </div>
          {/* Skill name */}
          <h3
            className="text-base font-bold leading-snug"
            style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {node.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {node.description}
        </p>

        {/* Time estimate */}
        <div
          className="flex items-center gap-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', padding: '10px 14px' }}
        >
          <Clock3 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimated time</span>
          <span className="text-sm font-bold ml-auto" style={{ color: 'var(--text-primary)' }}>
            {node.estimated_hours}h
          </span>
        </div>

        <Divider />

        {/* Status controls */}
        <div>
          <SectionLabel>Mark Progress</SectionLabel>
          <div className="flex flex-col gap-2">
            {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
              ([status, { label, color, Icon }]) => {
                const active = node.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => onStatusChange(node.id, status)}
                    className="flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      padding: '10px 14px',
                      background:   active ? `${color}18` : 'var(--bg-elevated)',
                      border:       `1.5px solid ${active ? color : 'var(--border)'}`,
                      color:        active ? color : 'var(--text-secondary)',
                      boxShadow:    active ? `0 0 0 2px ${color}28` : 'none',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                        style={{ background: color, color: '#fff' }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Prerequisites */}
        {prereqNodes.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionLabel>Prerequisites ({prereqNodes.length})</SectionLabel>
              <div className="space-y-1.5">
                {prereqNodes.map(n => (
                  <div
                    key={n.id}
                    className="flex items-center gap-2.5 rounded-lg"
                    style={{ background: 'var(--bg-elevated)', padding: '8px 12px' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: n.status === 'completed' ? '#10b981' : '#475569' }}
                    />
                    <span className="text-xs flex-1 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                      {n.label}
                    </span>
                    {n.status === 'completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Unlocks */}
        {dependentNodes.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionLabel>Unlocks ({dependentNodes.length})</SectionLabel>
              <div className="space-y-1.5">
                {dependentNodes.map(n => (
                  <div
                    key={n.id}
                    className="flex items-center gap-2.5 rounded-lg"
                    style={{ background: 'var(--bg-elevated)', padding: '8px 12px' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6366f1' }} />
                    <span className="text-xs flex-1 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                      {n.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Resource hints */}
        {node.resources && node.resources.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionLabel>Learning Hints</SectionLabel>
              <ul className="space-y-1.5">
                {node.resources.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#6366f1' }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Divider />

        {/* AI Explain */}
        <div>
          <button
            onClick={() => onExplain(node)}
            disabled={isLoadingExplanation}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              padding: '11px 16px',
              border: '1.5px solid rgba(99,102,241,0.5)',
              color: '#a5b4fc',
              background: 'rgba(99,102,241,0.08)',
            }}
            onMouseEnter={e => {
              if (!isLoadingExplanation) e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
            }}
          >
            {isLoadingExplanation ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting explanation…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Explain this skill
              </>
            )}
          </button>

          {explanation && (
            <div
              className="mt-3 rounded-xl prose-dark text-xs leading-relaxed overflow-y-auto"
              style={{
                background: 'var(--bg-elevated)',
                padding: '12px 14px',
                maxHeight: 220,
                border: '1px solid var(--border)',
              }}
              dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>') }}
            />
          )}
        </div>

        {/* bottom breathing room */}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
