import type { ReactNode } from 'react';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantClass: Record<StatusBadgeVariant, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-danger',
  info: 'badge badge-info',
  neutral: 'badge badge-neutral',
};

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  children: ReactNode;
  className?: string;
};

export default function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  return (
    <span className={`${variantClass[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}

/** Map enquiry status → badge variant */
export function enquiryStatusVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'CONTACTED':
      return 'neutral';
    case 'FOLLOW_UP':
    case 'TRIAL':
      return 'warning';
    case 'CONVERTED':
      return 'success';
    case 'LOST':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Map payment status → badge variant */
export function paymentStatusVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PARTIAL':
      return 'warning';
    case 'PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}
