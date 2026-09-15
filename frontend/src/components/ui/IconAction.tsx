import { Ban, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ComponentType } from 'react';

export type IconActionVariant = 'edit' | 'remove' | 'deactivate' | 'delete';

const variants: Record<
  IconActionVariant,
  { Icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; tone: string }
> = {
  edit: {
    Icon: Pencil,
    label: 'Edit',
    tone: 'text-brand-700 hover:bg-brand-50 hover:border-brand-200 border-line',
  },
  remove: {
    Icon: Trash2,
    label: 'Remove',
    tone: 'text-danger hover:bg-danger-soft hover:border-danger-border border-line',
  },
  deactivate: {
    Icon: Ban,
    label: 'Deactivate',
    tone: 'text-warning hover:bg-warning-soft hover:border-warning-border border-line',
  },
  delete: {
    Icon: Trash2,
    label: 'Delete',
    tone: 'text-danger hover:bg-danger-soft hover:border-danger-border border-line',
  },
};

const baseClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white transition-colors';

type IconActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: IconActionVariant;
};

export default function IconAction({ variant, className = '', ...props }: IconActionProps) {
  const { Icon, label, tone } = variants[variant];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`${baseClass} ${tone} ${className}`.trim()}
      {...props}
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

type IconActionLinkProps = {
  variant: IconActionVariant;
  to: string;
  className?: string;
};

export function IconActionLink({ variant, to, className = '' }: IconActionLinkProps) {
  const { Icon, label, tone } = variants[variant];
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className={`${baseClass} ${tone} ${className}`.trim()}
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </Link>
  );
}
