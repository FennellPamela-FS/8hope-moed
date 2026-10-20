import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'

/**
 * Internal "Costs & Pricing" page (admin only) for working out a realistic
 * cost per user and a price. AI usage comes from ai_usage (token counts
 * only), priced with ai_model_prices; fixed monthly costs are entered here.
 * Bible text fetched by the browser and email are not counted automatically
 * — enter those as fixed costs.
 */

interface UsageRow {
  created_at: string
  user_id: string | null
  feature: string
  model: string
  input_tokens: number
  output_tokens: number
  thinking_tokens: number
  ok: boolean
}
interface Price { model: string; input_per_m: number; output_per_m: number; note: string | null }
interface FixedCost { id: string; name: string; monthly_usd: number; note: string | null }

const FEATURE_LABELS: Record<string, string> = {
  'moed-daily': 'Moed — daily verses (once per day, shared)',
  'moed-extras': 'Moed — Reflection & Deeper Word Study',
  'axios-guide': 'AXIOS — 7-day guide',
  'axios-suggest-anchors': 'AXIOS — Pull anchors',
  'axios-pair-watches': 'AXIOS — Pair with watches',
  'study-insight': 'Bible Study — Ask for insight',
}

const PERIODS = [7, 30, 90]
const CARD_FEE_PCT = 0.029
const CARD_FEE_FLAT = 0.30

const usd = (n: number, digits = 2) => `$${n.toFixed(digits)}`

export function CostsPricing() {
  const { user } = useAppStore()
  if (!user?.is_admin) return <Navigate to="/" replace />
  return (
    <AppShell title="Costs & Pricing">
      <CostsContent />
    </AppShell>
  )
}

