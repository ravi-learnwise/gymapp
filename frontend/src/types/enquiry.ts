export type EnquiryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'TRIAL'
  | 'CONVERTED'
  | 'LOST';

export type LeadSource =
  | 'WALK_IN'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'ADVERTISEMENT'
  | 'CORPORATE'
  | 'ONLINE_SEARCH'
  | 'OTHER';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Follow-up',
  TRIAL: 'Trial',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

export const STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  FOLLOW_UP: 'bg-amber-100 text-amber-800',
  TRIAL: 'bg-cyan-100 text-cyan-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-slate-100 text-slate-600',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  ADVERTISEMENT: 'Advertisement',
  CORPORATE: 'Corporate',
  ONLINE_SEARCH: 'Online Search',
  OTHER: 'Other',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

/** Next allowed statuses from backend workflow */
export const NEXT_STATUSES: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['FOLLOW_UP', 'TRIAL', 'LOST'],
  FOLLOW_UP: ['CONTACTED', 'TRIAL', 'LOST'],
  TRIAL: ['CONVERTED', 'FOLLOW_UP', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

export type Enquiry = {
  id: string;
  enquiryNumber: string;
  fullName: string;
  age: number | null;
  gender: Gender | null;
  profession: string | null;
  familyDetails: string | null;
  mobileNumber: string;
  alternateContact: string | null;
  email: string | null;
  address: string | null;
  dateOfEnquiry: string;
  preferredContactTime: string | null;
  leadSource: LeadSource;
  status: EnquiryStatus;
  offerValidTill: string | null;
  offeredProgram?: { id: string; name: string } | null;
  offeredDiscount?: { id: string; name: string; percentage: string | null } | null;
  offerCategory?: { id: string; name: string } | null;
  createdBy?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
};

export type EnquiryDetail = Enquiry & {
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: { email: string; firstName: string | null; lastName: string | null };
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: EnquiryStatus | null;
    toStatus: EnquiryStatus;
    createdAt: string;
    changedBy: { email: string; firstName: string | null; lastName: string | null };
  }>;
  reminders: Array<{
    id: string;
    remindAt: string;
    note: string | null;
    completed: boolean;
    createdBy: { email: string; firstName: string | null; lastName: string | null };
  }>;
  member?: { id: string; memberNumber: string } | null;
};

export type EnquiryStats = {
  total: number;
  byStatus: Record<string, number>;
  converted: number;
  lost: number;
  conversionRate: number;
  open: number;
};
