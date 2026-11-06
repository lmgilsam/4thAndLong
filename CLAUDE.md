# CLAUDE.md

Context for Claude when working on this repo. Read this first.

## What this is

**4th & Long: The Daily Drive** is a daily American football trivia browser game modeled on Krillion: keep Krillion's core idea (rarer correct answers score more), but give it a full football look and vocabulary.

- 7 prompts a day, the same for every player. Drives reset at midnight US Central.
- 25-second play clock and 3 downs (guesses) per prompt.
- The ball starts at midfield. Rarer answers gain more yards. 50 yards is a touchdown; finishing inside the opponent 35 is a field goal; anything else is a punt.
- Daily mode is called **"The Daily Drive"** (the football version of Krillion's "Daily Dive").
- Live at https://4thandlong.io (www and 4thandlong.vercel.app also work; www redirects to the apex)

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
src/data/prompts-batch4.ts  BATCH_4 (30 prompts, live from 2026-11-06, first played Nov 18): HOF TE/DB/DL/coach/HBCU, Super Bowl subsets, AFL/pre-SB champs, former team names, other leagues, mascots, brothers, CFP, Pac-12 exodus, Wildcats/Bulldogs, 100k stadiums, pass rush moves, QB classes 1999/2012/2020
src/data/team-prompts.ts 96 team prompts (QB/RB/defense x 32 teams), lazy-loaded via ensureAnswers()
src/data/team-index.json Generated list of team prompts (do not hand-edit)
public/teams/*.json      Generated team answer lists (do not hand-edit)
src/data/teams.ts        Shared alias strings for NFL teams (NFL.*) and colleges (CFB.*)
src/data/types.ts        PromptDef / AnswerDef types and the prompt() helper
src/engine/tiers.ts      Tier names, points, yards, colors, emoji; drive constants; outcomes
src/engine/schedule.ts   LAUNCH_DATE, time zone, seeded daily prompt schedule
src/engine/match.ts      Answer matching: normalize, aliases, surnames, typo tolerance
src/engine/storage.ts    localStorage: in-progress drive, stats, streaks, player id
src/lib/backend.ts       Supabase client (optional): submit_drive (with ref), log_arrival, score distribution
src/lib/ref.ts           ?ref= / utm_source capture (first touch), cleanup, stored in dd:ref
src/lib/sound.ts         Sound effects (Web Audio synth + one crowd recording) + mute toggle (dd:sound)
public/sounds/           crowd-cheer.mp3, the recorded crowd used in big cheers
src/lib/install.ts       Home screen app: registers the service worker, catches beforeinstallprompt, works out the install path (prompt / iOS / iOS in-app browser / Android menu)
src/components/InstallApp.tsx  GET THE APP button (home + results) and the how-to-install popup
src/sw-template.js       Service worker source; the pwa() plugin in vite.config.ts fills in the file lists and writes dist/sw.js
public/manifest.webmanifest, public/icons/  App name, colors, icons (regenerate PNGs from icons/icon.svg with scripts/app-icons.sh)
src/lib/fx.ts            Effects bus: fx.confetti / fx.flash / fx.quake (skipped for reduced motion)
src/lib/useCountUp.ts    Scoreboard-style number tick-up hook
src/components/Effects.tsx  Full-screen confetti canvas + flash overlay, mounted once in App
src/components/Teams.tsx    Home-page field: pixel-art teams running a looping 4-play touchdown drive
src/components/sprites.ts   The original 8-bit player sprites (stand, ready, stance, block, hold, windup, follow, cheer, cheerball, launch, dive, fall, down, downball + 4-frame run/carry/reach/holdrun cycles), team colors, skin tones
scripts/schedule-lock.json  Frozen prompt ids for every drive already played
src/App.tsx              Views (home / drive / results), daily vs practice sessions
src/components/          Drive, Results (share link, histogram), Scoreboard, FieldStrip, HowToPlay, RouteArt
src/engine/share.ts      Result link codes (/r/3-2222121): encodeShare / decodeShare / shareLabel
api/r.ts                 Edge function behind /r/<code> (vercel.json rewrite): the game page with result og tags
api/card.ts, api/_lib/card.ts  Edge function drawing the 1200x630 PNG result card with @vercel/og
public/og/               Card background (card-bg.jpg, from scripts/card-bg.cjs) and the .woff fonts the card uses
supabase/schema.sql      Tables + RPC functions. Run once in Supabase SQL Editor.
scripts/                 validate-data, match-cases, dump-drive, og-image.cjs (link preview), card-bg.cjs (result card background), build_team_data.py (+ legends.py) to regenerate team prompts from nflverse data
index.html               Page title and Open Graph / link preview tags
```

## Scoring

| Tier | Name | Points | Yards | Share emoji / color |
|---|---|---|---|---|
| 1 | Checkdown | 10 | +1 | ⬜ white `#eef2ee` |
| 2 | Slant | 30 | +3 | 🟩 green `#7ddc5f` |
| 3 | Chunk Play | 60 | +6 | 🟦 blue `#4fa3ff` |
| 4 | Deep Ball | 80 | +8 | 🟪 purple `#b57bff` |
| 5 | Hail Mary | 100 | +10 | 🟨 yellow `#ffd23f` |

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
- Pool size: 117 general + 96 team = 213 prompts. General prompts are all new through Drive #21 (Nov 23, 2026) and first recycle at Drive #22 (Nov 24); team prompts are all new through Drive #52 (Dec 24). Each new batch of N general prompts adds about N/5 days of all-new drives. Growing the general database is still the priority.
- League-leader stats: nflverse play-by-play undercounts some 1999 games (Warner shows 38 TDs; official is 41). Use nflverse for 2000+ only, grouped by player_id (never by name: there are two Steve Smiths), and official year-by-year leader tables for earlier seasons. Sacks are official only from 1982.
- Team answer lists are generated, not hand-written. Tiers come from a popularity estimate (seasons with the team, stats, career fame, plus the legends list). Fix a bad tier by editing `scripts/legends.py` or the scoring in `build_team_data.py` and regenerating. Data is nflverse (CC BY 4.0); keep the credit line in How to Play.
- Day boundaries use `America/Chicago`. Use `todayKey()` rather than `new Date()` math.
- Matching (`match.ts`): accepts unique surnames ("Mahomes"), returns `ambiguous` when a surname is shared ("Manning"), and allows small typos scaled by length. If you loosen fuzzy matching, run `match-cases.ts` to make sure wrong answers don't start counting.
- The game must work fully without Supabase. If the env vars are missing, only the "vs. everyone today" chart is hidden. Keep it that way.
- Supabase tables (`drives`, `plays`, `arrivals`) have RLS on with no policies. The browser talks only to the `security definer` RPCs (`submit_drive`, `log_arrival`, `score_distribution`, `answer_frequency`). `submit_drive` rejects bad player ids and more than 7 plays, and trims/validates every play field. Don't add direct table access from the client. Score/yard limits in the schema (0-700, 0-70) must match `tiers.ts`.
- localStorage keys are prefixed `dd:`. Changing the shape of `DriveState` or `Stats` can break saved data for existing players; keep changes backward compatible.
- `vite.config.ts` uses `base: './'` so assets load on Vercel and in previews. Leave it.

## Deploy

- GitHub: `lmgilsam/4thAndLong`. Vercel (project `4thandlong`) deploys from it.
- Supabase project `4thAndLong`. Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`; never commit `.env`).
- Analytics: Vercel Web Analytics via `<Analytics />` in `src/main.tsx` (visitors and page views). It only collects once Web Analytics is turned on in the Vercel project. Hobby plan: 50,000 events/month free; collection pauses past that. Custom events need Pro, so per-drive stats stay in Supabase.
- Schema changes: edit `supabase/schema.sql` (keep it idempotent with `create ... if not exists` / `create or replace`) and tell Leo to run it in the SQL Editor.

## Naming and domain (settled Nov 4, 2026)

The name is final: **4th & Long** (written "4TH & LONG" on the scoreboard, "4thandlong" in URLs and handles). "The Daily Drive" stays as the mode name. Don't reopen the naming question.

Domain: **4thandlong.io** (bought through Vercel, live Nov 5, 2026). The apex is primary; `www` 308-redirects to it, and 4thandlong.vercel.app keeps working. `SHARE_URL`, `og:url`, `og:image` and the canonical link all use https://4thandlong.io.

## Marketing: link preview and ref tracking

- **Link preview:** `public/og.jpg` (1200x630, about 100 KB so WhatsApp/iMessage show it) plus og/twitter tags in `index.html` (`summary_large_image`). Regenerate with `node scripts/og-image.cjs` while `npm run dev` is running; it screenshots the real home page, hides the buttons, and overlays a tier-square row and the URL. Keep it under ~300 KB. Chats cache previews, so a changed image can take a while to show up.
- **Result links (Share button):** Share copies only a link, e.g. `https://4thandlong.io/r/3-2222121` (drive 3, then one digit per play: the tier, 0 for a miss; practice is `p-<tiers>` or `p5-<tiers>` for a replay). Points, yards and outcome are recomputed from the tiers, so links can't show impossible scores. `vercel.json` rewrites `/r/<code>` to `api/r.ts`, which fetches the normal `index.html`, swaps the og/twitter tags for the result, and adds `<base href="/">` so the relative assets load. og:image is `api/card.ts?c=<code>`, a PNG drawn by `@vercel/og` (pinned to 0.11.1: 1.0.x shipped without a wasm file it needs) from `public/og/card-bg.jpg` and the `.woff` fonts in `public/og/` (Satori can't read woff2). Cards are about 275 KB; keep them under ~300 KB for WhatsApp (the crowd is blurred in the background for that reason). Regenerate the background with `node scripts/card-bg.cjs` while `npm run dev` runs. In the browser, `ref.ts` sends `/r/...` visitors to `/` and tags them `share`. Bad codes redirect to `/` (page) or `/og.jpg` (image). The API code is type-checked through `tsconfig.api.json`.
- **Ref tracking:** links like `https://4thandlong.io/?ref=reddit-texans` (or `utm_source=`). `src/lib/ref.ts` runs before render: saves the first ref a browser ever arrives with (`dd:ref`, cleaned to a-z 0-9 - _, max 32 chars), then strips ref/utm params from the address bar. `logArrival()` sends one `log_arrival` RPC per browser (`dd:ref-sent`), and `submitDrive()` sends `p_ref` with every drive (it retries without `p_ref` if the database hasn't been updated). Players who arrive through a shared result link count as `share`; tagless players count as `direct`.
- **Reading results:** in the Supabase SQL Editor run `select * from ref_report(30);` (visitors, players who finished a drive, drives, and players who came back on 2+ days, per ref). `ref_report` is not granted to anon.
- Vercel Web Analytics on Hobby doesn't show UTM/ref breakdowns (that's Web Analytics Plus), which is why refs live in Supabase.
- **Ref naming convention:** `channel-detail`, lowercase with hyphens, e.g. `reddit-texans`, `tiktok`, `ig-bio`, `x`, `gc-fantasy`, `uh`, `creator-<name>`.

## Home screen app (PWA, added Nov 5, 2026)

- The game installs to the home screen as a full-screen app and works offline after the first visit. No app store.
- **Service worker** (`src/sw-template.js`, built to `dist/sw.js` by the `pwa()` plugin in `vite.config.ts`, build only, registered only in production from `setupInstall()`): pages are network first with a 3.5s timeout, falling back to the cached `index.html`; `/assets/*` (hashed) cache first; other same-origin files (team JSON, sounds, icons) stale-while-revalidate. It never touches `/api/*`, `/_vercel/*`, other origins (Supabase), or non-GET requests. The precache is this build's JS/CSS, Latin `.woff2` fonts, `index.html`, and `PUBLIC_PRECACHE` in `vite.config.ts`; team answer lists are cached when a drive loads them (Drive prefetches both team prompts at the start). The cache version is a hash of the precache list plus `index.html` and the public precache files, so every deploy installs a fresh cache and deletes the old one. If you add a public file the app needs offline, add it to `PUBLIC_PRECACHE`.
- New deploys reach installed players on their next launch (navigation is network first, and the new worker calls `skipWaiting`). Prompt batches ship the same way as on the web, no store review.
- `vercel.json` serves `/sw.js` with `Cache-Control: no-cache` and the manifest as `application/manifest+json`. Don't put the service worker under `/assets/` or rename it: installed players' browsers look for `/sw.js`.
- **Install button** (`InstallButton`): Chrome/Edge/Samsung (Android, desktop) show the browser's own install dialog via the saved `beforeinstallprompt`; iPhone/iPad Safari get Share → Add to Home Screen steps; iOS in-app browsers (Instagram, TikTok, Facebook, Snapchat) are told to open Safari first; other Android browsers get menu steps. Hidden when already running standalone, and on desktop browsers that can't install. The popup renders through a portal because `.home-actions` animates with a transform, which would trap a fixed-position modal.
- **iPhone layout:** `viewport-fit=cover` + `black-translucent` status bar, so the stadium runs under the notch. `.stage`, `.corner-btn`, `.sound-btn` and `.modal-backdrop` pad with `env(safe-area-inset-*)` (0 in a normal browser). Keep that on any new fixed or edge-hugging element.
- Testing: `npm run build && npx vite preview`, then DevTools > Application (Manifest, Service Workers, Cache Storage). Offline: DevTools Network > Offline, reload. Dev server never registers the worker.
- Not built yet: push notifications ("today's drive is live"), which need VAPID keys, a subscriptions table and a scheduled sender (Supabase cron or Vercel cron). iPhone only allows web push for installed apps.

## Feel: sound and effects

- Sounds (`src/lib/sound.ts`): button click, READY/SET/HUT cadence, whistle at the snap, ticks in the last 5 seconds, thud on a wrong answer, buzzer on delay of game, and touchdown / field goal / punt stingers on the results screen. Mute toggle sits top right.
- Crowd: correct answers get a chime (one note per tier) plus a crowd that scales with rarity: Checkdown silent, Slant scattered applause, Chunk Play a cheer, Deep Ball a big cheer, Hail Mary the whole stadium plus an air horn. Turnover on Downs gets a short buzzer and boos (boos are fully synthesized: noise + vowel-filtered "voices"). Every crowd reaction from Slant up, plus Touchdown and Field Goal, uses a real crowd recording (`crowdSample()` in `cheer()`): Slant plays the recording's dying-down applause tail (from ~4.4s) quiet and lowpassed at 2.6 kHz, Chunk Play a lowpassed 2.1s slice of the roar, Deep Ball and up the full roar. The recording is `public/sounds/crowd-cheer.mp3` (from Pixabay, free to use under the Pixabay Content License, no attribution needed; trimmed to 7s, normalized to -16 LUFS); Deep Ball and up mix a light synth roar, claps and the air horn underneath. The recording loads after the first sound plays; if it hasn't loaded or fails, `cheer()` falls back to a synthesized crowd.
- Crowd on screen (`fx.crowd`): on a cheer the dark drive overlay lifts, the stands bounce and camera flashes fire; on boos the stands dim and the flashes stop.
- Visuals: stadium lights flicker on, haze beams, crowd camera flashes, title slam, hero button shine, score count-up, ball arc and "+N" yard pop, red vignette when the clock is under 5, confetti for Chunk Play and up (footballs on Hail Mary), screen shake on Hail Mary and Touchdown.
- Home field (`Teams.tsx`): gold (offense, left) drives on crimson, seen from the sideline. `PLAYS` is a 4-play drive (slant, seam, out, then a post for a touchdown) starting at gold's own 45 (`START_LOS`); each play's ball is spotted where the carrier finishes (`buildDrive()`), and the camera (`cameraAt()`) follows the ball and pans to the next line of scrimmage while players are faded out. Every play uses the same blocking and QB motion; only routes (`routes`, waypoints from each receiver's spot) and the target/catch point (`target`, `catchAt`) change, and throw/catch/whistle timing is derived from them. Corners play man (`MAN`), the safety drives on the ball, linebackers drop and drift. Non-target receivers keep running past the end of their route until the whistle (`along(..., extend)`), then stand; nobody returns to a three-point stance mid-play. Each non-touchdown play ends with a tackle (`tackle()`), one continuous motion timed around contact at `tackleT`: the corner covering the target (or the safety, for the tight end) closes for `CLOSE` seconds, pushes off (`launch`), flies in laid out (`dive`), hits the carrier and drives him back `DRIVE_BACK` yards while the carrier goes `fall` → `downball`; the tackler settles into `down` lying on the carrier's back and legs (`onTop`, lifted a few sprite px) so the carrier's helmet and the ball still show. The next play is spotted where the carrier lands (`carrierPos()`). The field (stripes, yard lines, goal line, end zone, blue line of scrimmage, yellow line to gain) is drawn in SVG by `fieldSvg()` so it scrolls; on the home view it covers the static CSS turf. On the touchdown, offense switches to `cheer` (scorer `cheerball`) and jumps, defense stands, and the backdrop crowd goes wild (`fx.crowd`); then the drive restarts. Whole loop is about 41s.
- Animation details: pre-snap ball at the center's hand, shotgun snap, both lines rise into `block` and lock up face to face (`ENGAGE`) and push and pull, QB `hold` → `windup` → `follow` (short drop on quick throws), target `reach` → `carry` → `hold`. The ball sprite hides whenever a player holds it. Running is a real 4-frame cycle built from an upper body (`UPPER` in sprites.ts) plus shared `LEGS`, so `run`, `carry`, `reach` and `holdrun` stay in stride when one turns into another; the cycle advances every `STRIDE` yards covered. Everyone but linemen and the QB faces the way he's running. Dev only: `window.__teamsT = 35.2` freezes the drive at that global second for screenshots. Sprites are original art "inspired by" chunky retro football games; don't copy Retro Bowl's actual sprites. Players are placed in 2D with the same perspective math as the turf (520px perspective, 62deg tilt) because CSS 3D transforms blur pixel art. On short screens the formation pulls back so the nearest player stays above the home buttons. Reduced motion: the first play's lineup, standing still.
- The results celebration only plays right after a drive ends (`celebrate` in App), not when reopening a finished drive.
- First-time players (no `dd:seen-help`) get How to Play when they start a daily or practice drive. While it's open, `Drive` gets `paused`: the first play sits in a HUDDLE state with the prompt blurred, no cadence sounds, and no `current` saved, so the clock only starts (READY, SET, HUT) after they close it.

## Next up

- Grow the general prompt database (biggest need).
- Re-tier answers from real data once people play: `select * from answer_frequency('heisman');`
- Archive, unlimited mode, themed packs, accounts, ads.
