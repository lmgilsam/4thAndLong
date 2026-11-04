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
npx tsx scripts/lock-schedule.ts     # freezes every drive through today into scripts/schedule-lock.json
```

Testing URLs: `/#practice` plays a random unsaved drive; `/#drive-5` replays drive #5 as practice.

**Before calling any change done:** run `npm run build`, and if you touched `src/data/` or `src/engine/match.ts`, also run `validate-data.ts` (and `match-cases.ts` for matching changes).

Lint currently has 6 known warnings in `src/components/Drive.tsx` and `src/components/Results.tsx` (set-state-in-effect, exhaustive-deps, immutability, only-export-components). Don't add new ones; fix those only if asked or if you're already working in that code.

## Project map

```
src/config.ts            GAME_NAME, GAME_SUBTITLE, SHARE_URL. Rename the game here.
src/data/prompts.ts      THE ANSWER DATABASE: BATCH_1 (31 prompts) + BATCHES list. Add new batches at the END.
src/data/prompts-batch2.ts  BATCH_2 (30 prompts)
src/data/prompts-batch3.ts  BATCH_3 (26 prompts, live from 2026-11-04): league leaders 1980+, HOF RB/LB/OL, draft classes, misc
src/data/team-prompts.ts 96 team prompts (QB/RB/defense x 32 teams), lazy-loaded via ensureAnswers()
src/data/team-index.json Generated list of team prompts (do not hand-edit)
public/teams/*.json      Generated team answer lists (do not hand-edit)
src/data/teams.ts        Shared alias strings for NFL teams (NFL.*) and colleges (CFB.*)
src/data/types.ts        PromptDef / AnswerDef types and the prompt() helper
src/engine/tiers.ts      Tier names, points, yards, colors, emoji; drive constants; outcomes
src/engine/schedule.ts   LAUNCH_DATE, time zone, seeded daily prompt schedule
src/engine/match.ts      Answer matching: normalize, aliases, surnames, typo tolerance
src/engine/storage.ts    localStorage: in-progress drive, stats, streaks, player id
src/lib/backend.ts       Supabase client (optional) for submit + score distribution
src/lib/sound.ts         Sound effects (Web Audio synth + one crowd recording) + mute toggle (dd:sound)
public/sounds/           crowd-cheer.mp3, the recorded crowd used in big cheers
src/lib/fx.ts            Effects bus: fx.confetti / fx.flash / fx.quake (skipped for reduced motion)
src/lib/useCountUp.ts    Scoreboard-style number tick-up hook
src/components/Effects.tsx  Full-screen confetti canvas + flash overlay, mounted once in App
src/components/Teams.tsx    Home-page field: two pixel-art teams at the 50 running a looping pass play
src/components/sprites.ts   The original 8-bit player sprites (stand, ready, stance, block, hold, windup, follow + 4-frame run/carry/reach/holdrun cycles), team colors, skin tones
scripts/schedule-lock.json  Frozen prompt ids for every drive already played
src/App.tsx              Views (home / drive / results), daily vs practice sessions
src/components/          Drive, Results (share text, histogram), Scoreboard, FieldStrip, HowToPlay, RouteArt
supabase/schema.sql      Tables + RPC functions. Run once in Supabase SQL Editor.
scripts/                 validate-data, match-cases, dump-drive, build_team_data.py (+ legends.py) to regenerate team prompts from nflverse data
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

- **New batches need a go-live date.** Append to `BATCHES` as `liveFrom('2026-11-12', BATCH_3)` (import `liveFrom` from `./types`), using a date after today. Batches 1 and 2 are grandfathered as live from launch. A dateless batch 3+ is never scheduled and `validate-data.ts` flags it.
- Reuse `NFL.*` / `CFB.*` from `teams.ts` for teams; append extra aliases with `+ '|Old Name'`.
- Prompt ids are permanent keys (stored in localStorage and in Supabase `plays.prompt_id`). Never rename or reuse an id.
- Every name and alias must match back to its own answer, and no alias can belong to two answers. `validate-data.ts` enforces both.
- Tiers are educated guesses for now. The plan is to re-tier from real player data using `answer_frequency(prompt_id)` in Supabase.
- Facts are currently checked through the 2025 NFL season / Super Bowl LX (Feb 2026). Update the note at the top of `prompts.ts` if you refresh facts.

## Gotchas (read before touching the schedule or data)

- **How the schedule works** (`schedule.ts`): two lanes (general prompts, team prompts) are built one day at a time from Drive #1. Each day takes never-used prompts first, in batch order (each batch has its own shuffle, seed `0x5eed + 1000 x batch`), then prompts that have rested at least `COOLDOWN_DAYS` (7), oldest first with seeded jitter. A day depends only on earlier days and prompts already live, so a batch with a future go-live date never changes past drives or today. If a lane runs short, it falls back to the longest-rested prompts, which breaks the 7-day rule.
- **The 7-day rule needs 35+ live general prompts** (7 days x 5 general plays) and 14+ team prompts. `validate-data.ts` prints the first upcoming drive that would repeat a prompt too soon. Tell Leo when that date is close.
- **Never delete a played prompt or reorder/insert prompts inside a batch that has started playing.** Either one rewrites past drives. Editing answers/aliases inside a prompt is fine. Regenerating team prompts must keep the same ids in the same order.
- **Schedule lock:** `scripts/schedule-lock.json` stores every drive already played. `validate-data.ts` fails if a change alters a locked drive or removes a played prompt. Run `npx tsx scripts/lock-schedule.ts` when shipping prompt changes. Players mid-drive are also protected (their saved drive stores its own `promptIds`).
- `#drive-N` only replays drives up to today, and `/#practice` only draws general prompts already live, so future prompts never leak.
- **Team plays:** Drives 1-4 have 7 general prompts. From Drive #5 (`TEAM_SLOT_FROM`) every drive has 5 general + 2 team prompts (`TEAM_PLAYS_PER_DRIVE`), never two from the same team, never as play 1.
- **Don't change `LAUNCH_DATE` (2026-11-03), `TEAM_SLOT_FROM`, `COOLDOWN_DAYS`, or the seeds** (`0x5eed`, `0x7ea`, `31337`) without asking. That renumbers or reshuffles drives.
- Pool size: 87 general + 96 team = 183 prompts. General prompts are all new through Drive #15 (Nov 17, 2026) and first recycle at Drive #16 (Nov 18); team prompts are all new through Drive #52 (Dec 24). Each new batch of N general prompts adds about N/5 days of all-new drives. Growing the general database is still the priority.
- League-leader stats: nflverse play-by-play undercounts some 1999 games (Warner shows 38 TDs; official is 41). Use nflverse for 2000+ only, grouped by player_id (never by name: there are two Steve Smiths), and official year-by-year leader tables for earlier seasons. Sacks are official only from 1982.
- Team answer lists are generated, not hand-written. Tiers come from a popularity estimate (seasons with the team, stats, career fame, plus the legends list). Fix a bad tier by editing `scripts/legends.py` or the scoring in `build_team_data.py` and regenerating. Data is nflverse (CC BY 4.0); keep the credit line in How to Play.
- Day boundaries use `America/Chicago`. Use `todayKey()` rather than `new Date()` math.
- Matching (`match.ts`): accepts unique surnames ("Mahomes"), returns `ambiguous` when a surname is shared ("Manning"), and allows small typos scaled by length. If you loosen fuzzy matching, run `match-cases.ts` to make sure wrong answers don't start counting.
- The game must work fully without Supabase. If the env vars are missing, only the "vs. everyone today" chart is hidden. Keep it that way.
- Supabase tables have RLS on with no policies. The browser talks only to the `security definer` RPCs (`submit_drive`, `score_distribution`, `answer_frequency`). Don't add direct table access from the client. Score/yard limits in the schema (0-700, 0-70) must match `tiers.ts`.
- localStorage keys are prefixed `dd:`. Changing the shape of `DriveState` or `Stats` can break saved data for existing players; keep changes backward compatible.
- `vite.config.ts` uses `base: './'` so assets load on Vercel and in previews. Leave it.

