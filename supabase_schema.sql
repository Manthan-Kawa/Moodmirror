-- ══════════════════════════════════════════════════
-- MoodMirror — Full Database Schema
-- Run this in Supabase SQL Editor → New query → Run
-- ══════════════════════════════════════════════════

-- 1. User Profiles (linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  theme_preference text default 'dark',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Mood Logs (face / voice / journal analysis results)
create table public.mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  overall_score int,           -- 0–100
  primary_emotion text,        -- e.g. "Calm", "Stressed"
  source text,                 -- 'face' | 'voice' | 'journal'
  raw_data jsonb,              -- full breakdown JSON
  timestamp timestamptz default now()
);
alter table public.mood_logs enable row level security;
create policy "Users can crud own mood_logs" on public.mood_logs using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 3. Journal Entries
create table public.journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  entry_text text,
  nlp_sentiment_score float,   -- -1.0 (negative) to +1.0 (positive)
  tags jsonb,                  -- [{ label, color }]
  created_at timestamptz default now()
);
alter table public.journals enable row level security;
create policy "Users can crud own journals" on public.journals using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 4. Chat History (Lumi conversations)
create table public.chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  role text,                   -- 'user' | 'ai'
  message text,
  timestamp timestamptz default now()
);
alter table public.chat_history enable row level security;
create policy "Users can crud own chat_history" on public.chat_history using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 5. Addresses
create table public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  label text,                  -- 'Home' | 'Work' | 'Other'
  street text,
  city text,
  coordinates jsonb,           -- { lat, lng }
  is_default boolean default false,
  created_at timestamptz default now()
);
alter table public.addresses enable row level security;
create policy "Users can crud own addresses" on public.addresses using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Booked Sessions
create table public.booked_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  therapist_name text,
  session_date date,
  session_time text,
  status text default 'Upcoming',
  session_type text,
  created_at timestamptz default now()
);
alter table public.booked_sessions enable row level security;
create policy "Users can crud own booked_sessions" on public.booked_sessions using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  icon text,
  title text,
  body text,
  time_label text,
  unread boolean default true,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users can crud own notifications" on public.notifications using (auth.uid() = user_id) with check (auth.uid() = user_id);
