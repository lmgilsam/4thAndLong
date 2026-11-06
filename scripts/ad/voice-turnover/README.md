# Voice takes for the Turnover on Downs ad

Same two Typecast announcers as The Final Play (paid Basic tier, commercial license).
Drop one take per booth line in this folder, named after the line id, then run
`node scripts/ad/record-ad.cjs --ad turnover --audio-only` (with `npm run dev` running)
to remix the sound onto frames you already recorded. `.wav`, `.mp3` and `.m4a` all work.
Missing takes are skipped.

| File | Voice | Starts at | Read it as |
|---|---|---|---|
| `01-pbp-easy` | Play-by-play | 3.8s | First play of the day. Easiest question on the board. |
| `02-color-free` | Color | 6.75s | Free yards. He's got this. |
| `03-color-allen` | Color | 8.4s | Josh Allen's never even BEEN to one! |
| `04-pbp-lamar` | Play-by-play | 10.6s | Lamar Jackson? Two MVPs! |
| `05-color-rings` | Color | 12.3s | MVPs aren't RINGS! |
| `06-pbp-dont` | Play-by-play | 13.65s | Third down. Don't do it... |
| `07-color-dak` | Color | 16.45s | DAK?! |
| `08-pbp-turnover` | Play-by-play | 17.35s | TURNOVER ON DOWNS! |
| `09-color-zero` | Color | 19.5s | Zero Super Bowl starts between all three of 'em! |
| `10-pbp-tag` | Play-by-play | 22.45s | Fourth and Long. You can do better. Play free at fourth-and-long dot I-O. |

The start times are first guesses for the text-only cut. When the takes arrive,
the scene times in `src/ad/timeline-turnover.ts` get refitted to the real line lengths.
