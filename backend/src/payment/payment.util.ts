import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export function computePaymentAmounts(
  totalFee: number,
  discountAmount: number,
  gstPercent?: number | null,
) {
  const finalAmount = Math.max(0, totalFee - discountAmount);
  const gstAmount =
    gstPercent && gstPercent > 0
      ? Math.round(finalAmount * (gstPercent / 100) * 100) / 100
      : 0;
  return { finalAmount, gstAmount };
}

export function derivePaymentStatus(
  amountPaid: number,
  finalAmount: number,
): PaymentStatus {
  if (amountPaid >= finalAmount) return PaymentStatus.PAID;
  if (amountPaid > 0) return PaymentStatus.PARTIAL;
  return PaymentStatus.PENDING;
}

export function toNumber(value: Decimal | number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
