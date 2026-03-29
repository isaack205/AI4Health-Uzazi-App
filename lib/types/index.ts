export type UserRole = "mother" | "chw" | "admin";
export type RiskLevel = "low" | "medium" | "high";
export type Sentiment = "positive" | "neutral" | "negative";

export interface User {
  uid: string;
  email: string;
  phone?: string;
  role: UserRole;
  name: string;
  language: string;
  county: string;
  onboardingComplete?: boolean;
  createdAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export type AppointmentType = "mother_checkup" | "baby_shot" | "chw_visit" | "wellness" | "other";
export type AppointmentStatus = "upcoming" | "completed" | "missed";

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reminded: boolean;
  createdAt: string;
}

export interface Mother extends User {
  postpartumDay: number;
  assignedCHW: string;
  assignedCHWName?: string;
  assignmentStatus?: "stable" | "watch" | "urgent";
  escalationReason?: string;
  autoAssignedAt?: string;
  lastEscalatedCheckInId?: string;
  riskLevel: RiskLevel;
  gardenPetals: number;
  badges: Badge[];
  currentStreak?: number;
  lastCheckInDate?: string;
  lastLoginDate?: string;
  babyDateOfBirth?: string;
  pregnancyNumber?: string;
  deliveryType?: string;
  trustedContactName?: string;
  trustedContactPhone?: string;
}

export interface CHW extends User {
  assignedMothers: string[];
  county: string;
  subCounty: string;
}

export interface CheckInResponse {
  questionId: string;
  questionText: string;
  answer: string | number | boolean;
  sentiment: Sentiment;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: string;
  responses: CheckInResponse[];
  answersMap?: Record<string, string | number | boolean>;
  inputMode?: "guided" | "written";
  dayPostpartum?: number;
  assignedCHW?: string;
  escalatedToCHW?: boolean;
  escalationReason?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  aiSummary: string;
}

export interface CompanionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type AppUser = User | Mother | CHW;
