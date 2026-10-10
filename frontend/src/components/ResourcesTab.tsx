import { useState } from 'react';
import type { ResourceItem } from '../types';
import {
  ExternalLink, BookOpen, Play, FileText, Users,
  BookMarked, Tag, AlertCircle, RefreshCw,
} from 'lucide-react';

interface Props {
  resources: ResourceItem[];
  isLoading: boolean;
  error: string | null;
  onLoad: () => void;
  occupation: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video:     <Play     className="w-4 h-4" />,
  course:    <BookOpen className="w-4 h-4" />,
  article:   <FileText className="w-4 h-4" />,
  book:      <BookMarked className="w-4 h-4" />,
  community: <Users    className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  video:     '#f43f5e',
  course:    '#6366f1',
  article:   '#06b6d4',
  book:      '#8b5cf6',
  community: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  video:     'Video',
  course:    'Course',
  article:   'Article / Reference',
  book:      'Book',
  community: 'Community',
};

const costStyle = (cost: string) =>
  cost.toLowerCase().includes('free')
    ? { color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
    : { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };

export function ResourcesTab({
  resources,
  isLoading,
  error,
  onLoad,
  occupation,
}: Props) {
  // Track internally so the component itself knows whether a load was attempted
  const [loadAttempted, setLoadAttempted] = useState(false);

  const handleLoad = () => {
    setLoadAttempted(true);
    onLoad();
  };

  const showNoResults =
    loadAttempted && !isLoading && !error && resources.length === 0;
  const showPrompt =
    !loadAttempted && !isLoading && resources.length === 0;

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}
          >
            Learning Resources
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Curated resources matched to <strong style={{ color: 'var(--text-primary)' }}>{occupation}</strong>.
            All links are real and independently verified.
          </p>
        </div>
        <button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading…
            </>
          ) : resources.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              Load Resources
            </>
          )}
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border text-sm"
          style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)', color: '#f87171' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="loading-skeleton rounded-xl" style={{ height: 96 }} />
          ))}
        </div>
      )}

      {/* ── Pre-load prompt ── */}
      {showPrompt && (
        <div className="text-center py-16 fade-in">
          <BookOpen
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--text-muted)', opacity: 0.3 }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Click <strong style={{ color: 'var(--text-secondary)' }}>Load Resources</strong> to see
            learning materials matched to <em>{occupation}</em>.
          </p>
        </div>
      )}

      {/* ── No-results message (after a load attempt returned nothing) ── */}
      {showNoResults && (
        <div
          className="flex items-start gap-4 p-5 rounded-xl border fade-in"
          style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#f59e0b' }}>
              No curated resources found for "{occupation}"
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Our catalogue focuses on self-study resources. For professional training in{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{occupation}</strong>, we recommend
              checking with accredited universities, professional bodies, or licensing organisations
              in your country.
            </p>
          </div>
        </div>
      )}

      {/* ── Resource cards ── */}
      {!isLoading && resources.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {resources.map((res, i) => {
            const tc   = TYPE_COLORS[res.type] || '#6366f1';
            const cs   = costStyle(res.cost);
            const icon = TYPE_ICONS[res.type] || <BookOpen className="w-4 h-4" />;
            const typeLabel = TYPE_LABELS[res.type] || res.type;

            return (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border transition-all"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 18px',
                  gap: 12,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Top row: icon + title + link arrow */}
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 40, height: 40,
                      background: `${tc}18`,
                      color: tc,
                    }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-sm font-semibold leading-snug transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {res.title}
                      </h3>
                      <ExternalLink
                        className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--accent-primary)', marginTop: 2 }}
                      />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {res.provider}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {res.description}
                </p>

                {/* Tags row */}
                <div className="flex items-center flex-wrap gap-1.5">
                  {/* Cost badge */}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: cs.bg, color: cs.color }}
                  >
                    {res.cost}
                  </span>
                  {/* Type badge */}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{ background: `${tc}15`, color: tc }}
                  >
                    {typeLabel}
                  </span>
                  {/* Up to 2 skill tags so they don't overflow */}
                  {res.skill_tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Footer note ── */}
      {resources.length > 0 && !isLoading && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Links sourced from a curated catalogue of verified resources.
          Prices shown are as of late 2024 and may have changed.
        </p>
      )}
    </div>
  );
}
