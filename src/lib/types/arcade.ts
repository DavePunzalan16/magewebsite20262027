// Arcade Data Model Types

export interface ArcadeRewardEvent {
  id: number;
  user_id: string;
  event_type: string;
  source_game: string;
  currency_type: "xp" | "mana" | "coins";
  amount: number;
  season_id: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface ArcadeGameStats {
  id: number;
  user_id: string;
  game_key: string;
  wins: number;
  losses: number;
  high_score: number;
  play_time_seconds: number;
  current_streak: number;
  is_favorite: boolean;
  updated_at: string;
}

export interface ArcadeAchievementDef {
  id: number;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  game_key: string | null;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  mana_reward: number;
  created_at: string;
}

export interface ArcadeUserAchievement {
  id: number;
  user_id: string;
  achievement_id: number;
  unlocked_at: string;
  // Joined
  arcade_achievement_defs?: ArcadeAchievementDef;
}

export interface ArcadeQuestDef {
  id: number;
  title: string;
  description: string | null;
  cadence: "daily" | "weekly" | "monthly" | "special";
  game_key: string | null;
  requirement_type: string;
  requirement_count: number;
  xp_reward: number;
  mana_reward: number;
  is_active: boolean;
  season_id: string | null;
  created_at: string;
}

export interface ArcadeUserQuestProgress {
  id: number;
  user_id: string;
  quest_id: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  period_start: string;
  // Joined
  arcade_quest_defs?: ArcadeQuestDef;
}

export interface ArcadeLeaderboardEntry {
  game_key: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  high_score: number;
  wins: number;
  current_streak: number;
  updated_at: string;
}

export interface ArcadeUserPrefs {
  user_id: string;
  music_enabled: boolean;
  reduced_motion: boolean;
  favorite_game: string | null;
  updated_at: string;
}

// Game integration contract — every arcade game implements this
export interface ArcadeGame {
  key: string;
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

export interface ArcadeGameResult {
  score: number;
  won: boolean;
  durationSeconds: number;
}

// Game config for the hub grid
export interface ArcadeGameConfig {
  key: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  avgPlayTime: string;
  rewardPreview: string;
  status: "available" | "coming_soon" | "locked" | "maintenance";
  unlockCondition?: string;
  component?: () => Promise<{ default: React.ComponentType<{ onComplete: (result: ArcadeGameResult) => Promise<void> }> }>;
}
