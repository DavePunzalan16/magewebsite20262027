// Database entity types matching Supabase schema

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  course: string | null;
  college: string | null;
  year_level: string | null;
  student_id: string | null;
  phone: string | null;
  role: "admin" | "officer" | "member";
  status: "pending" | "approved" | "rejected";
  interests: string[] | null;
  preferred_department: string | null;
  favorite_anime: string | null;
  favorite_game: string | null;
  favorite_manga: string | null;
  favorite_character: string | null;
  anime_genres: string[] | null;
  game_genres: string[] | null;
  manga_genres: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  category: "general" | "announcement" | "artwork" | "gaming" | "anime" | "meme";
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface Reaction {
  id: number;
  post_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface GuildEvent {
  id: number;
  title: string;
  description: string | null;
  long_description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  tags: string[] | null;
  highlights: string[] | null;
  status: "upcoming" | "ongoing" | "completed";
  max_slots: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: "normal" | "urgent";
  created_by: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string | null;
  image_url: string;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface MembershipApplication {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  student_id: string | null;
  college: string | null;
  course: string | null;
  year_level: string | null;
  interests: string[] | null;
  preferred_department: string | null;
  why_join: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Attendance {
  id: number;
  event_id: number;
  user_id: string;
  status: "present" | "absent" | "late";
  checked_in_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  created_at: string;
}

export interface UserBadge {
  id: number;
  user_id: string;
  badge_id: number;
  awarded_at: string;
}
