# Voice takes for the Final Play ad

The takes here are AI voices made on Typecast (typecast.ai) on Nov 6, 2026, trimmed and lightly
sped up (lines 01 and 02). The ad's timing in `src/ad/timeline.ts` is fitted to them.

Drop one take per booth line in this folder, named after the line id, then run
`node scripts/ad/record-ad.cjs --audio-only` (with `npm run dev` running) to remix
the sound onto the frames you already recorded. `.wav`, `.mp3` and `.m4a` all work.
Missing takes are skipped, so you can add them one at a time.

| File | Voice | Starts at | Read it as |
|---|---|---|---|
| `01-pbp-bag` | Play-by-play | 3.2s | Field goal's already in the bag. They want six. |
| `02-color-brady` | Color | 5.65s | Do NOT say Brady. Brady's a checkdown. One yard. |
| `03-pbp-thinking` | Play-by-play | 9.55s | Oh... he's thinking about it... |
| `04-color-no` | Color | 11.15s | NO! |
| `05-pbp-hostetler` | Play-by-play | 13.88s | ...Hostetler? |
| `06-pbp-hail-mary` | Play-by-play | 14.95s | HAIL MARY! |
| `07-pbp-touchdown` | Play-by-play | 17.45s | TOUCHDOWN! |
| `08-color-xxv` | Color | 18.45s | Super Bowl twenty-five! WHO SAYS HOSTETLER?! |
| `09-pbp-tag` | Play-by-play | 21.65s | Fourth and Long. Play free at fourth-and-long dot I-O. |

Trim silence off the front of each take: the take starts playing the moment its
line appears. The recorder levels every take and ducks the crowd under it, and it
warns you if a take runs into the next line. To move a line, change its `start`
(and `end`) in `src/ad/timeline.ts`; the on-screen text moves with it.
