export type AttendanceRecord = {
  id: string;
  memberId: string;
  checkIn: string;
  checkOut: string | null;
  sessionMinutes: number | null;
  batch: string | null;
  member: {
    id: string;
    memberNumber: string;
    fullName: string;
    mobileNumber: string;
  };
  recordedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type AttendanceListResponse = {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type AttendanceAnalytics = {
  period: string;
  totalCheckIns: number;
  uniqueMembers: number;
  dailyTrend: { date: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  inactiveMembers: { id: string; fullName: string; memberNumber: string }[];
  inactiveCount: number;
  attendanceRate: number;
};
