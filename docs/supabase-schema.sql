-- 3D Asset Dashboard Supabase setup
-- Run this in the Supabase SQL editor before enabling persistent uploads.

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  file_url text not null,
  type text not null check (type in ('glb', 'gltf', 'fbx', 'obj')),
  size bigint not null check (size >= 0 and size <= 52428800),
  tags text[] default '{}',
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists assets_uploaded_at_idx
  on public.assets (uploaded_at desc);

create index if not exists assets_type_idx
  on public.assets (type);

create index if not exists assets_tags_idx
  on public.assets using gin (tags);

alter table public.assets enable row level security;

drop policy if exists "Service role manages assets" on public.assets;
create policy "Service role manages assets"
  on public.assets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create a public Storage bucket named `assets` in the Supabase dashboard.
-- The backend also attempts to create it on startup when service credentials
-- are configured, but dashboard creation keeps first deploys predictable.
