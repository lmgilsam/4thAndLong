import { prompt, type PromptDef } from './types'

// Batch 5 (added Nov 6, 2026). Built for the "Film Room #001" ad (Alabama QBs).
// Answer list: SI's all-time Alabama players in the NFL (players who were on an NFL
// active roster, not practice squad), updated Aug 31, 2026, plus Ty Simpson
// (Rams, 13th overall pick in 2026). Mike Shula and John Parker Wilson never made
// an active roster, so they're left out on purpose.

export const BATCH_5: PromptDef[] = [
  prompt('bama-qb', 'College', 'Name an Alabama quarterback who made it to the NFL', {
    1: ['Tua Tagovailoa|Tua', 'Jalen Hurts', 'Bryce Young'],
    2: ['Mac Jones', 'Joe Namath|Broadway Joe'],
    3: ['Bart Starr', 'Ken Stabler|Kenny Stabler|Snake Stabler', 'AJ McCarron|A.J. McCarron', 'Jalen Milroe'],
    4: ['Greg McElroy', 'Brodie Croyle', 'Richard Todd', 'Ty Simpson'],
    5: ['Jeff Rutledge', 'Scott Hunter', 'Jay Barker', 'Steve Sloan', 'Harry Gilmer', 'Riley Smith', 'Bob Trocolor'],
  }),
]
