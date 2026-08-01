export interface Question {
  id: string;
  category: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface UserProfile {
  phoneNumber: string;
  maskedPhone: string;
  name: string;
  score: number;
}

export interface ClaimedCharge {
  id: string;
  title: string;
  pointsCost: number;
  date: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
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
  | "CHARGE_STORE";

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
