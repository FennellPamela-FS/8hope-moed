import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Download, FileText, FolderOpen, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import {
  CARD_FEE_FLAT, CARD_FEE_PCT, costByFeature, usd,
  type FixedCost, type ModelPrice, type UsageRow,
} from '@/lib/costs'

/**
 * "Count the Costs" (Luke 14:28) — internal, admin only. Works out a
 * realistic cost per user and a price: AI usage from ai_usage (token counts
 * only) priced with ai_model_prices, fixed monthly costs entered here, and a
 * pricing calculator. Scenarios can be saved, reopened, downloaded as JSON,
 * or printed / saved as PDF. Bible text fetched by browsers and email are not
 * counted automatically — enter them as fixed costs.
 */

const PERIODS = [7, 30, 90]
const INPUTS_KEY = '8hope-count-the-costs-inputs'

interface Inputs {
  days: number
  discount: number         // current promo on Gemini 3.6 Flash, %
  projectedUsers: number
  monthlyPrice: number
  targetMargin: number     // %
}
const DEFAULT_INPUTS: Inputs = { days: 30, discount: 50, projectedUsers: 1000, monthlyPrice: 4.99, targetMargin: 60 }

interface Scenario {
  id: string
  name: string
  inputs: Inputs
  snapshot: Snapshot
  created_at: string
}
type Snapshot = ReturnType<typeof buildSnapshot>

function loadInputs(): Inputs {
  try {
    const saved = JSON.parse(localStorage.getItem(INPUTS_KEY) ?? 'null')
    return saved ? { ...DEFAULT_INPUTS, ...saved } : DEFAULT_INPUTS
  } catch {
    return DEFAULT_INPUTS
  }
}

export function CountTheCosts() {
  const { user } = useAppStore()
  if (!user?.is_admin) return <Navigate to="/" replace />
  return (
    <AppShell title="Count the Costs">
      <CostsContent />
    </AppShell>
  )
}

