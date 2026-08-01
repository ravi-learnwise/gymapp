import { EnquiryStatus } from '@prisma/client';
import {
  canTransition,
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
} from './enquiry-workflow';

describe('enquiry-workflow', () => {
  it('allows NEW → CONTACTED', () => {
    expect(canTransition(EnquiryStatus.NEW, EnquiryStatus.CONTACTED)).toBe(true);
  });

  it('blocks NEW → CONVERTED (must go through workflow)', () => {
    expect(canTransition(EnquiryStatus.NEW, EnquiryStatus.CONVERTED)).toBe(false);
  });

  it('allows TRIAL → CONVERTED', () => {
    expect(canTransition(EnquiryStatus.TRIAL, EnquiryStatus.CONVERTED)).toBe(true);
  });

  it('terminal statuses have no outgoing transitions', () => {
    for (const status of TERMINAL_STATUSES) {
      expect(STATUS_TRANSITIONS[status]).toEqual([]);
    }
  });
});
