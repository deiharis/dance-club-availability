// Shape of the /api/analytics response, shared by the route and the Analytics page.

export type HeatCell = { day: string; slot: string; freeCount: number; percentage: number };

export interface AvailabilityData {
  totalMembers: number;
  overall: number; // average free % over every day+slot
  heatmap: HeatCell[];
  bestSlots: HeatCell[]; // top 5
  dayAverages: { day: string; avg: number }[];
  // One object per slot: { slot: "T1", MONDAY: 80, TUESDAY: 72, ... }
  slotCurve: Record<string, number | string>[];
  histogram: { range: string; count: number }[]; // how many members fall in each availability band
  byCategory: { category: string; label: string; avg: number; count: number }[];
  memberAvailability: { id: string; fullName: string; category: string; percentage: number }[];
  noTimetable: number; // members with no CLASS slot saved (NO_TIMETABLE in lib/timetable.ts)
  completion: number; // % of members who have at least one entry
}

export interface MembershipData {
  total: number;
  byCategory: { key: string; label: string; count: number }[];
  byDepartment: { name: string; count: number }[]; // EVERY canonical programme, largest first
  byDegree: { name: string; count: number }[]; // degree level, e.g. "B.Tech", "BBA"
  byYear: { year: string; count: number }[];
  ffcs: { enrolled: number; notEnrolled: number };
  growth: { month: string; joined: number; total: number }[];
}

export interface DanceTeamStat {
  team: string;
  dancers: number;
  professional: number;
  amateur: number;
  present: number;
  absent: number;
  excused: number;
  attendanceRate: number | null; // present / (present + absent), null when nothing marked
  rehearsals: number;
  bestSlot: HeatCell | null; // when most of the team is free
}

export interface DanceData {
  totalDancers: number;
  professional: number;
  amateur: number;
  overallAttendance: number | null;
  teams: DanceTeamStat[];
  attendanceTrend: { label: string; team: string; rate: number; marked: number }[];
  upcomingRehearsals: number;
  upcomingPerformances: number;
  pastPerformances: number;
}

export interface ActivityData {
  reports: { pending: number; approved: number; rejected: number; total: number };
  avgReviewHours: number | null;
  weekly: { week: string; submitted: number; approved: number }[];
  od: { pending: number; approved: number };
  odByEvent: { name: string; count: number }[];
  topContributors: { name: string; approved: number }[];
}

// /api/dance/analytics: one team, for its Dance Lead (or the committee).
export interface TeamAnalytics {
  team: string;
  dancers: number;
  professional: number;
  amateur: number;
  attendanceRate: number | null;
  rehearsalsHeld: number;
  rehearsalsUpcoming: number;
  performancesUpcoming: number;
  pendingReports: number;
  heatmap: HeatCell[];
  bestSlots: HeatCell[];
  everyoneFreeSlots: number; // slots where 100% of the team is free
  members: {
    id: string;
    fullName: string;
    skillLevel: "PROFESSIONAL" | "AMATEUR";
    isLead: boolean;
    present: number;
    absent: number;
    excused: number;
    rate: number | null;
    marked: number;
  }[];
  trend: { label: string; title: string; rate: number }[];
}

export interface AnalyticsData {
  generatedAt: string;
  availability: AvailabilityData;
  membership: MembershipData;
  dance: DanceData | null; // null unless SuperAdmin (other dance teams' data)
  activity: ActivityData;
}
