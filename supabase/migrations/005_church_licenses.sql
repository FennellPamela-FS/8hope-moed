-- 8Hope: Church / Organization Licenses (Phase 2)
-- Supports white-label licensing for churches and organizations

create table if not exists church_licenses (
  id            uuid primary key default gen_random_uuid(),
  church_name   text not null,
  license_key   text unique not null default gen_random_uuid()::text,
  branding      jsonb not null default '{
    "app_name": "8Hope",
    "primary_color": "#1E3A5F"
  }',
  max_users     int not null default 100,
  active_until  date not null,
  created_at    timestamptz default now()
);

-- Only service role can manage licenses (admin-only)
alter table church_licenses enable row level security;

create policy "Service role manages licenses"
  on church_licenses for all
  using (auth.role() = 'service_role');
