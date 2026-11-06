# Voice takes for the Turnover on Downs ad

Same two Typecast announcers as The Final Play (paid Basic tier, commercial license).
Drop one take per booth line in this folder, named after the line id, then run
`node scripts/ad/record-ad.cjs --ad turnover --audio-only` (with `npm run dev` running)
to remix the sound onto frames you already recorded. `.wav`, `.mp3` and `.m4a` all work.
Missing takes are skipped.

| File | Voice | Starts at | Line |
|---|---|---|---|
| `01-pbp-easy` | Play-by-play | 3.85s | First play of the day. Easiest question on the board. (1.1x) |
| `02-color-free` | Color | 6.75s | Free yards, he's got this. |
| `03-color-allen` | Color | 9.3s | Josh Allen? He's never even been to one! (1.1x) |
| `04-pbp-lamar` | Play-by-play | 13.1s | Lamar Jackson? Two MVPs! (1.1x) |
| `05-color-rings` | Color | 16.9s | MVPs aren't rings! |
| `06-pbp-dont` | Play-by-play | 19.45s | Third down. Don't do it... |
| `07-color-dak` | Color | 22.05s | Dak? |
| `08-pbp-turnover` | Play-by-play | 22.8s | Turnover! |
| `09-color-what` | Color | 27.05s | What should he have said? (voice only, over the end card question) |

These were cut from one Typecast file (Second_AD_audio.mp3, Nov 6, 2026) at its
pauses, with silence trimmed. Scene times in `src/ad/timeline-turnover.ts` are fitted to them,
so new takes of different lengths need the times refitted.
