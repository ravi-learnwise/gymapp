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
    card: 'from-sky-200 via-blue-200 to-slate-200 border-sky-400/90 shadow-sky-400/40',
    icon: 'bg-sky-400/80 text-sky-950',
    label: 'text-sky-900',
    value: 'text-sky-950',
    note: 'text-sky-800',
  },
  indigo: {
    card: 'from-indigo-200 via-violet-200 to-purple-200 border-indigo-400/85 shadow-indigo-400/35',
    icon: 'bg-indigo-400/75 text-indigo-950',
    label: 'text-indigo-900',
    value: 'text-indigo-950',
    note: 'text-indigo-800',
  },
  emerald: {
    card: 'from-emerald-200 via-teal-200 to-green-200 border-emerald-400/85 shadow-emerald-400/35',
    icon: 'bg-emerald-400/75 text-emerald-950',
    label: 'text-emerald-900',
    value: 'text-emerald-950',
    note: 'text-emerald-800',
  },
  violet: {
    card: 'from-violet-200 via-fuchsia-200 to-pink-200 border-violet-400/85 shadow-violet-400/35',
    icon: 'bg-violet-400/75 text-violet-950',
    label: 'text-violet-900',
    value: 'text-violet-950',
    note: 'text-violet-800',
  },
  amber: {
    card: 'from-amber-200 via-yellow-200 to-orange-200 border-amber-400/90 shadow-amber-400/40',
    icon: 'bg-amber-400/80 text-amber-950',
    label: 'text-amber-950',
    value: 'text-amber-950',
    note: 'text-amber-900',
  },
  rose: {
    card: 'from-rose-200 via-pink-200 to-red-200 border-rose-400/85 shadow-rose-400/35',
    icon: 'bg-rose-400/75 text-rose-950',
    label: 'text-rose-900',
    value: 'text-rose-950',
    note: 'text-rose-800',
  },
  orange: {
    card: 'from-orange-200 via-amber-200 to-yellow-200 border-orange-400/90 shadow-orange-400/40',
    icon: 'bg-orange-400/80 text-orange-950',
    label: 'text-orange-950',
    value: 'text-orange-950',
    note: 'text-orange-900',
  },
  slate: {
    card: 'from-stone-200 via-amber-200/70 to-orange-200/60 border-stone-400/90 shadow-stone-400/35',
    icon: 'bg-stone-400/75 text-stone-950',
    label: 'text-stone-900',
    value: 'text-stone-950',
    note: 'text-stone-800',
  },
  cyan: {
    card: 'from-cyan-200 via-sky-200 to-teal-200 border-cyan-400/85 shadow-cyan-400/35',
    icon: 'bg-cyan-400/75 text-cyan-950',
    label: 'text-cyan-950',
    value: 'text-cyan-950',
    note: 'text-cyan-900',
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
