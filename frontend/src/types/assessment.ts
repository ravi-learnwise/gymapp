export type FitnessAssessment = {
  id: string;
  memberId: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bodyFat: number | null;
  waist: number | null;
  chest: number | null;
  hip: number | null;
  arm: number | null;
  thigh: number | null;
  medicalHistory: string | null;
  fitnessGoals: string | null;
  notes: string | null;
  assessedAt: string;
  assessedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type CreateAssessmentInput = {
  height?: number;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  medicalHistory?: string;
  fitnessGoals?: string;
  notes?: string;
  assessedAt?: string;
};
