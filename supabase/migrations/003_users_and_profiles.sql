-- 8Hope: User Profiles table
-- Extends Supabase auth.users with app-specific preferences

create table if not exists user_profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  display_name         text,
  divine_time_watch    text references prayer_watches(watch_key),  -- user's chosen watch
  bible_version        text not null default 'KJV',
  screensaver_image    text,
  notify_at_watch      boolean not null default true,
  onboarding_complete  boolean not null default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);
