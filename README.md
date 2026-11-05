# 4th & Long: The Daily Drive

A daily American football trivia game. Seven prompts a day, a 25-second play clock,
three downs per play. Rarer answers gain more yards. Start at midfield and try to score.

**Play it:** https://4thandlong.io

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

| Tier | Points | Yards | Color / share square |
|---|---|---|---|
| Checkdown | 10 | +1 | white ⬜ |
| Slant | 30 | +3 | green 🟩 |
| Chunk Play | 60 | +6 | blue 🟦 |
| Deep Ball | 80 | +8 | purple 🟪 |
| Hail Mary | 100 | +10 | yellow 🟨 |

- The ball starts at midfield. 50 yards (500 pts) is a touchdown; reaching the opponent 35 is field goal range.
- A wrong answer burns a down. Three misses = Turnover on Downs. Clock runs out = Delay of Game.
- Matching forgives typos, accepts last names when unique ("Mahomes"), and asks for more when ambiguous ("Manning").
- Drives reset at midnight US Central. Everyone gets the same 7 prompts (seeded shuffle; new prompts are used first, and a prompt rests at least 7 days before it repeats).
- First-time players see How to Play before their first drive; the play clock waits until they close it.

## Project map

```
src/data/prompts.ts     <- THE ANSWER DATABASE: batch 1 + the BATCHES list
src/data/prompts-batch*.ts <- batches 2, 3, 4 (add new batches as new files)
src/data/teams.ts       <- shared aliases for NFL teams and colleges
src/engine/match.ts     <- answer matching (normalize, aliases, surnames, typos)
src/engine/schedule.ts  <- daily prompt schedule, launch date, time zone
src/engine/tiers.ts     <- tier names, points, yards, drive outcomes
src/engine/storage.ts   <- local save, streaks, stats
src/lib/backend.ts      <- optional Supabase connection (global stats, ref tracking)
src/lib/ref.ts          <- ?ref= marketing link capture
src/config.ts           <- game name, subtitle, share URL
supabase/schema.sql     <- run once in Supabase
scripts/validate-data.ts <- checks the database for conflicts (npx tsx scripts/validate-data.ts)
```

## Adding prompts

Answers are `"Display Name|alias|alias"` strings grouped by tier 1 (most common) to 5 (rarest):

```ts
prompt('my-id', 'NFL', 'Name a ...', {
  1: ['Most Common Answer|nickname'],
  3: ['Medium Answer'],
  5: ['Deep Cut Answer'],
}),
```

New prompts go in a new batch file (for example `src/data/prompts-batch5.ts`), added to the
end of `BATCHES` in `src/data/prompts.ts` with a go-live date after today:
`liveFrom('2026-11-20', BATCH_5)`. That way they can never change a drive people already played.

Before pushing, run:

```bash
npx tsx scripts/validate-data.ts   # must say "Problems: 0"
npx tsx scripts/lock-schedule.ts   # freezes every drive played so far
npm run build
```

Never delete, rename or reorder a prompt that has already been played.

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
4. The domain is **4thandlong.io** (bought through Vercel; `www` redirects to it).
   `SHARE_URL` in `src/config.ts` and the link preview tags in `index.html` use it.

Whenever `supabase/schema.sql` changes, paste the whole file into the SQL Editor again
and Run. It's safe to re-run and keeps existing data.

Without the Supabase env vars the game still works fully; only the
"vs. everyone today" chart is hidden.

## Marketing links

Add `?ref=` to any link you post so you can see which channels bring players who come back:
`https://4thandlong.io/?ref=reddit-texans`, `?ref=tiktok`, `?ref=ig-bio`, `?ref=gc-fantasy`.
Then in the Supabase SQL Editor run:

```sql
select * from ref_report(30);
```

It shows visitors, players who finished a drive, total drives, and players who came back
on 2+ days for each ref. Shared results use a clean link and count as `direct`.

The link preview image is `public/og.jpg`. To redo it after a design change, run
`npm run dev`, then `node scripts/og-image.cjs`.

## Next up

- Grow the general prompt pool (all-new drives currently run through Nov 23, 2026)
- Re-tier answers from real data: `select * from answer_frequency('heisman');`
- Archive, unlimited mode, themed packs, accounts, ads
