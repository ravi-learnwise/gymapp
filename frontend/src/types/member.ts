import type { Gender, LeadSource } from './enquiry';

export type Member = {
  id: string;
  memberNumber: string;
  fullName: string;
  mobileNumber: string;
  alternateContact?: string | null;
  email?: string | null;
  address?: string | null;
  gender?: Gender | null;
  profession?: string | null;
  familyDetails?: string | null;
  dateOfBirth?: string | null;
  height?: string | null;
  weight?: string | null;
  bmi?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  dietType?: string | null;
  sportsParticipation?: string | null;
  fitnessGoals?: string | null;
  isActive: boolean;
  createdAt: string;
  memberships?: MembershipSummary[];
  enrollment?: {
    id: string;
    enrollmentNumber: string;
    enrolledAt: string;
    enrolledBy: { firstName?: string | null; lastName?: string | null; email: string };
  } | null;
  sourceEnquiry?: { id: string; enquiryNumber: string } | null;
};

export type MembershipSummary = {
  id: string;
  isTrial: boolean;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  program: { id?: string; name: string };
  programDuration?: { id?: string; label: string; months: number; price?: string };
  trainer?: { id?: string; firstName?: string | null; lastName?: string | null; email?: string } | null;
};

export type EnrollmentPrefill = {
  enquiry: {
    id: string;
    enquiryNumber: string;
    fullName: string;
    age?: number | null;
    gender?: Gender | null;
    profession?: string | null;
    familyDetails?: string | null;
    mobileNumber: string;
    alternateContact?: string | null;
    email?: string | null;
    address?: string | null;
    leadSource: LeadSource;
    preferredContactTime?: string | null;
    dateOfEnquiry: string;
    status: string;
    offeredProgram?: {
      id: string;
      name: string;
      durations: { id: string; label: string; months: number; price: string }[];
    } | null;
    offeredProgramDuration?: { id: string; label: string; months: number; price: string } | null;
    offeredDiscount?: { id: string; name: string; percentage?: string | null } | null;
    offeredFlatDiscount?: string | null;
    offerCategory?: { id: string; name: string } | null;
    offerValidTill?: string | null;
  };
  suggestedProgramId?: string | null;
  suggestedDurationId?: string | null;
};

export type ExpiringMembershipItem = {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  mobileNumber: string;
  program: string;
  duration: string;
  endDate: string;
  daysRemaining: number;
  trainer: string | null;
};

export type ExpiringMembershipResponse = {
  summary: { within7: number; within15: number; within30: number; beyond30: number };
  items: ExpiringMembershipItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type Trainer = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type ProgramWithDurations = {
  id: string;
  name: string;
  durations: { id: string; label: string; months: number; price: string; isActive: boolean }[];
};

export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function trainerName(t?: { firstName?: string | null; lastName?: string | null; email?: string } | null) {
  if (!t) return '—';
  return [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email || '—';
}
