import type { Deal, Lead, Order, Payment, Quotation } from '../data/types'
import type { Slice } from './filters'

export const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0)

export function groupBy<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>()
  for (const x of xs) {
    const k = key(x)
    const arr = m.get(k)
    if (arr) arr.push(x)
    else m.set(k, [x])
  }
  return m
}

export const isQualified = (l: Lead) => l.status === 'Qualified' || l.status === 'Converted'

export function leadKpis(s: Slice) {
  const total = s.leads.length
  const qualified = s.leads.filter(isQualified).length
  const converted = s.leads.filter((l) => l.status === 'Converted').length
  const unqualified = s.leads.filter((l) => l.status === 'Unqualified').length
  const open = s.leads.filter((l) => l.status === 'New' || l.status === 'Contacted').length
  return { total, qualified, converted, unqualified, open, convRate: total ? (converted / total) * 100 : 0 }
}

export function dealKpis(s: Slice, allPayments: Payment[]) {
  const won = s.deals.filter((d) => d.stage === 'Won')
  const revenue = sum(won, (d) => d.value)
  const ids = new Set(won.map((d) => d.id))
  const collectedOnDeals = sum(allPayments.filter((p) => ids.has(p.dealId)), (p) => p.amount)
  const collected = sum(s.payments, (p) => p.amount)
  const pipeline = sum(s.deals.filter((d) => d.stage === 'Negotiation'), (d) => d.value)
  const decided = s.deals.filter((d) => d.stage !== 'Negotiation').length
  return {
    deals: s.deals.length,
    won: won.length,
    revenue,
    collected,
    collectedOnDeals,
    outstanding: Math.max(0, revenue - collectedOnDeals),
    pipeline,
    avgDeal: won.length ? revenue / won.length : 0,
    winRate: decided ? (won.length / decided) * 100 : 0,
  }
}

export function quoteKpis(s: Slice) {
  const value = sum(s.quotations, (q) => q.amount)
  const accepted = s.quotations.filter((q) => q.status === 'Accepted').length
  const pending = s.quotations.filter((q) => q.status === 'Pending').length
  const quoteIds = new Set(s.quotations.map((q) => q.id))
  const dealsFromQuotes = s.deals.filter((d) => quoteIds.has(d.quotationId)).length
  return {
    count: s.quotations.length,
    value,
    accepted,
    pending,
    avg: s.quotations.length ? value / s.quotations.length : 0,
    dealsFromQuotes,
    q2d: s.quotations.length ? (dealsFromQuotes / s.quotations.length) * 100 : 0,
  }
}

export function quoteServiceRows(quotes: Quotation[], deals: Deal[]) {
  const dealQuoteIds = new Set(deals.map((d) => d.quotationId))
  return [...groupBy(quotes, (q) => q.service).entries()]
    .map(([service, qs]) => ({
      service,
      category: qs[0].category,
      count: qs.length,
      value: sum(qs, (q) => q.amount),
      accepted: qs.filter((q) => q.status === 'Accepted').length,
      pending: qs.filter((q) => q.status === 'Pending').length,
      rejected: qs.filter((q) => q.status === 'Rejected').length,
      expired: qs.filter((q) => q.status === 'Expired').length,
      deals: qs.filter((q) => dealQuoteIds.has(q.id)).length,
    }))
    .map((r) => ({ ...r, conv: r.count ? (r.deals / r.count) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function orderKpis(orders: Order[]) {
  const by = (st: Order['status']) => orders.filter((o) => o.status === st).length
  const stages = sum(orders, (o) => o.stagesTotal)
  return {
    total: orders.length,
    completed: by('Completed'),
    inProgress: by('In Progress'),
    pending: by('Pending'),
    onHold: by('On Hold'),
    progress: stages ? (sum(orders, (o) => o.stagesCompleted) / stages) * 100 : 0,
  }
}

export function paidByDeal(payments: Payment[]) {
  const m = new Map<string, number>()
  for (const p of payments) m.set(p.dealId, (m.get(p.dealId) ?? 0) + p.amount)
  return m
}
