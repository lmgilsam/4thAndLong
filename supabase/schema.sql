-- The Daily Drive: Supabase schema
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste the whole file -> Run.
-- Safe to run again after changes: everything is "if not exists" / "create or replace".
-- The browser only talks to the functions granted to anon at the bottom; tables are locked down.

create table if not exists public.drives (
  id          bigint generated always as identity primary key,
  drive_date  date        not null,
  player_id   text        not null,
  score       int         not null check (score between 0 and 700),
  yards       int         not null check (yards between 0 and 70),
  created_at  timestamptz not null default now(),
  unique (drive_date, player_id)
);

-- Marketing channel the player first arrived from (?ref= link), null = direct.
alter table public.drives add column if not exists ref text;

create table if not exists public.plays (
  id          bigint generated always as identity primary key,
  drive_date  date        not null,
  player_id   text        not null,
  prompt_id   text        not null,
  answer      text,
  tier        int,
  outcome     text        not null,
  guesses     int         not null default 1,
  created_at  timestamptz not null default now()
);

-- One row per browser the first time it opens the game, with its ?ref= channel.
create table if not exists public.arrivals (
  player_id   text        primary key,
  ref         text,
  created_at  timestamptz not null default now()
);

create index if not exists plays_prompt_idx on public.plays (drive_date, prompt_id, answer);
create index if not exists drives_date_idx on public.drives (drive_date, score);
create index if not exists arrivals_ref_idx on public.arrivals (created_at, ref);

alter table public.drives   enable row level security;
alter table public.plays    enable row level security;
alter table public.arrivals enable row level security;
-- No policies: anonymous users cannot read or write tables directly.

-- Same cleanup as cleanRef() in src/lib/ref.ts: lowercase, a-z 0-9 - _, max 32 chars.
create or replace function public.clean_ref(p_ref text)
returns text language sql immutable as $$
  select nullif(left(trim(both '-' from regexp_replace(lower(coalesce(p_ref, '')), '[^a-z0-9_-]+', '-', 'g')), 32), '');
$$;

-- Older version without p_ref. Dropped so calls can't be ambiguous between the two.
drop function if exists public.submit_drive(date, text, int, int, jsonb);

-- Save one finished drive (idempotent per player per day). Rejects anything that
-- can't be a real drive and trims text, so junk can't pile up in the database.
create or replace function public.submit_drive(
  p_date date, p_player text, p_score int, p_yards int, p_plays jsonb, p_ref text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date not between (current_date - 1) and (current_date + 1) then
    raise exception 'drive date out of range';
  end if;
  if p_player is null or length(p_player) not between 8 and 64 then
    raise exception 'bad player id';
  end if;
  if p_plays is null or jsonb_typeof(p_plays) <> 'array' or jsonb_array_length(p_plays) > 7 then
    raise exception 'bad plays';
  end if;

  insert into drives (drive_date, player_id, score, yards, ref)
  values (p_date, p_player, p_score, p_yards, clean_ref(p_ref))
  on conflict (drive_date, player_id) do nothing;
  if not found then return; end if;

  insert into plays (drive_date, player_id, prompt_id, answer, tier, outcome, guesses)
  select p_date, p_player,
         left(coalesce(x->>'prompt_id', ''), 64),
         left(x->>'answer', 80),
         case when x->>'tier' ~ '^[1-5]$' then (x->>'tier')::int end,
         case when x->>'outcome' in ('hit', 'turnover', 'delay') then x->>'outcome' else 'other' end,
         case when x->>'guesses' ~ '^[0-3]$' then (x->>'guesses')::int else 1 end
  from jsonb_array_elements(p_plays) x;
end $$;

-- Count a browser once, the first time it opens the game.
create or replace function public.log_arrival(p_player text, p_ref text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_player is null or length(p_player) not between 8 and 64 then
    raise exception 'bad player id';
  end if;
  insert into arrivals (player_id, ref) values (p_player, clean_ref(p_ref))
  on conflict (player_id) do nothing;
end $$;

-- Score histogram for a day in 25-point buckets, plus how many players you beat.
create or replace function public.score_distribution(p_date date, p_score int)
returns table (bucket int, players int, total int, beaten int)
language sql security definer set search_path = public stable as $$
  with d as (select score from drives where drive_date = p_date),
  t as (select count(*)::int as total,
               count(*) filter (where score < p_score)::int as beaten from d)
  select (score / 25) * 25 as bucket, count(*)::int, t.total, t.beaten
  from d, t group by 1, t.total, t.beaten order by 1;
$$;

-- How often each answer was given for a prompt (all-time). Use this to
-- re-tier answers from real data once enough people have played.
create or replace function public.answer_frequency(p_prompt text)
returns table (answer text, times int, share numeric)
language sql security definer set search_path = public stable as $$
  with a as (select answer from plays where prompt_id = p_prompt and answer is not null)
  select answer, count(*)::int, round(count(*)::numeric / nullif((select count(*) from a), 0), 4)
  from a group by answer order by 2 desc;
$$;

-- Which marketing links work. Run in the SQL Editor:  select * from ref_report(30);
--   visitors   browsers that opened the game from that link
--   players    of those, how many finished at least one drive
--   drives     total drives finished
--   came_back  players who finished drives on 2+ different days (the number that matters)
-- Not callable from the browser (no anon grant).
create or replace function public.ref_report(p_days int default 30)
returns table (ref text, visitors int, players int, drives int, came_back int)
language sql security definer set search_path = public stable as $$
  with a as (
    select coalesce(ref, 'direct') as r, count(*)::int as visitors
    from arrivals where created_at > now() - make_interval(days => p_days)
    group by 1
  ),
  pp as (
    select coalesce(ref, 'direct') as r, player_id, count(*)::int as n
    from drives where drive_date > current_date - p_days
    group by 1, 2
  ),
  d as (
    select r, count(*)::int as players, sum(n)::int as drives,
           count(*) filter (where n >= 2)::int as came_back
    from pp group by r
  )
  select coalesce(a.r, d.r), coalesce(a.visitors, 0), coalesce(d.players, 0),
         coalesce(d.drives, 0), coalesce(d.came_back, 0)
  from a full join d on a.r = d.r
  order by 2 desc, 3 desc;
$$;

revoke execute on function public.ref_report(int) from public, anon, authenticated;
revoke execute on function public.clean_ref(text) from public, anon, authenticated;

grant execute on function public.submit_drive(date, text, int, int, jsonb, text) to anon;
grant execute on function public.log_arrival(text, text) to anon;
grant execute on function public.score_distribution(date, int) to anon;
grant execute on function public.answer_frequency(text) to anon;
