# CLAUDE.md

Context for Claude when working on this repo. Read this first.

## What this is

**4th & Long: The Daily Drive** is a daily American football trivia browser game modeled on Krillion: keep Krillion's core idea (rarer correct answers score more), but give it a full football look and vocabulary.

- 7 prompts a day, the same for every player. Drives reset at midnight US Central.
- 25-second play clock and 3 downs (guesses) per prompt.
- The ball starts at midfield. Rarer answers gain more yards. 50 yards is a touchdown; finishing inside the opponent 35 is a field goal; anything else is a punt.
- Daily mode is called **"The Daily Drive"** (the football version of Krillion's "Daily Dive").
- Live at https://4thandlong.vercel.app

## Who you're working with

Leo is building this solo. He brings the ideas, the vision, and the football knowledge; Claude does most of the building. Work accordingly:

- Ship working changes, not plans. Make the change, run the checks below, then explain what changed in plain English.
- When a decision is genuinely his (game feel, scoring, naming, what goes in a prompt), ask or offer a short set of options instead of silently picking.
- Football facts matter. If you add or change answers, be accurate. When unsure whether something is true (a record, a winner, a current roster), verify it or flag it rather than guessing.
- Don't use em dashes in player-facing copy or in write-ups for Leo. Use colons, commas, or reword.

## Stack

- Vite + React 19 + TypeScript, no router, no state library. Plain CSS in `src/index.css`.
- Fonts via `@fontsource`: Big Shoulders Display (display), Barlow / Barlow Condensed (body), Doto (LED scoreboard numbers).
- Optional Supabase backend for global stats. Hosted on Vercel.
- Lint with oxlint (not ESLint). Scripts run with `tsx`.

## Commands

```bash
npm install
npm run dev                          # http://localhost:5173
npm run build                        # tsc -b && vite build; must pass before you're done
npm run lint                         # oxlint
npx tsx scripts/validate-data.ts     # checks the answer database; must report "Problems: 0"
npx tsx scripts/match-cases.ts       # spot-checks answer matching against tricky inputs
npx tsx scripts/dump-drive.ts        # prints today's 7 prompts with answers by tier
```

Testing URLs: `/#practice` plays a random unsaved drive; `/#drive-5` replays drive #5 as practice.

**Before calling any change done:** run `npm run build`, and if you touched `src/data/` or `src/engine/match.ts`, also run `validate-data.ts` (and `match-cases.ts` for matching changes).

Lint currently has 3 known warnings in `src/components/Drive.tsx` (set-state-in-effect, exhaustive-deps). Don't add new ones; fix those only if asked or if you're already working in that code.

## Project map

```
src/config.ts            GAME_NAME, GAME_SUBTITLE, SHARE_URL. Rename the game here.
src/data/prompts.ts      THE ANSWER DATABASE (31 prompts). Add or edit prompts here.
src/data/teams.ts        Shared alias strings for NFL teams (NFL.*) and colleges (CFB.*)
src/data/types.ts        PromptDef / AnswerDef types and the prompt() helper
src/engine/tiers.ts      Tier names, points, yards, colors, emoji; drive constants; outcomes
src/engine/schedule.ts   LAUNCH_DATE, time zone, seeded daily prompt schedule
src/engine/match.ts      Answer matching: normalize, aliases, surnames, typo tolerance
src/engine/storage.ts    localStorage: in-progress drive, stats, streaks, player id
src/lib/backend.ts       Supabase client (optional) for submit + score distribution
src/App.tsx              Views (home / drive / results), daily vs practice sessions
src/components/          Drive, Results (share text, histogram), Scoreboard, FieldStrip, HowToPlay, RouteArt
supabase/schema.sql      Tables + RPC functions. Run once in Supabase SQL Editor.
scripts/                 validate-data, match-cases, dump-drive
index.html               Page title and Open Graph / link preview tags
```

## Scoring

| Tier | Name | Points | Yards | Share emoji |
|---|---|---|---|---|
| 1 | Checkdown | 10 | +1 | ⬜ |
| 2 | Slant | 30 | +3 | 🟦 |
| 3 | Chunk Play | 60 | +6 | 🟩 |
| 4 | Deep Ball | 80 | +8 | 🟨 |
| 5 | House Call | 100 | +10 | 🟥 |

10 points = 1 yard. Max score is 700. Misses: **Turnover on Downs** (3 wrong guesses) and **Delay of Game** (clock runs out), both ⬛. All of this lives in `src/engine/tiers.ts`; change it there only.

## Adding or editing prompts

Answers are `"Display Name|alias|alias"` strings grouped by tier, 1 (most common) to 5 (rarest):

```ts
prompt('my-id', 'NFL', 'Name a ...', {
  1: ['Most Common Answer|nickname'],
  3: ['Medium Answer'],
  5: ['Deep Cut Answer'],
}, { ignore: ['bowl'] }),   // optional: words dropped when matching
```

- Reuse `NFL.*` / `CFB.*` from `teams.ts` for teams; append extra aliases with `+ '|Old Name'`.
- Prompt ids are permanent keys (stored in localStorage and in Supabase `plays.prompt_id`). Never rename or reuse an id.
- Every name and alias must match back to its own answer, and no alias can belong to two answers. `validate-data.ts` enforces both.
- Tiers are educated guesses for now. The plan is to re-tier from real player data using `answer_frequency(prompt_id)` in Supabase.
- Facts are currently checked through the 2025 NFL season / Super Bowl LX (Feb 2026). Update the note at the top of `prompts.ts` if you refresh facts.

## Gotchas (read before touching the schedule or data)

- **Changing the prompt pool reshuffles every future day.** `promptsForDrive()` shuffles the whole pool with a fixed seed, so adding, removing, or reordering prompts changes which prompts land on which day, including today for anyone who hasn't started yet. Players mid-drive are protected (their saved drive stores its own `promptIds`). Add prompts in batches and tell Leo when a change will alter upcoming days.
- **Don't change `LAUNCH_DATE` (2026-11-03) or the seed** (`0x5eed`, `7919`) without asking. That renumbers or reshuffles every drive.
- The pool is small: 31 prompts covers about 4 days before cycling. Growing the database is a priority.
- Day boundaries use `America/Chicago`. Use `todayKey()` rather than `new Date()` math.
- Matching (`match.ts`): accepts unique surnames ("Mahomes"), returns `ambiguous` when a surname is shared ("Manning"), and allows small typos scaled by length. If you loosen fuzzy matching, run `match-cases.ts` to make sure wrong answers don't start counting.
- The game must work fully without Supabase. If the env vars are missing, only the "vs. everyone today" chart is hidden. Keep it that way.
- Supabase tables have RLS on with no policies. The browser talks only to the `security definer` RPCs (`submit_drive`, `score_distribution`, `answer_frequency`). Don't add direct table access from the client. Score/yard limits in the schema (0-700, 0-70) must match `tiers.ts`.
- localStorage keys are prefixed `dd:`. Changing the shape of `DriveState` or `Stats` can break saved data for existing players; keep changes backward compatible.
- `vite.config.ts` uses `base: './'` so assets load on Vercel and in previews. Leave it.

## Deploy

- GitHub: `lmgilsam/4thAndLong`. Vercel (project `4thandlong`) deploys from it.
- Supabase project `4thAndLong`. Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`; never commit `.env`).
- Schema changes: edit `supabase/schema.sql` (keep it idempotent with `create ... if not exists` / `create or replace`) and tell Leo to run it in the SQL Editor.

## Naming (still open)

"4th & Long" is a working name. It's crowded (a 2009 Spike reality show, restaurants, generic articles), so Leo is choosing a final name. Leading candidates so far: **Long Snapper** (top pick), Camp Body, The Sticks, Snap Count. Avoid Mr. Irrelevant (trademarked), Red Zone (NFL RedZone), Sleeper (fantasy app), anything with "NFL", and "Deep Cut" (a Krillion tier name).

When a name is picked, update: `GAME_NAME` / `GAME_SUBTITLE` / `SHARE_URL` in `src/config.ts`, the `<title>` and `og:` tags in `index.html`, the README heading, and the share card copy. "The Daily Drive" stays as the mode name. No custom domain yet.

## Next up

- Grow the prompt database (biggest need).
- Re-tier answers from real data once people play: `select * from answer_frequency('heisman');`
- Archive, unlimited mode, themed packs, accounts, ads.
