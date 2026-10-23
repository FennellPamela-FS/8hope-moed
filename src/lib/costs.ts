// ─── Count the Costs ─────────────────────────────────────────────────────────
// "For which of you, intending to build a tower, sitteth not down first, and
// counteth the cost…" (Luke 14:28). Shared math for the admin cost page and
// its Home card. AI cost = token counts × list prices (thinking tokens bill
// as output); fixed costs are entered by hand.

export interface UsageRow {
  created_at: string
  user_id: string | null
  feature: string
  model: string
  input_tokens: number
  output_tokens: number
  thinking_tokens: number
  ok: boolean
}
export interface ModelPrice { model: string; input_per_m: number; output_per_m: number; note: string | null }
export interface FixedCost { id: string; name: string; monthly_usd: number; note: string | null }

export interface FeatureCost {
  feature: string
  label: string
  calls: number
  failed: number
  tokens: number
  list: number        // USD at list price
  discounted: number  // USD with the current promo applied
}

export const FEATURE_LABELS: Record<string, string> = {
  'moed-daily': 'Moed — daily verses (once per day, shared)',
  'moed-extras': 'Moed — Reflection & Deeper Word Study',
  'axios-guide': 'AXIOS — 7-day guide',
  'axios-suggest-anchors': 'AXIOS — Pull anchors',
  'axios-pair-watches': 'AXIOS — Pair with watches',
  'study-insight': 'Bible Study — Ask for insight',
}

/** The model the current promotional discount applies to. */
export const PROMO_MODEL = 'gemini-3.6-flash'
export const CARD_FEE_PCT = 0.029
export const CARD_FEE_FLAT = 0.30

export function costByFeature(rows: UsageRow[], prices: ModelPrice[], discountPct: number): FeatureCost[] {
  const priceOf = new Map(prices.map((p) => [p.model, p]))
  const map = new Map<string, FeatureCost>()
  for (const r of rows) {
    const p = priceOf.get(r.model)
    const list = p ? (r.input_tokens * Number(p.input_per_m) + (r.output_tokens + r.thinking_tokens) * Number(p.output_per_m)) / 1_000_000 : 0
    const discounted = r.model === PROMO_MODEL ? list * (1 - discountPct / 100) : list
    const f = map.get(r.feature) ?? { feature: r.feature, label: FEATURE_LABELS[r.feature] ?? r.feature, calls: 0, failed: 0, tokens: 0, list: 0, discounted: 0 }
    f.calls += 1
    if (!r.ok) f.failed += 1
    f.tokens += r.input_tokens + r.output_tokens + r.thinking_tokens
    f.list += list
    f.discounted += discounted
    map.set(r.feature, f)
  }
  return [...map.values()].sort((a, b) => b.list - a.list)
}

export const usd = (n: number, digits = 2) => `$${n.toFixed(digits)}`