## Deploy

- GitHub: `lmgilsam/4thAndLong`. Vercel (project `4thandlong`) deploys from it.
- Supabase project `4thAndLong`. Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`; never commit `.env`).
- Analytics: Vercel Web Analytics via `<Analytics />` in `src/main.tsx` (visitors and page views). It only collects once Web Analytics is turned on in the Vercel project. Hobby plan: 50,000 events/month free; collection pauses past that. Custom events need Pro, so per-drive stats stay in Supabase.
- Schema changes: edit `supabase/schema.sql` (keep it idempotent with `create ... if not exists` / `create or replace`) and tell Leo to run it in the SQL Editor.

## Naming (still open)

"4th & Long" is a working name. It's crowded (a 2009 Spike reality show, restaurants, generic articles), so Leo is choosing a final name. Leading candidates so far: **Long Snapper** (top pick), Camp Body, The Sticks, Snap Count. Avoid Mr. Irrelevant (trademarked), Red Zone (NFL RedZone), Sleeper (fantasy app), anything with "NFL", and "Deep Cut" (a Krillion tier name).

When a name is picked, update: `GAME_NAME` / `GAME_SUBTITLE` / `SHARE_URL` in `src/config.ts`, the `<title>` and `og:` tags in `index.html`, the README heading, and the share card copy. "The Daily Drive" stays as the mode name. No custom domain yet.

## Feel: sound and effects

- Sounds (`src/lib/sound.ts`): button click, READY/SET/HUT cadence, whistle at the snap, ticks in the last 5 seconds, thud on a wrong answer, buzzer on delay of game, and touchdown / field goal / punt stingers on the results screen. Mute toggle sits top right.
- Crowd: correct answers get a chime (one note per tier) plus a crowd that scales with rarity: Checkdown silent, Slant light applause, Chunk Play a cheer, Deep Ball a big cheer, House Call the whole stadium plus an air horn. Turnover on Downs gets a short buzzer and boos. Chunk Play and the boos are fully synthesized (noise + vowel-filtered "voices" + claps). Deep Ball, House Call, Touchdown and Field Goal are built on a real crowd recording, `public/sounds/crowd-cheer.mp3` (from Pixabay, free to use under the Pixabay Content License, no attribution needed; trimmed to 7s, normalized to -16 LUFS), with the synth roar, claps and air horn mixed underneath. The recording loads after the first sound plays; if it hasn't loaded or fails, `cheer()` falls back to the synth-only version.
- Crowd on screen (`fx.crowd`): on a cheer the dark drive overlay lifts, the stands bounce and camera flashes fire; on boos the stands dim and the flashes stop.
- Visuals: stadium lights flicker on, haze beams, crowd camera flashes, title slam, hero button shine, score count-up, ball arc and "+N" yard pop, red vignette when the clock is under 5, confetti for Chunk Play and up (footballs on House Call), screen shake on House Call and Touchdown.
- Home field (`Teams.tsx`): 11 gold (offense, left) vs 11 crimson (defense, right) at the line of scrimmage, seen from the sideline. An 11-second loop: pre-snap idle with the ball at the center's hand, shotgun snap to the QB, both lines rise into the `block` pose and lock up face to face at the ball (`ENGAGE` sprite px from the line) and push and pull, QB catches the snap and drops with the ball cradled at his chest (`hold`), winds up (`windup`), releases and follows through (`follow`); the near receiver (`wrNear`) runs, reaches up as the ball arrives (`reach`), catches it and runs with it tucked (`carry`), fade and reset. The separate ball element hides whenever a sprite is holding it. Running is a real 4-frame cycle: running sprites are built from an upper body (`UPPER` in sprites.ts: arms pumping, ball tucked, hands up, QB holding) plus shared `LEGS`, so `run`, `carry`, `reach` and the QB's `holdrun` stay in stride when one turns into another. The cycle advances every `STRIDE` yards covered (`pose()` in Teams.tsx), so speed and leg turnover match. Corners, safety and linebackers turn and run downfield with their man (`TURN_AND_RUN`). Timing constants (`WINDUP`, `FOLLOW`, `REACH`, `THROW`, `CATCH`) sit at the top of `Teams.tsx`. Dev only: `window.__teamsT = 6.6` freezes the play at that second for screenshots. The ball's path is `ballAt()`. Sprites are original art "inspired by" chunky retro football games; don't copy Retro Bowl's actual sprites. Players are placed in 2D with the same perspective math as the turf (520px perspective, 62deg tilt) because CSS 3D transforms blur pixel art. On short screens the formation pulls back so the nearest player stays above the home buttons. Reduced motion: players stand still.
- The results celebration only plays right after a drive ends (`celebrate` in App), not when reopening a finished drive.

## Next up

- Grow the general prompt database (biggest need).
- Re-tier answers from real data once people play: `select * from answer_frequency('heisman');`
- Archive, unlimited mode, themed packs, accounts, ads.
