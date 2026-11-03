-- The Daily Drive: Supabase schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- The browser only talks to the two functions below; tables are locked down.

create table if not exists public.drives (
  id          bigint generated always as identity primary key,
  drive_date  date        not null,
  player_id   text        not null,
  score       int         not null check (score between 0 and 700),
  yards       int         not null check (yards between 0 and 70),
  created_at  timestamptz not null default now(),
  unique (drive_date, player_id)
);

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

create index if not exists plays_prompt_idx on public.plays (drive_date, prompt_id, answer);
create index if not exists drives_date_idx on public.drives (drive_date, score);

alter table public.drives enable row level security;
alter table public.plays  enable row level security;
-- No policies: anonymous users cannot read or write tables directly.

-- Save one finished drive (idempotent per player per day).
create or replace function public.submit_drive(
  p_date date, p_player text, p_score int, p_yards int, p_plays jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date not between (current_date - 1) and (current_date + 1) then
    raise exception 'drive date out of range';
  end if;
  insert into drives (drive_date, player_id, score, yards)
  values (p_date, p_player, p_score, p_yards)
  on conflict (drive_date, player_id) do nothing;
  if not found then return; end if;

  insert into plays (drive_date, player_id, prompt_id, answer, tier, outcome, guesses)
  select p_date, p_player, x->>'prompt_id', x->>'answer', (x->>'tier')::int,
         x->>'outcome', coalesce((x->>'guesses')::int, 1)
  from jsonb_array_elements(p_plays) x;
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

grant execute on function public.submit_drive(date, text, int, int, jsonb) to anon;
grant execute on function public.score_distribution(date, int) to anon;
grant execute on function public.answer_frequency(text) to anon;
