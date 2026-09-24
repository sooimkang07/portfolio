-- Run once in Supabase → SQL editor. Shared comments for the About page video feed.
create table if not exists public.reel_comments (
  id bigint generated always as identity primary key,
  clip text not null check (char_length(clip) <= 40),
  name text check (char_length(name) <= 40),
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  delete_token text
);
-- For tables created before delete support:
alter table public.reel_comments add column if not exists delete_token text;
create index if not exists reel_comments_clip_idx on public.reel_comments (clip, created_at desc);
alter table public.reel_comments enable row level security;
-- Anyone can read visible comments and add new ones. The delete_token column is never readable from the site.
create policy "read visible" on public.reel_comments for select using (hidden = false);
create policy "add comment" on public.reel_comments for insert with check (hidden = false);
-- Hide a comment later:  update public.reel_comments set hidden = true where id = <id>;

revoke select on public.reel_comments from anon;
grant select (id, clip, name, body, created_at, hidden) on public.reel_comments to anon;
grant insert (clip, name, body, delete_token) on public.reel_comments to anon;
-- Commenters can delete their own comment: the browser that posted it keeps the secret token.
create or replace function public.delete_reel_comment(p_id bigint, p_token text)
returns void language sql security definer set search_path = public as $$
  delete from public.reel_comments where id = p_id and delete_token is not null and delete_token = p_token;
$$;
grant execute on function public.delete_reel_comment(bigint, text) to anon;
