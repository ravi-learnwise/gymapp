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

const toneStyles: Record<
  StatCardTone,
  { card: string; icon: string; label: string; value: string; note: string }
> = {
  blue: {
    card: 'from-sky-50 via-blue-50 to-slate-50 border-sky-200/70 shadow-sky-200/30',
    icon: 'bg-sky-200/60 text-sky-700',
    label: 'text-sky-700',
    value: 'text-sky-950',
    note: 'text-sky-600',
  },
  indigo: {
    card: 'from-indigo-50 via-violet-50 to-purple-50 border-indigo-200/60 shadow-indigo-200/25',
    icon: 'bg-indigo-200/50 text-indigo-700',
    label: 'text-indigo-700',
    value: 'text-indigo-950',
    note: 'text-indigo-600',
  },
  emerald: {
    card: 'from-emerald-50 via-teal-50 to-green-50 border-emerald-200/60 shadow-emerald-200/25',
    icon: 'bg-emerald-200/50 text-emerald-700',
    label: 'text-emerald-700',
    value: 'text-emerald-950',
    note: 'text-emerald-600',
  },
  violet: {
    card: 'from-violet-50 via-fuchsia-50 to-pink-50 border-violet-200/60 shadow-violet-200/25',
    icon: 'bg-violet-200/50 text-violet-700',
    label: 'text-violet-700',
    value: 'text-violet-950',
    note: 'text-violet-600',
  },
  amber: {
    card: 'from-amber-50 via-yellow-50 to-orange-50 border-amber-200/70 shadow-amber-200/30',
    icon: 'bg-amber-200/60 text-amber-800',
    label: 'text-amber-800',
    value: 'text-amber-950',
    note: 'text-amber-700',
  },
  rose: {
    card: 'from-rose-50 via-pink-50 to-red-50 border-rose-200/60 shadow-rose-200/25',
    icon: 'bg-rose-200/50 text-rose-700',
    label: 'text-rose-700',
    value: 'text-rose-950',
    note: 'text-rose-600',
  },
  orange: {
    card: 'from-orange-50 via-amber-50 to-yellow-50 border-orange-200/70 shadow-orange-200/30',
    icon: 'bg-orange-200/55 text-orange-800',
    label: 'text-orange-800',
    value: 'text-orange-950',
    note: 'text-orange-700',
  },
  slate: {
    card: 'from-stone-50 via-amber-50/40 to-orange-50/30 border-stone-200/70 shadow-stone-200/25',
    icon: 'bg-stone-200/50 text-stone-700',
    label: 'text-stone-700',
    value: 'text-stone-900',
    note: 'text-stone-600',
  },
  cyan: {
    card: 'from-cyan-50 via-sky-50 to-teal-50 border-cyan-200/60 shadow-cyan-200/25',
    icon: 'bg-cyan-200/50 text-cyan-800',
    label: 'text-cyan-800',
    value: 'text-cyan-950',
    note: 'text-cyan-700',
  },
};

type StatCardProps = {
  title: string;
  value: string | number;
  note?: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  children?: ReactNode;
};

export default function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'blue',
  children,
}: StatCardProps) {
  const s = toneStyles[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-md ${s.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${s.icon}`}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <p className={`text-3xl font-extrabold tracking-tight ${s.value}`}>{value}</p>
      </div>
      <p className={`mt-3 text-xs font-semibold uppercase tracking-wider ${s.label}`}>{title}</p>
      {note && <p className={`mt-1 text-xs font-medium ${s.note}`}>{note}</p>}
      {children}
    </div>
  );
}
