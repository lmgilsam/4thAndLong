# 4th & Long: The Daily Drive

A daily American football trivia game. Seven prompts a day, a 25-second play clock,
three downs per play. Rarer answers gain more yards. Start at midfield and try to score.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Handy URLs while testing:
- `/#practice` plays a random practice drive (not saved)
- `/#drive-5` replays drive #5 as practice

## How the game works

| Tier | Points | Yards |
|---|---|---|
| Checkdown | 10 | +1 |
| Slant | 30 | +3 |
| Chunk Play | 60 | +6 |
| Deep Ball | 80 | +8 |
| Hail Mary | 100 | +10 |

- The ball starts at midfield. 50 yards (500 pts) is a touchdown; reaching the opponent 35 is field goal range.
- A wrong answer burns a down. Three misses = Turnover on Downs. Clock runs out = Delay of Game.
- Matching forgives typos, accepts last names when unique ("Mahomes"), and asks for more when ambiguous ("Manning").
- Drives reset at midnight US Central. Everyone gets the same 7 prompts (seeded shuffle, no repeats until the pool is used up).

## Project map

```
src/data/prompts.ts     <- THE ANSWER DATABASE. Add prompts here.
src/data/teams.ts       <- shared aliases for NFL teams and colleges
src/engine/match.ts     <- answer matching (normalize, aliases, surnames, typos)
src/engine/schedule.ts  <- daily prompt schedule, launch date, time zone
src/engine/tiers.ts     <- tier names, points, yards, drive outcomes
src/engine/storage.ts   <- local save, streaks, stats
src/lib/backend.ts      <- optional Supabase connection (global stats)
src/config.ts           <- game name, subtitle, share URL
supabase/schema.sql     <- run once in Supabase
scripts/validate-data.ts <- checks the database for conflicts (npx tsx scripts/validate-data.ts)
```

## Adding prompts

In `src/data/prompts.ts`, answers are `"Display Name|alias|alias"` strings grouped by tier 1 (most common) to 5 (rarest):

```ts
prompt('my-id', 'NFL', 'Name a ...', {
  1: ['Most Common Answer|nickname'],
  3: ['Medium Answer'],
  5: ['Deep Cut Answer'],
}),
```

Then run `npx tsx scripts/validate-data.ts` to catch duplicate or conflicting aliases.
Note: adding prompts reshuffles future days, so add them before launch or in batches.

## Team prompts

96 prompts ("Name a QB / RB / defensive player who has played for <team>"), two per
drive from Drive #5 on. Answer lists live in `public/teams/` and load on demand.
They are generated from [nflverse](https://github.com/nflverse/nflverse-data) roster
and stats data (CC BY 4.0, credited in How to Play):

```bash
# download roster_1920.csv ... roster_2025.csv, player_stats_season.csv,
# player_stats_def_season.csv and stats_player_reg_2025.csv into a folder, then:
python3 scripts/build_team_data.py /path/to/nfldata
```

`scripts/legends.py` holds hand-picked pre-1999 legends that get a popularity boost.

## Deploy (Vercel + Supabase)

1. **GitHub:** push this folder to a new repo.
2. **Supabase:** create a project → SQL Editor → paste `supabase/schema.sql` → Run.
   Copy the Project URL and the `anon` public key from Settings → API.
3. **Vercel:** Import the GitHub repo (framework: Vite). Add env vars
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then deploy.
4. Point your domain at Vercel and update `SHARE_URL` in `src/config.ts`.

Without the Supabase env vars the game still works fully; only the
"vs. everyone today" chart is hidden.

## Next up

- Re-tier answers from real data: `select * from answer_frequency('heisman');`
- Archive, unlimited mode, themed packs, accounts, ads
