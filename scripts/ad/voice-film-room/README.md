# Voice takes for the Film Room #001 ad (Alabama QBs)

Same two Typecast announcers as the other ads. Drop one take per booth line in this folder,
named after the line id, then run `node scripts/ad/record-ad.cjs --ad film-room --audio-only`
(with `npm run dev` running) to remix the sound onto frames you already recorded. `.wav`, `.mp3`
and `.m4a` all work. Missing takes are skipped.

| File | Voice | Starts at | Line |
|---|---|---|---|
| `01-pbp-clue1` | Play-by-play | 3.15s | Clue one. He played quarterback in the NFL. |
| `02-color-snapper` | Color | 5.55s | Well, it's not the long snapper. |
| `03-pbp-clue2` | Play-by-play | 7.65s | Clue two. He played his college ball in the SEC. |
| `04-color-talkin` | Color | 10.25s | Now we're talkin'. |
| `05-pbp-clue3` | Play-by-play | 12.35s | Clue three. He played at Alabama. |
| `06-color-bama` | Color | 14.25s | Ohhh, a BAMA boy! |
| `07-pbp-five` | Play-by-play | 16.00s | Five quarterbacks left, and every one of 'em is right. |
| `08-color-tua` | Color | 18.75s | Tua? Checkdown. |
| `09-color-hurts` | Color | 19.95s | Hurts? Checkdown. |
| `10-color-bryce` | Color | 21.10s | Bryce Young? Checkdown. |
| `11-pbp-hailmary` | Play-by-play | 22.45s | Somebody out there knows the Hail Mary. |
| `12-pbp-tag` | Play-by-play | 26.20s | Fourth and Long. Play free at fourth-and-long dot I-O. |

Scene times in `src/ad/timeline-film-room.ts` are first guesses for the text-only cut.
Once the takes are in, refit the times to the real line lengths and re-record the frames.
