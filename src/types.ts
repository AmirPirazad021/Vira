export interface Question {
  id: string;
  category: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  source?: string;
  difficulty?: "ساده" | "متوسط" | "سخت";
  isActive?: boolean;
  isOffline?: boolean;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  maskedPhone: string;
  name: string;
  score: number;
  level: number;
  diamonds: number;
  role: "user" | "admin";
  isBlocked?: boolean;
  createdAt?: string;
  lastActive?: string;
  totalAdsWatched?: number;
  totalRedemptions?: number;
}

export interface QuestionSuggestion {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  explanation?: string;
  source?: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  adminNote?: string;
  rewardPoints: number;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  isVip?: boolean;
  questionCount?: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  isImportant: boolean;
  targetGroup: "همگان" | "کاربران ویژه" | "سطوح بالا";
  readBy: string[]; // array of userIds
}

export interface AdRewardLog {
  id: string;
  userId: string;
  userName: string;
  adNetwork: "tapsell" | "admob";
  pointsEarned: number;
  timestamp: string;
  ip: string;
}

export interface ChargeItem {
  id: string;
  operator: "همراه اول" | "ایرانسل" | "رایتل";
  title: string;
  faceValue: string;
  pointsCost: number;
  codeRaw?: string;
  codeEncrypted: string;
  isRedeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: string;
}

export interface ChargeRedemption {
  id: string;
  userId: string;
  userName: string;
  chargeTitle: string;
  operator: string;
  pointsCost: number;
  codeRevealed: string;
  date: string;
  ip: string;
}

export type ClaimedCharge = ChargeRedemption;

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "quiz_reward" | "ad_reward" | "question_approved" | "charge_redeemed" | "daily_gift" | "referral";
  description: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
  level?: number;
}

export type ScreenType =
  | "SPLASH"
  | "AUTH"
  | "DASHBOARD"
  | "GAME_MODES"
  | "CONFIRM_TOPIC"
  | "SELECT_CATEGORY"
  | "QUIZ"
  | "GAME_OVER"
  | "LEADERBOARD"
  | "PROFILE"
  | "INBOX"
  | "CHARGE_STORE"
  | "SUGGESTIONS"
  | "ADMIN";

export interface GameModeInfo {
  id: string;
  name: string;
  englishId: string;
  entryFee: number;
  rewardPoints: number;
  bgGradient: string;
}

export interface MessageItem {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}
