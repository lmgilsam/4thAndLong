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
  opts: { ignore?: string[] } = {},
): PromptDef {
  const answers: AnswerDef[] = []
  for (const key of Object.keys(tiers)) {
    const tier = Number(key) as TierId
    for (const entry of tiers[tier] ?? []) {
      const [name, ...aliases] = entry.split('|').map((s) => s.trim()).filter(Boolean)
      answers.push({ name, aliases, tier })
    }
  }
  return { id, tag, text, answers, ignore: opts.ignore }
}