function CostsContent() {
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState<UsageRow[] | null>(null)
  const [prices, setPrices] = useState<Price[]>([])
  const [fixed, setFixed] = useState<FixedCost[]>([])
  const [activeUsers, setActiveUsers] = useState<number | null>(null)
  const [discount, setDiscount] = useState(50)        // current promo on gemini-3.6-flash, %
  const [projectedUsers, setProjectedUsers] = useState(1000)
  const [monthlyPrice, setMonthlyPrice] = useState(4.99)
  const [targetMargin, setTargetMargin] = useState(60)

  useEffect(() => {
    setRows(null)
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    Promise.all([
      supabase.from('ai_usage').select('created_at, user_id, feature, model, input_tokens, output_tokens, thinking_tokens, ok').gte('created_at', since).limit(10000),
      supabase.rpc('admin_active_users', { days }),
    ]).then(([u, a]) => {
      setRows((u.data as UsageRow[]) ?? [])
      setActiveUsers((a.data as number | null) ?? null)
    })
  }, [days])

  useEffect(() => {
    supabase.from('ai_model_prices').select('*').then(({ data }) => setPrices((data as Price[]) ?? []))
    supabase.from('fixed_costs').select('*').order('created_at').then(({ data }) => setFixed((data as FixedCost[]) ?? []))
  }, [])

  const priceOf = useMemo(() => new Map(prices.map((p) => [p.model, p])), [prices])

  function costOf(r: UsageRow, applyDiscount: boolean): number {
    const p = priceOf.get(r.model)
    if (!p) return 0
    const list = (r.input_tokens * Number(p.input_per_m) + (r.output_tokens + r.thinking_tokens) * Number(p.output_per_m)) / 1_000_000
    return applyDiscount && r.model === 'gemini-3.6-flash' ? list * (1 - discount / 100) : list
  }

  const byFeature = useMemo(() => {
    const map = new Map<string, { calls: number; failed: number; tokens: number; list: number; now: number; users: Set<string> }>()
    for (const r of rows ?? []) {
      const f = map.get(r.feature) ?? { calls: 0, failed: 0, tokens: 0, list: 0, now: 0, users: new Set<string>() }
      f.calls += 1
      if (!r.ok) f.failed += 1
      f.tokens += r.input_tokens + r.output_tokens + r.thinking_tokens
      f.list += costOf(r, false)
      f.now += costOf(r, true)
      if (r.user_id) f.users.add(r.user_id)
      map.set(r.feature, f)
    }
    return [...map.entries()].sort((a, b) => b[1].list - a[1].list)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, priceOf, discount])

  const aiList = byFeature.reduce((s, [, f]) => s + f.list, 0)
  const aiNow = byFeature.reduce((s, [, f]) => s + f.now, 0)
  const fixedMonthly = fixed.reduce((s, f) => s + Number(f.monthly_usd || 0), 0)

  // Per-user monthly AI cost from observed usage, scaled to 30 days.
  const users = Math.max(activeUsers ?? 0, 1)
  const aiPerUserMonth = (aiList / days) * 30 / users
  const fixedPerUserMonth = fixedMonthly / Math.max(projectedUsers, 1)
  const costPerUserMonth = aiPerUserMonth + fixedPerUserMonth
  const netRevenue = monthlyPrice * (1 - CARD_FEE_PCT) - CARD_FEE_FLAT
  const profit = netRevenue - costPerUserMonth
  const margin = monthlyPrice > 0 ? profit / monthlyPrice : 0
  const suggested = (costPerUserMonth + CARD_FEE_FLAT) / Math.max(1 - CARD_FEE_PCT - targetMargin / 100, 0.01)

  async function saveFixed(f: FixedCost) {
    await supabase.from('fixed_costs').update({ name: f.name, monthly_usd: f.monthly_usd, note: f.note }).eq('id', f.id)
  }
  async function addFixed() {
    const { data } = await supabase.from('fixed_costs').insert({ name: 'New cost', monthly_usd: 0 }).select().single()
    if (data) setFixed((list) => [...list, data as FixedCost])
  }
  async function removeFixed(id: string) {
    await supabase.from('fixed_costs').delete().eq('id', id)
    setFixed((list) => list.filter((f) => f.id !== id))
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="text-center">
        <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1">Internal · only you can see this</p>
        <h2 className="font-heading text-2xl font-bold text-hope-blue">Costs & Pricing</h2>
      </div>

      {/* Period */}
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p} role="radio" aria-checked={days === p} onClick={() => setDays(p)}
            className={cn('py-2 rounded-xl text-sm font-heading font-semibold border',
              days === p ? 'bg-hope-blue text-white border-hope-blue' : 'bg-white text-hope-gray border-gray-200')}>
            Last {p} days
          </button>
        ))}
      </div>

      {/* AI usage */}
      <div className="card space-y-3">
        <h3 className="font-heading font-bold text-hope-blue">AI usage</h3>
        {rows === null ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gold-500 animate-spin" /></div>
        ) : byFeature.length === 0 ? (
          <p className="text-hope-gray/60 text-sm font-body">No AI use recorded in this period yet. Tracking began October 20, 2026.</p>
        ) : (
          <div className="space-y-2">
            {byFeature.map(([feature, f]) => (
              <div key={feature} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-hope-gray text-sm">{FEATURE_LABELS[feature] ?? feature}</p>
                  <p className="text-hope-gray/50 text-xs">
                    {f.calls} call{f.calls === 1 ? '' : 's'}{f.failed ? ` (${f.failed} retried)` : ''} · {f.tokens.toLocaleString()} tokens · {usd(f.calls ? f.list / f.calls : 0, 4)} each
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-bold text-hope-blue text-sm">{usd(f.list, 3)}</p>
                  {f.now !== f.list && <p className="text-hope-green text-xs">{usd(f.now, 3)} now</p>}
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-1 font-heading font-bold text-hope-blue">
              <span>Total ({days} days)</span>
              <span>{usd(aiList, 3)}{aiNow !== aiList && <span className="text-hope-green text-xs font-semibold"> · {usd(aiNow, 3)} with discount</span>}</span>
            </div>
          </div>
        )}
        <label className="flex items-center justify-between gap-3 text-xs font-heading text-hope-gray/70">
          Current discount on Gemini 3.6 Flash (%)
          <input type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
        </label>
        <p className="text-hope-gray/50 text-xs font-body">
          Costs use list prices: {prices.map((p) => `${p.model} $${Number(p.input_per_m)} in / $${Number(p.output_per_m)} out per million tokens`).join('; ')}. Thinking tokens bill as output.
        </p>
      </div>

      {/* Users */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-hope-blue">Active users</h3>
          <p className="text-hope-gray/50 text-xs">Signed in during the last {days} days</p>
        </div>
        <p className="font-heading text-2xl font-bold text-hope-blue">{activeUsers ?? '—'}</p>
      </div>

      {/* Fixed costs */}
      <div className="card space-y-3">
        <div>
          <h3 className="font-heading font-bold text-hope-blue">Fixed monthly costs</h3>
          <p className="text-hope-gray/50 text-xs">Enter what each service actually bills you per month.</p>
        </div>
        {fixed.map((f) => (
          <div key={f.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <input value={f.name} onChange={(e) => setFixed((l) => l.map((x) => x.id === f.id ? { ...x, name: e.target.value } : x))}
                onBlur={() => saveFixed(f)} className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" aria-label="Cost name" />
              <span className="text-hope-gray/50 text-sm">$</span>
              <input type="number" min={0} step="0.01" value={f.monthly_usd}
                onChange={(e) => setFixed((l) => l.map((x) => x.id === f.id ? { ...x, monthly_usd: Number(e.target.value) } : x))}
                onBlur={() => saveFixed(f)} className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right" aria-label={`${f.name} monthly cost`} />
              <button onClick={() => removeFixed(f.id)} className="p-1.5 text-gray-300 hover:text-red-500" aria-label={`Remove ${f.name}`}><Trash2 className="w-4 h-4" /></button>
            </div>
            {f.note && <p className="text-hope-gray/40 text-xs pl-1">{f.note}</p>}
          </div>
        ))}
        <button onClick={addFixed} className="flex items-center gap-1.5 text-xs font-heading font-semibold text-gold-600"><Plus className="w-3.5 h-3.5" /> Add a cost</button>
        <p className="flex justify-between font-heading font-bold text-hope-blue"><span>Total per month</span><span>{usd(fixedMonthly)}</span></p>
      </div>

      {/* Pricing calculator */}
      <div className="card space-y-3">
        <h3 className="font-heading font-bold text-hope-blue">Pricing calculator</h3>
        <NumberField label="Projected paying users" value={projectedUsers} onChange={setProjectedUsers} step={100} />
        <NumberField label="Monthly price per user ($)" value={monthlyPrice} onChange={setMonthlyPrice} step={0.5} />
        <NumberField label="Target margin (%)" value={targetMargin} onChange={setTargetMargin} step={5} />
        <div className="rounded-xl bg-hope-light p-3 space-y-1 text-sm font-body text-hope-gray">
          <Row label="AI cost per user / month (observed)" value={usd(aiPerUserMonth, 4)} />
          <Row label={`Fixed cost per user / month (at ${projectedUsers.toLocaleString()} users)`} value={usd(fixedPerUserMonth, 4)} />
          <Row label="Card fees per payment (2.9% + 30¢)" value={usd(monthlyPrice * CARD_FEE_PCT + CARD_FEE_FLAT)} />
          <Row label="Profit per user / month" value={usd(profit)} strong />
          <Row label="Margin" value={`${Math.round(margin * 100)}%`} strong />
          <Row label={`Price for a ${targetMargin}% margin`} value={usd(suggested)} strong />
        </div>
        <p className="text-hope-gray/50 text-xs font-body">
          Observed AI cost is averaged over {users} active user{users === 1 ? '' : 's'} — early numbers will move as more people use the app. List prices; the discount above is not applied here.
        </p>
      </div>

      {/* Open questions */}
      <div className="card space-y-2">
        <h3 className="font-heading font-bold text-hope-blue">Still to answer before a public launch</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm font-body text-hope-gray">
          <li><strong>Bible licensing for commercial use</strong> — NASB, AMP and MSG are licensed; confirm the API.Bible plan covers a paid app.</li>
          <li><strong>Payment model</strong> — one-time ($3.65 in the concept doc) vs. monthly vs. AI credits; ongoing AI costs favor recurring revenue.</li>
          <li><strong>Payment processing</strong> — card fees take about 41¢ (11%) of a $3.65 sale.</li>
          <li><strong>App stores</strong> — 15–30% if a native iOS/Android app is ever released.</li>
          <li><strong>Sales tax</strong> on digital goods, by state.</li>
          <li><strong>Email sending</strong> for public sign-ups and password resets (built-in email is rate-limited).</li>
          <li><strong>Church / organization licensing</strong> tiers and pricing.</li>
          <li><strong>Gemini paid-tier terms</strong> — data use and limits at scale.</li>
          <li><strong>Refunds and support</strong> — policy and expected time cost.</li>
        </ul>
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, step }: { label: string; value: number; onChange: (n: number) => void; step: number }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-heading text-hope-gray">
      {label}
      <input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right" />
    </label>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={cn('flex justify-between gap-3', strong && 'font-heading font-bold text-hope-blue')}>
      <span>{label}</span><span className="shrink-0">{value}</span>
    </p>
  )
}
