export type Gender = "woman" | "man" | "non_binary" | "other";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  phone: string | null;
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  city: string | null;
  country: string;
  looking_for: string[];
  interests: string[];
  occupation: string | null;
  education: string | null;
  height_cm: number | null;
  is_verified: boolean;
  verification_status: VerificationStatus;
  is_online: boolean;
  last_active: string;
  is_onboarded: boolean;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  primary_photo?: string | null;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  storage_path: string;
  is_primary: boolean;
  order_index: number;
  is_verified: boolean;
  created_at: string;
}

export interface Preferences {
  user_id: string;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  preferred_genders: string[];
  show_me: boolean;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  last_message_at: string | null;
  is_active: boolean;
  other_user?: Profile;
  last_message?: Message | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Wink {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  is_seen: boolean;
  from_user?: Profile;
}