function buildSnapshot(args: {
  inputs: Inputs
  activeUsers: number | null
  features: ReturnType<typeof costByFeature>
  fixed: FixedCost[]
  prices: ModelPrice[]
}) {
  const { inputs, activeUsers, features, fixed, prices } = args
  const aiList = features.reduce((s, f) => s + f.list, 0)
  const aiDiscounted = features.reduce((s, f) => s + f.discounted, 0)
  const fixedMonthly = fixed.reduce((s, f) => s + Number(f.monthly_usd || 0), 0)
  const users = Math.max(activeUsers ?? 0, 1)
  const aiPerUserMonth = (aiList / inputs.days) * 30 / users
  const fixedPerUserMonth = fixedMonthly / Math.max(inputs.projectedUsers, 1)
  const costPerUserMonth = aiPerUserMonth + fixedPerUserMonth
  const cardFee = inputs.monthlyPrice * CARD_FEE_PCT + CARD_FEE_FLAT
  const profit = inputs.monthlyPrice - cardFee - costPerUserMonth
  const margin = inputs.monthlyPrice > 0 ? profit / inputs.monthlyPrice : 0
  const suggested = (costPerUserMonth + CARD_FEE_FLAT) / Math.max(1 - CARD_FEE_PCT - inputs.targetMargin / 100, 0.01)
  return {
    app: '8Hope',
    generated_at: new Date().toISOString(),
    period_days: inputs.days,
    active_users: activeUsers,
    ai: { list_usd: aiList, with_discount_usd: aiDiscounted, discount_pct: inputs.discount, by_feature: features },
    fixed_costs: fixed.map((f) => ({ name: f.name, monthly_usd: Number(f.monthly_usd || 0) })),
    fixed_monthly_usd: fixedMonthly,
    prices: prices.map((p) => ({ model: p.model, input_per_m: Number(p.input_per_m), output_per_m: Number(p.output_per_m) })),
    calculator: {
      projected_users: inputs.projectedUsers,
      monthly_price_usd: inputs.monthlyPrice,
      target_margin_pct: inputs.targetMargin,
      ai_cost_per_user_month_usd: aiPerUserMonth,
      fixed_cost_per_user_month_usd: fixedPerUserMonth,
      card_fee_per_payment_usd: cardFee,
      profit_per_user_month_usd: profit,
      margin_pct: Math.round(margin * 100),
      price_for_target_margin_usd: suggested,
    },
  }
}

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function CostsContent() {
  const [inputs, setInputs] = useState<Inputs>(loadInputs)
  const [rows, setRows] = useState<UsageRow[] | null>(null)
  const [prices, setPrices] = useState<ModelPrice[]>([])
  const [fixed, setFixed] = useState<FixedCost[]>([])
  const [activeUsers, setActiveUsers] = useState<number | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenarioName, setScenarioName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedNote, setSavedNote] = useState<string | null>(null)

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setInputs((i) => ({ ...i, [key]: value }))

  // Remember the calculator between visits (this device); Save keeps it for good.
  useEffect(() => {
    try { localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs)) } catch { /* private mode */ }
  }, [inputs])

  useEffect(() => {
    setRows(null)
    const since = new Date(Date.now() - inputs.days * 86_400_000).toISOString()
    Promise.all([
      supabase.from('ai_usage').select('created_at, user_id, feature, model, input_tokens, output_tokens, thinking_tokens, ok').gte('created_at', since).limit(10000),
      supabase.rpc('admin_active_users', { days: inputs.days }),
    ]).then(([u, a]) => {
      setRows((u.data as UsageRow[]) ?? [])
      setActiveUsers((a.data as number | null) ?? null)
    })
  }, [inputs.days])

  useEffect(() => {
    supabase.from('ai_model_prices').select('*').then(({ data }) => setPrices((data as ModelPrice[]) ?? []))
    supabase.from('fixed_costs').select('*').order('created_at').then(({ data }) => setFixed((data as FixedCost[]) ?? []))
    supabase.from('pricing_scenarios').select('*').order('created_at', { ascending: false }).then(({ data }) => setScenarios((data as Scenario[]) ?? []))
  }, [])

  const features = useMemo(() => costByFeature(rows ?? [], prices, inputs.discount), [rows, prices, inputs.discount])
  const snap = buildSnapshot({ inputs, activeUsers, features, fixed, prices })
  const calc = snap.calculator
  const users = Math.max(activeUsers ?? 0, 1)

  async function saveScenario() {
    const name = scenarioName.trim() || `Scenario — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    setSaving(true)
    const { data, error } = await supabase.from('pricing_scenarios').insert({ name, inputs, snapshot: snap }).select().single()
    setSaving(false)
    if (error || !data) { setSavedNote('Could not save. Please try again.'); return }
    setScenarios((list) => [data as Scenario, ...list])
    setScenarioName('')
    setSavedNote(`Saved "${name}"`)
    setTimeout(() => setSavedNote(null), 2500)
  }

  async function deleteScenario(s: Scenario) {
    if (!window.confirm(`Delete the saved scenario "${s.name}"?`)) return
    const { error } = await supabase.from('pricing_scenarios').delete().eq('id', s.id)
    if (!error) setScenarios((list) => list.filter((x) => x.id !== s.id))
  }

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
    <div className="px-4 py-5 space-y-5 print:py-0">
      <div className="text-center">
        <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1 print:hidden">Internal · only you can see this</p>
        <h2 className="font-heading text-2xl font-bold text-hope-blue">Count the Costs</h2>
        <p className="text-hope-gray/60 text-xs font-body italic mt-1">
          "For which of you, intending to build a tower, sitteth not down first, and counteth the cost…" — Luke 14:28
        </p>
        <p className="hidden print:block text-hope-gray/60 text-xs mt-1">
          8Hope · printed {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · last {inputs.days} days
        </p>
      </div>

      {/* Save & export */}
      <div className="card space-y-3 print:hidden">
        <h3 className="font-heading font-bold text-hope-blue">Save & export</h3>
        <div className="flex gap-2">
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Scenario name (e.g. $4.99 at 1,000 users)"
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Scenario name"
          />
          <button onClick={saveScenario} disabled={saving} className="btn-gold shrink-0 px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
        {savedNote && <p className="text-hope-green text-xs font-heading font-semibold">{savedNote}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => downloadJson(`count-the-costs-${new Date().toISOString().slice(0, 10)}`, snap)} className="btn-outline text-sm py-2 flex items-center justify-center gap-1.5">
            <Download className="w-4 h-4" /> Download JSON
          </button>
          <button onClick={() => window.print()} className="btn-outline text-sm py-2 flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4" /> Print / PDF
          </button>
        </div>
        <p className="text-hope-gray/40 text-xs font-body">Print / PDF opens your device's print screen — choose "Save as PDF" to keep a copy.</p>
      </div>

      {/* Saved scenarios */}
      {scenarios.length > 0 && (
        <div className="card space-y-2 print:hidden">
          <h3 className="font-heading font-bold text-hope-blue">Saved scenarios</h3>
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 last:border-0">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-hope-gray text-sm truncate">{s.name}</p>
                <p className="text-hope-gray/50 text-xs">
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {usd(s.inputs.monthlyPrice)}/mo · {s.snapshot.calculator.margin_pct}% margin
                </p>
              </div>
              <div className="flex shrink-0">
                <button onClick={() => setInputs(s.inputs)} className="p-2 text-gray-400 hover:text-hope-blue" aria-label={`Open ${s.name}`} title="Open"><FolderOpen className="w-4 h-4" /></button>
                <button onClick={() => downloadJson(s.name, s)} className="p-2 text-gray-400 hover:text-hope-blue" aria-label={`Download ${s.name}`} title="Download JSON"><Download className="w-4 h-4" /></button>
                <button onClick={() => deleteScenario(s)} className="p-2 text-gray-300 hover:text-red-500" aria-label={`Delete ${s.name}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Period */}
      <div className="grid grid-cols-3 gap-2 print:hidden" role="radiogroup" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p} role="radio" aria-checked={inputs.days === p} onClick={() => set('days', p)}
            className={cn('py-2 rounded-xl text-sm font-heading font-semibold border',
              inputs.days === p ? 'bg-hope-blue text-white border-hope-blue' : 'bg-white text-hope-gray border-gray-200')}>
            Last {p} days
          </button>
        ))}
      </div>

      {/* AI usage */}
      <div className="card space-y-3 print:break-inside-avoid">
        <h3 className="font-heading font-bold text-hope-blue">AI usage</h3>
        {rows === null ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gold-500 animate-spin" /></div>
        ) : features.length === 0 ? (
          <p className="text-hope-gray/60 text-sm font-body">No AI use recorded in this period yet. Tracking began October 20, 2026.</p>
        ) : (
          <div className="space-y-2">
            {features.map((f) => (
              <div key={f.feature} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-hope-gray text-sm">{f.label}</p>
                  <p className="text-hope-gray/50 text-xs">
                    {f.calls} call{f.calls === 1 ? '' : 's'}{f.failed ? ` (${f.failed} retried)` : ''} · {f.tokens.toLocaleString()} tokens · {usd(f.calls ? f.list / f.calls : 0, 4)} each
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-bold text-hope-blue text-sm">{usd(f.list, 3)}</p>
                  {f.discounted !== f.list && <p className="text-hope-green text-xs">{usd(f.discounted, 3)} now</p>}
                </div>
              </div>
            ))}
            <div className="flex justify-between gap-3 pt-1 font-heading font-bold text-hope-blue">
              <span>Total ({inputs.days} days)</span>
              <span className="text-right">{usd(snap.ai.list_usd, 3)}{snap.ai.with_discount_usd !== snap.ai.list_usd && <span className="block text-hope-green text-xs font-semibold">{usd(snap.ai.with_discount_usd, 3)} with discount</span>}</span>
            </div>
          </div>
        )}
        <label className="flex items-center justify-between gap-3 text-xs font-heading text-hope-gray/70">
          Current discount on Gemini 3.6 Flash (%)
          <input type="number" min={0} max={100} value={inputs.discount} onChange={(e) => set('discount', Number(e.target.value))}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
        </label>
        <p className="text-hope-gray/50 text-xs font-body">
          List prices: {prices.map((p) => `${p.model} $${Number(p.input_per_m)} in / $${Number(p.output_per_m)} out per million tokens`).join('; ')}. Thinking tokens bill as output.
        </p>
      </div>

      {/* Users */}
      <div className="card flex items-center justify-between print:break-inside-avoid">
        <div>
          <h3 className="font-heading font-bold text-hope-blue">Active users</h3>
          <p className="text-hope-gray/50 text-xs">Signed in during the last {inputs.days} days</p>
        </div>
        <p className="font-heading text-2xl font-bold text-hope-blue">{activeUsers ?? '—'}</p>
      </div>

      {/* Fixed costs */}
      <div className="card space-y-3 print:break-inside-avoid">
        <div>
          <h3 className="font-heading font-bold text-hope-blue">Fixed monthly costs</h3>
          <p className="text-hope-gray/50 text-xs print:hidden">Enter what each service actually bills you per month. Changes save automatically.</p>
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
              <button onClick={() => removeFixed(f.id)} className="p-1.5 text-gray-300 hover:text-red-500 print:hidden" aria-label={`Remove ${f.name}`}><Trash2 className="w-4 h-4" /></button>
            </div>
            {f.note && <p className="text-hope-gray/40 text-xs pl-1">{f.note}</p>}
          </div>
        ))}
        <button onClick={addFixed} className="flex items-center gap-1.5 text-xs font-heading font-semibold text-gold-600 print:hidden"><Plus className="w-3.5 h-3.5" /> Add a cost</button>
        <p className="flex justify-between font-heading font-bold text-hope-blue"><span>Total per month</span><span>{usd(snap.fixed_monthly_usd)}</span></p>
      </div>

      {/* Pricing calculator */}
      <div className="card space-y-3 print:break-inside-avoid">
        <h3 className="font-heading font-bold text-hope-blue">Pricing calculator</h3>
        <NumberField label="Projected paying users" value={inputs.projectedUsers} onChange={(n) => set('projectedUsers', n)} step={100} />
        <NumberField label="Monthly price per user ($)" value={inputs.monthlyPrice} onChange={(n) => set('monthlyPrice', n)} step={0.5} />
        <NumberField label="Target margin (%)" value={inputs.targetMargin} onChange={(n) => set('targetMargin', n)} step={5} />
        <div className="rounded-xl bg-hope-light p-3 space-y-1 text-sm font-body text-hope-gray">
          <Row label="AI cost per user / month (observed)" value={usd(calc.ai_cost_per_user_month_usd, 4)} />
          <Row label={`Fixed cost per user / month (at ${inputs.projectedUsers.toLocaleString()} users)`} value={usd(calc.fixed_cost_per_user_month_usd, 4)} />
          <Row label="Card fees per payment (2.9% + 30¢)" value={usd(calc.card_fee_per_payment_usd)} />
          <Row label="Profit per user / month" value={usd(calc.profit_per_user_month_usd)} strong />
          <Row label="Margin" value={`${calc.margin_pct}%`} strong />
          <Row label={`Price for a ${inputs.targetMargin}% margin`} value={usd(calc.price_for_target_margin_usd)} strong />
        </div>
        <p className="text-hope-gray/50 text-xs font-body">
          Observed AI cost is averaged over {users} active user{users === 1 ? '' : 's'} — early numbers will move as more people use the app. Uses list prices; the discount above is not applied here.
        </p>
      </div>

      {/* Open questions */}
      <div className="card space-y-2 print:break-inside-avoid">
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
