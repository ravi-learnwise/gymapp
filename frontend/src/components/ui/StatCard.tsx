import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatCardTone =
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'slate'
  | 'cyan';

const iconTone: Record<StatCardTone, string> = {
  blue: 'icon-accent-info',
  indigo: 'icon-accent-brand',
  emerald: 'icon-accent-success',
  violet: 'icon-accent-brand',
  amber: 'icon-accent-warning',
  rose: 'icon-accent-danger',
  orange: 'icon-accent-warning',
  slate: 'icon-accent-neutral',
  cyan: 'icon-accent-info',
};

const cardTone: Record<StatCardTone, string> = {
  blue: 'stat-card-tone-blue',
  indigo: 'stat-card-tone-brand',
  emerald: 'stat-card-tone-success',
  violet: 'stat-card-tone-brand',
  amber: 'stat-card-tone-warning',
  rose: 'stat-card-tone-danger',
  orange: 'stat-card-tone-warning',
  slate: 'stat-card-tone-neutral',
  cyan: 'stat-card-tone-cyan',
};

type StatCardProps = {
  title: string;
  value: string | number;
  note?: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  /** White card surface (e.g. payment summary). Default: soft tinted KPI style. */
  variant?: 'kpi' | 'plain';
  children?: ReactNode;
};

export default function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'blue',
  variant = 'kpi',
  children,
}: StatCardProps) {
  const surfaceClass = variant === 'plain' ? 'border-line bg-white' : cardTone[tone];

  return (
    <div className={`stat-card ${surfaceClass}`}>
      <div className={`stat-card-icon ${iconTone[tone]}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {note && <p className="mt-1.5 text-xs text-ink-muted">{note}</p>}
      {children}
    </div>
  );
}
