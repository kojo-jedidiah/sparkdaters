# Spark Date 💘

A beautiful, free, phone-only dating web app designed with an Apple App Store-level UI/UX.  
Optimized for Nigeria (and works worldwide). Built with **Next.js 15 + Supabase**.

## Features

- **Phone OTP signup/login only** (no email/password)
- Clean onboarding: name, birthday, gender, city, bio, primary photo
- **Discover** tab with like / pass / wink actions
- **Matches** (mutual likes auto-created by DB trigger)
- **Winks** — lightweight interest signal
- Real-time **chat** dashboard
- Search **preferences** (age range, genders, pause profile)
- Picture upload to Supabase Storage
- Selfie verification flow (status tracking)
- Fully free, no paid tiers required

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (custom Apple-like design system)
- Supabase Auth (Phone / Twilio), Database, Storage, Realtime
- Framer Motion ready, Lucide icons

## Quick Start

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In **Authentication → Providers → Phone**, enable Phone and configure an SMS provider (Twilio recommended — works in Nigeria and globally).
3. Optional: add test phone numbers in Auth settings for development.

### 2. Run the schema

In the Supabase SQL Editor, paste and run the entire contents of:

```
supabase/schema.sql
```

### 3. Create Storage buckets

In Storage, create three buckets:

| Bucket         | Public | Purpose                    |
|----------------|--------|----------------------------|
| `photos`       | Yes    | Profile photos             |
| `avatars`      | Yes    | Optional smaller avatars   |
| `verifications`| No     | Selfie verification images |

Recommended RLS for `photos` / `avatars`: allow authenticated users to upload to `{user_id}/*` and public read.

### 4. Environment

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    auth/login      → Phone number entry
    auth/verify     → 6-digit OTP
    onboarding      → Profile + photo setup
    discover        → Swipe / like / wink cards
    matches         → Grid of mutual matches
    winks           → Incoming winks
    chat            → Conversation list
    chat/[matchId]  → Real-time chat room
    profile         → Your profile + verification
    preferences     → Age / gender filters
  components/
  lib/supabase/
  types/
supabase/
  schema.sql        → Full database + RLS + triggers
```

## Nigeria Notes

- Phone formatter defaults to `+234` when users type local numbers starting with `0`.
- Works with any country code (international format).
- Twilio (or Vonage / MessageBird) delivers reliably in NG.
- No heavy assets — loads quickly on mobile data.

## Safety

- Row Level Security on every table
- Blocks & reports tables included
- Selfie verification status
- Mutual-match-only messaging

## Next Steps You Can Add

- Full camera selfie capture + admin review UI
- Geo-distance filtering (PostGIS)
- Push notifications
- Photo gallery (multiple images)
- Block / report UI in chat & profile

---

Built with ❤️ for people who just want to meet someone real.
