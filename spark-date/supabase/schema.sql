-- =====================================================
-- Spark Date - Complete Supabase Schema
-- Phone-only auth dating app optimized for Nigeria & global
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,                          -- from auth
  display_name TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  gender TEXT CHECK (gender IN ('woman', 'man', 'non_binary', 'other')),
  birth_date DATE,
  city TEXT,                                  -- e.g. Lagos, Abuja, Port Harcourt
  country TEXT DEFAULT 'NG',                  -- ISO code, default Nigeria
  looking_for TEXT[] DEFAULT '{}',            -- ['women', 'men', 'everyone']
  interests TEXT[] DEFAULT '{}',
  occupation TEXT,
  education TEXT,
  height_cm INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,          -- selfie verification
  verification_status TEXT DEFAULT 'none' 
    CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
  is_online BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_onboarded BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHOTOS
-- =====================================================
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,          -- photo authenticity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_user ON public.photos(user_id);

-- =====================================================
-- PREFERENCES (search & discovery filters)
-- =====================================================
CREATE TABLE public.preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 18 CHECK (min_age >= 18),
  max_age INTEGER DEFAULT 45 CHECK (max_age <= 99),
  max_distance_km INTEGER DEFAULT 50,         -- for future geo
  preferred_genders TEXT[] DEFAULT ARRAY['woman', 'man'],
  show_me BOOLEAN DEFAULT TRUE,               -- appear in discovery
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LIKES / SWIPES
-- =====================================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_likes_from ON public.likes(from_user_id);
CREATE INDEX idx_likes_to ON public.likes(to_user_id);

-- =====================================================
-- PASSES (so we don't show again)
-- =====================================================
CREATE TABLE public.passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_passes_from ON public.passes(from_user_id);

-- =====================================================
-- MATCHES (mutual likes)
-- =====================================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)                 -- canonical order
);

CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);

-- =====================================================
-- MESSAGES
-- =====================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_match ON public.messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- =====================================================
-- WINKS (lightweight interest signal)
-- =====================================================
CREATE TABLE public.winks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_seen BOOLEAN DEFAULT FALSE,
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_winks_to ON public.winks(to_user_id, is_seen);

-- =====================================================
-- SELFIE VERIFICATION REQUESTS
-- =====================================================
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON public.verifications(user_id);
CREATE INDEX idx_verifications_status ON public.verifications(status);

-- =====================================================
-- BLOCKS & REPORTS (safety)
-- =====================================================
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'fake_profile', 'harassment', 'inappropriate_photos',
    'underage', 'scam', 'other'
  )),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-create profile + preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create match when mutual like happens
CREATE OR REPLACE FUNCTION public.check_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mutual_exists BOOLEAN;
  u1 UUID;
  u2 UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.likes
    WHERE from_user_id = NEW.to_user_id
      AND to_user_id = NEW.from_user_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    -- Canonical order
    IF NEW.from_user_id < NEW.to_user_id THEN
      u1 := NEW.from_user_id;
      u2 := NEW.to_user_id;
    ELSE
      u1 := NEW.to_user_id;
      u2 := NEW.from_user_id;
    END IF;

    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (u1, u2)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_create_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.check_for_match();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Photos
CREATE POLICY "Photos viewable by authenticated"
  ON public.photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users manage own photos"
  ON public.photos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Preferences
CREATE POLICY "Users manage own preferences"
  ON public.preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "Users can see likes they sent or received"
  ON public.likes FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Passes
CREATE POLICY "Users manage own passes"
  ON public.passes FOR ALL
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Matches
CREATE POLICY "Users see their matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages
CREATE POLICY "Users see messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Winks
CREATE POLICY "Users see winks involving them"
  ON public.winks FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send winks"
  ON public.winks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can mark received winks as seen"
  ON public.winks FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Verifications
CREATE POLICY "Users manage own verifications"
  ON public.verifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Blocks
CREATE POLICY "Users manage own blocks"
  ON public.blocks FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- =====================================================
-- Create buckets: 
--   avatars (public)
--   photos (public)
--   verifications (private)
--
-- Example policies for storage.objects:
-- Allow authenticated users to upload to their own folder
-- Allow public read on avatars and photos

-- =====================================================
-- REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.winks;

-- =====================================================
-- HELPER VIEW: Discover candidates (simplified)
-- =====================================================
CREATE OR REPLACE VIEW public.discoverable_profiles AS
SELECT 
  p.*,
  (SELECT url FROM public.photos ph WHERE ph.user_id = p.id AND ph.is_primary LIMIT 1) AS primary_photo
FROM public.profiles p
WHERE p.is_onboarded = true
  AND p.profile_complete = true
  AND p.show_me = true;  -- note: join preferences in real queries
