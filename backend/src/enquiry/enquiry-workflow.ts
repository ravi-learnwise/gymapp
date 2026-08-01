import { EnquiryStatus } from '@prisma/client';

/** Allowed status transitions per MVP workflow */
export const STATUS_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: [EnquiryStatus.CONTACTED, EnquiryStatus.LOST],
  CONTACTED: [EnquiryStatus.FOLLOW_UP, EnquiryStatus.TRIAL, EnquiryStatus.LOST],
  FOLLOW_UP: [EnquiryStatus.CONTACTED, EnquiryStatus.TRIAL, EnquiryStatus.LOST],
  TRIAL: [EnquiryStatus.CONVERTED, EnquiryStatus.FOLLOW_UP, EnquiryStatus.LOST],
  CONVERTED: [],
  LOST: [],
};

export function canTransition(from: EnquiryStatus, to: EnquiryStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const TERMINAL_STATUSES: EnquiryStatus[] = [
  EnquiryStatus.CONVERTED,
  EnquiryStatus.LOST,
];
