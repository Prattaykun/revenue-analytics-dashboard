import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { generateDataset, HISTORY_DAYS } from '../data/generate'
import type { Activity, Dataset, Deal, Lead, Order, Payment, Quotation } from '../data/types'
import { fmtShort, fromInputDate, toInputDate } from './format'

export type Preset = 'today' | '7d' | '30d' | 'custom'
export interface Range { start: Date; end: Date }
export interface Bucket { key: string; label: string; start: number; end: number }

export interface Slice {
  leads: Lead[]
  quotations: Quotation[]
  deals: Deal[]
  orders: Order[]
  payments: Payment[]
  activities: Activity[]
}

interface FilterState {
  preset: Preset
  customFrom: string
  customTo: string
  ownerId: string
  category: string
}

interface Ctx extends FilterState {
  data: Dataset
  set: (patch: Partial<FilterState>) => void
  cur: Range
  prev: Range
  compareLabel: string
  rangeLabel: string
  buckets: Bucket[]
  scope: Slice // owner/category scope, all time
  current: Slice
  previous: Slice
  minDate: string
  maxDate: string
  userName: (id: string) => string
  leadById: Map<string, Lead>
  dealById: Map<string, Deal>
}

const FilterCtx = createContext<Ctx | null>(null)
const DAY = 86_400_000

function computeRanges(s: FilterState, now: Date) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  let start: Date
  let end: Date = now
  let prev: Range
  let compareLabel: string
  if (s.preset === 'today') {
    start = today
    prev = { start: new Date(today.getTime() - DAY), end: new Date(now.getTime() - DAY) }
    compareLabel = 'vs yesterday'
  } else if (s.preset === '7d' || s.preset === '30d') {
    const n = s.preset === '7d' ? 7 : 30
    start = new Date(today.getTime() - (n - 1) * DAY)
    prev = { start: new Date(start.getTime() - n * DAY), end: new Date(now.getTime() - n * DAY) }
    compareLabel = `vs prev ${n} days`
  } else {
    let a = fromInputDate(s.customFrom)
    let b = fromInputDate(s.customTo)
    if (a > b) [a, b] = [b, a]
    start = a
    end = new Date(b.getTime() + DAY - 1)
    if (end > now) end = now
    const len = Math.round((b.getTime() - a.getTime()) / DAY) + 1
    prev = { start: new Date(a.getTime() - len * DAY), end: new Date(end.getTime() - len * DAY) }
    compareLabel = `vs prev ${len} day${len > 1 ? 's' : ''}`
  }
  return { cur: { start, end }, prev, compareLabel }
}

function makeBuckets(r: Range, preset: Preset): Bucket[] {
  const out: Bucket[] = []
  const spanDays = (r.end.getTime() - r.start.getTime()) / DAY
  if (preset === 'today' || spanDays <= 1) {
    const s = new Date(r.start)
    for (let h = 0; h < 24; h++) {
      const st = s.getTime() + h * 3_600_000
      if (st > r.end.getTime()) break
      const label = `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`
      out.push({ key: `h${h}`, label, start: st, end: st + 3_600_000 - 1 })
    }
    return out
  }
  const step = spanDays > 62 ? 7 : 1
  for (let t = r.start.getTime(); t <= r.end.getTime(); t += step * DAY) {
    const d = new Date(t)
    out.push({ key: `d${t}`, label: step === 7 ? `Wk ${fmtShort(d)}` : fmtShort(d), start: t, end: Math.min(t + step * DAY - 1, r.end.getTime()) })
  }
  return out
}

const inRange = (d: Date, r: Range) => d >= r.start && d <= r.end

export function FilterProvider({ children }: { children: ReactNode }) {
  const [now] = useState(() => new Date())
  const data = useMemo(() => generateDataset(now), [now])
  const minDate = toInputDate(new Date(now.getTime() - HISTORY_DAYS * DAY))
  const maxDate = toInputDate(now)
  const [state, setState] = useState<FilterState>(() => ({
    preset: '30d',
    customFrom: toInputDate(new Date(now.getTime() - 13 * DAY)),
    customTo: toInputDate(now),
    ownerId: 'all',
    category: 'all',
  }))

  const value = useMemo<Ctx>(() => {
    const { cur, prev, compareLabel } = computeRanges(state, now)
    const leadById = new Map(data.leads.map((l) => [l.id, l]))
    const dealById = new Map(data.deals.map((d) => [d.id, d]))
    const userMap = new Map(data.users.map((u) => [u.id, u.name]))
    const ownerOk = (leadId: string) => state.ownerId === 'all' || leadById.get(leadId)?.ownerId === state.ownerId
    const catOk = (c: string) => state.category === 'all' || c === state.category
    const scope: Slice = {
      leads: data.leads.filter((l) => ownerOk(l.id) && catOk(l.category)),
      quotations: data.quotations.filter((q) => ownerOk(q.leadId) && catOk(q.category)),
      deals: data.deals.filter((d) => ownerOk(d.leadId) && catOk(d.category)),
      orders: data.orders.filter((o) => ownerOk(o.leadId) && catOk(o.category)),
      payments: data.payments.filter((p) => ownerOk(p.leadId) && catOk(dealById.get(p.dealId)?.category ?? '')),
      activities: data.activities.filter((a) => ownerOk(a.leadId)),
    }
    const slice = (r: Range): Slice => ({
      leads: scope.leads.filter((x) => inRange(x.createdAt, r)),
      quotations: scope.quotations.filter((x) => inRange(x.createdAt, r)),
      deals: scope.deals.filter((x) => inRange(x.createdAt, r)),
      orders: scope.orders.filter((x) => inRange(x.createdAt, r)),
      payments: scope.payments.filter((x) => inRange(x.paidAt, r)),
      activities: scope.activities.filter((x) => inRange(x.at, r)),
    })
    const rangeLabel = state.preset === 'today' ? `Today, ${fmtShort(cur.start)}` : `${fmtShort(cur.start)} – ${fmtShort(cur.end)}`
    return {
      ...state,
      data,
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      cur,
      prev,
      compareLabel,
      rangeLabel,
      buckets: makeBuckets(cur, state.preset),
      scope,
      current: slice(cur),
      previous: slice(prev),
      minDate,
      maxDate,
      userName: (id) => userMap.get(id) ?? '—',
      leadById,
      dealById,
    }
  }, [state, data, now, minDate, maxDate])

  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const ctx = useContext(FilterCtx)
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider')
  return ctx
}

/** Bucketise items by date into the current filter buckets. */
// eslint-disable-next-line react-refresh/only-export-components
export function series<T>(buckets: Bucket[], items: T[], date: (x: T) => Date, fields: Record<string, (x: T) => number>) {
  const rows = buckets.map((b) => {
    const r: Record<string, number | string> = { label: b.label, start: b.start }
    for (const k of Object.keys(fields)) r[k] = 0
    return r
  })
  for (const it of items) {
    const t = date(it).getTime()
    // buckets are ordered; binary search
    let lo = 0
    let hi = buckets.length - 1
    let idx = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (t < buckets[mid].start) hi = mid - 1
      else if (t > buckets[mid].end) lo = mid + 1
      else { idx = mid; break }
    }
    if (idx < 0) continue
    for (const [k, f] of Object.entries(fields)) (rows[idx][k] as number) += f(it)
  }
  return rows
}
