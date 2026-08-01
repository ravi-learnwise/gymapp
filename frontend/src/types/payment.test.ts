import { describe, it, expect } from 'vitest';
import { formatCurrency, PAYMENT_STATUS_LABELS } from './payment';

describe('payment types', () => {
  it('formatCurrency formats INR amounts', () => {
    expect(formatCurrency(1500)).toContain('1,500');
    expect(formatCurrency(1500)).toContain('₹');
  });

  it('PAYMENT_STATUS_LABELS covers all statuses', () => {
    expect(PAYMENT_STATUS_LABELS.PAID).toBe('Paid');
    expect(PAYMENT_STATUS_LABELS.PARTIAL).toBe('Partial');
    expect(PAYMENT_STATUS_LABELS.PENDING).toBe('Pending');
  });
});
