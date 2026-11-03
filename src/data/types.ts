// Rarity tiers. 1 = most common answer, 5 = rarest.
export type TierId = 1 | 2 | 3 | 4 | 5

export interface AnswerDef {
  /** Display name, e.g. "Patrick Mahomes" */
  name: string
  /** Other accepted spellings / nicknames */
  aliases: string[]
  /** Seeded rarity tier (until real player data takes over) */
  tier: TierId
}

export interface PromptDef {
  id: string
  /** Short category label shown on the card */
  tag: string
  text: string
  /** Words ignored when matching (e.g. "bowl" for bowl games) */
  ignore?: string[]
  answers: AnswerDef[]
  /**
   * First day (YYYY-MM-DD, US Central) this prompt can appear in The Daily Drive.
   * Required for every batch after batch 2. Use a date after today so it can't
   * change drives people have already played.
   */
  from?: string
  /** Team prompts load their answers from public/<src> on demand */
  src?: string
  team?: string
}

/**
 * Answer entries are written as "Display Name|alias|alias" strings,
 * grouped by tier, so the data file stays easy to read and edit.
 */
export type TierBuckets = Partial<Record<TierId, string[]>>

export function prompt(
  id: string,
  tag: string,
  text: string,
  tiers: TierBuckets,
  opts: { ignore?: string[]; from?: string } = {},
): PromptDef {
  const answers: AnswerDef[] = []
  for (const key of Object.keys(tiers)) {
    const tier = Number(key) as TierId
    for (const entry of tiers[tier] ?? []) {
      const [name, ...aliases] = entry.split('|').map((s) => s.trim()).filter(Boolean)
      answers.push({ name, aliases, tier })
    }
  }
  return { id, tag, text, answers, ignore: opts.ignore, from: opts.from }
}

/** Tags a batch of new prompts with the day they go live: liveFrom('2026-11-12', BATCH_3) */
export function liveFrom(date: string, prompts: PromptDef[]): PromptDef[] {
  return prompts.map((p) => ({ ...p, from: p.from ?? date }))
}
