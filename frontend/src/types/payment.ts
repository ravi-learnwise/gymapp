export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-red-100 text-red-800',
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

export type PaymentCommitmentSummary = {
  id: string;
  totalFee: string;
  discountAmount: string;
  finalAmount: string;
  amountPaid: string;
  pendingAmount: string;
  gstAmount: string;
  gstPercent?: string | null;
  status: PaymentStatus;
  commitmentDate?: string | null;
  commitmentNotes?: string | null;
  member: { id: string; memberNumber: string; fullName: string; mobileNumber: string };
  membership: { program: { name: string } };
};

export type PaymentTransaction = {
  id: string;
  receiptNumber: string;
  amount: string;
  paymentMode: PaymentMode;
  paymentDate: string;
  notes?: string | null;
  recordedBy: { firstName?: string | null; lastName?: string | null; email: string };
};

export type PaymentReminder = {
  id: string;
  remindAt: string;
  note?: string | null;
  completed: boolean;
  createdBy: { firstName?: string | null; lastName?: string | null; email: string };
};

export type PaymentDetail = PaymentCommitmentSummary & {
  membership: {
    program: { name: string };
    programDuration: { label: string; price: string };
  };
  transactions: PaymentTransaction[];
  reminders: PaymentReminder[];
};

export type PaymentStats = {
  total: number;
  pending: number;
  partial: number;
  paid: number;
  outstandingAmount: number;
  dueReminders: number;
};

export type Receipt = {
  gym: { name: string; address?: string | null; gstNumber?: string | null };
  receiptNumber: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: string;
  notes?: string | null;
  member: { fullName: string; memberNumber: string; mobileNumber: string };
  program: string;
  totalFee: string;
  discountAmount: string;
  finalAmount: string;
  amountPaid: string;
  pendingAmount: string;
  gstAmount: string;
  recordedBy: { firstName?: string | null; lastName?: string | null; email: string };
};

export function formatCurrency(value: string | number) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
