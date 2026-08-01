import { PaymentStatus } from '@prisma/client';
import {
  computePaymentAmounts,
  derivePaymentStatus,
  toNumber,
} from './payment.util';

describe('payment.util', () => {
  describe('computePaymentAmounts', () => {
    it('computes final amount after discount', () => {
      const { finalAmount, gstAmount } = computePaymentAmounts(10000, 1000);
      expect(finalAmount).toBe(9000);
      expect(gstAmount).toBe(0);
    });

    it('computes GST on final amount', () => {
      const { finalAmount, gstAmount } = computePaymentAmounts(10000, 0, 18);
      expect(finalAmount).toBe(10000);
      expect(gstAmount).toBe(1800);
    });

    it('never returns negative final amount', () => {
      const { finalAmount } = computePaymentAmounts(1000, 2000);
      expect(finalAmount).toBe(0);
    });
  });

  describe('derivePaymentStatus', () => {
    it('returns PAID when fully paid', () => {
      expect(derivePaymentStatus(9000, 9000)).toBe(PaymentStatus.PAID);
      expect(derivePaymentStatus(10000, 9000)).toBe(PaymentStatus.PAID);
    });

    it('returns PARTIAL when partially paid', () => {
      expect(derivePaymentStatus(5000, 9000)).toBe(PaymentStatus.PARTIAL);
    });

    it('returns PENDING when nothing paid', () => {
      expect(derivePaymentStatus(0, 9000)).toBe(PaymentStatus.PENDING);
    });
  });

  describe('toNumber', () => {
    it('converts string decimals', () => {
      expect(toNumber('123.45')).toBe(123.45);
    });
  });
});
