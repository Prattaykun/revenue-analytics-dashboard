import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PolarAngleAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Banknote, CircleCheck, IndianRupee, Target, Wallet } from 'lucide-react'
import { Badge, Card, ChartTooltip, Empty, Legend, Progress, Avatar } from './ui'
import { Funnel } from './Funnel'
import { DataTable } from './DataTable'
import { useFilters, series } from '../lib/filters'
import { C, PALETTE, colorOf } from '../lib/colors'
import { fmtDateTime, inr, inrShort, num, pct, ratio } from '../lib/format'
import { dealKpis, groupBy, isQualified, leadKpis, orderKpis, quoteKpis, quoteServiceRows, sum } from '../lib/metrics'
import type { LeadSource, LeadStatus, Order } from '../data/types'

const axis = { fontSize: 11, fill: '#64748b' }
const grid = <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
const short = (s: string, n = 12) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
function grain(b: { key: string; label: string }[]) {
  if (b[0]?.key.startsWith('h')) return 'Hourly'
  if (b[0]?.label.startsWith('Wk')) return 'Weekly'
  return 'Daily'
}
export const qs = (o: Record<string, string>) => '?' + new URLSearchParams(o).toString()

/* ---------------------------- Leads ---------------------------- */

export function TargetCard() {
  const { current, scope, ownerId, category, cur } = useFilters()
  const k = dealKpis(current, scope.payments)
  const days = Math.max(1, (cur.end.getTime() - cur.start.getTime()) / 86_400_000)
  const monthly = 1_250_000 * (ownerId === 'all' ? 1 : 0.2) * (category === 'all' ? 1 : 0.3)
  const target = Math.round((monthly / 30) * Math.max(days, 1) / 1000) * 1000 || 1000
  const achieved = k.revenue
  const p = ratio(achieved, target)
  const data = [{ name: 'Achieved', value: Math.min(100, p), fill: p >= 100 ? C.green : C.blue }]
  return (
    <Card title="Target Achievement" icon={<Target size={15} />}>
      <div className="text-xs text-slate-500">Revenue target for selected period</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{inr(target)}</div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-[110px] w-[110px] shrink-0">
          <ResponsiveContainer>
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#eef2f7' }} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900" fontSize={17} fontWeight={800}>{pct(p, 0)}</text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 text-[12.5px]">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-blue-600" />Achieved</span><b className="tabular-nums">{inr(achieved)}</b></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-slate-300" />Remaining</span><b className="tabular-nums">{inr(Math.max(0, target - achieved))}</b></div>
          <Progress value={p} color={p >= 100 ? C.green : C.blue} />
          <div className="text-[11px] text-slate-400">Monthly target {inr(monthly)} prorated</div>
        </div>
      </div>
    </Card>
  )
}

export function LeadFunnelCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const k = leadKpis(current)
  const go = (status: string) => nav('/leads' + qs({ status }))
  return (
    <Card title="Lead Funnel" action={<span className="text-[11px] text-slate-400">click a stage</span>}>
      {k.total ? (
        <Funnel
          stages={[
            { label: 'New Leads', value: k.total, color: C.blue, onClick: () => nav('/leads') },
            { label: 'Qualified', value: k.qualified, color: C.green, onClick: () => go('Qualified+') },
            { label: 'Converted', value: k.converted, color: C.amber, onClick: () => go('Converted') },
          ]}
          side={{ label: 'Unqualified', value: k.unqualified, color: C.rose, onClick: () => go('Unqualified') }}
        />
      ) : <Empty />}
      {k.total > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-1.5"><div className="text-[10.5px] text-slate-500">Lead → Qualified</div><div className="text-[13px] font-bold">{pct(ratio(k.qualified, k.total))}</div></div>
          <div className="rounded-lg bg-slate-50 py-1.5"><div className="text-[10.5px] text-slate-500">Qualified → Won</div><div className="text-[13px] font-bold">{pct(ratio(k.converted, k.qualified))}</div></div>
          <div className="rounded-lg bg-slate-50 py-1.5"><div className="text-[10.5px] text-slate-500">Open / New</div><div className="text-[13px] font-bold">{num(k.open)}</div></div>
        </div>
      )}
    </Card>
  )
}

export function LeadTrendCard({ height = 210 }: { height?: number }) {
  const { current, buckets } = useFilters()
  const rows = series(buckets, current.leads, (l) => l.createdAt, {
    'New Leads': () => 1,
    Qualified: (l) => (isQualified(l) ? 1 : 0),
    Converted: (l) => (l.status === 'Converted' ? 1 : 0),
  })
  return (
    <Card title={`${grain(buckets)} Lead Trend`} action={<Legend items={[{ label: 'New', color: C.blue }, { label: 'Qualified', color: C.green }, { label: 'Converted', color: C.amber }]} />}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="New Leads" stroke={C.blue} strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Qualified" stroke={C.green} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Converted" stroke={C.amber} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

const SOURCE_ORDER: LeadSource[] = ['Google Ads', 'Website', 'Referral', 'Just Dial', 'Social Media', 'Other']

export function LeadSourcesCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const total = current.leads.length
  const by = groupBy(current.leads, (l) => l.source)
  const data = SOURCE_ORDER.map((s, i) => ({ name: s, value: by.get(s)?.length ?? 0, fill: PALETTE[i] }))
  return (
    <Card title="Lead Sources">
      {total ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row xl:flex-col">
          <div className="relative h-[130px] w-[130px] shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none" onClick={(d) => nav('/leads' + qs({ source: String(d.name) }))}>
                  {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><div className="text-xl font-extrabold text-slate-900">{num(total)}</div><div className="text-[10px] uppercase tracking-wide text-slate-400">Leads</div></div>
            </div>
          </div>
          <ul className="w-full space-y-1 text-[12.5px]">
            {data.map((d) => (
              <li key={d.name}>
                <button type="button" onClick={() => nav('/leads' + qs({ source: d.name }))} className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 hover:bg-slate-50">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums text-slate-800">{d.value}</span>
                  <span className="w-12 text-right text-slate-400 tabular-nums">{pct(ratio(d.value, total), 0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : <Empty />}
    </Card>
  )
}

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Unqualified']

export function LeadStatusTrendCard() {
  const { current, buckets } = useFilters()
  const fields = Object.fromEntries(STATUSES.map((s) => [s, (l: { status: string }) => (l.status === s ? 1 : 0)]))
  const rows = series(buckets, current.leads, (l) => l.createdAt, fields)
  return (
    <Card title="Lead Status Trend" action={<Legend items={STATUSES.map((s) => ({ label: s, color: colorOf(s) }))} />}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          {STATUSES.map((s) => <Area key={s} type="monotone" stackId="1" dataKey={s} stroke={colorOf(s)} fill={colorOf(s)} fillOpacity={0.55} />)}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function LeadSourceTrendCard() {
  const { current, buckets } = useFilters()
  const fields = Object.fromEntries(SOURCE_ORDER.map((s) => [s, (l: { source: string }) => (l.source === s ? 1 : 0)]))
  const rows = series(buckets, current.leads, (l) => l.createdAt, fields)
  return (
    <Card title="Lead Source Trend" action={<Legend items={SOURCE_ORDER.map((s, i) => ({ label: s, color: PALETTE[i] }))} />}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
          {SOURCE_ORDER.map((s, i) => <Bar key={s} dataKey={s} stackId="s" fill={PALETTE[i]} radius={i === SOURCE_ORDER.length - 1 ? [3, 3, 0, 0] : 0} />)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

/* -------------------------- Quotations -------------------------- */

export function QuotesByServiceCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const rows = quoteServiceRows(current.quotations, current.deals).slice(0, 8)
  return (
    <Card title="Quotations by Service / Category">
      {rows.length ? (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={rows} margin={{ top: 18, right: 4, left: -22, bottom: 0 }}>
            {grid}
            <XAxis dataKey="service" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: string) => short(v, 13)} interval={0} angle={-30} textAnchor="end" height={64} fontSize={10} />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" name="Quotations" fill={C.blue} radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: '#0f172a' }} onClick={(d) => nav('/quotations' + qs({ service: String((d.payload as { service: string }).service) }))} />
          </BarChart>
        </ResponsiveContainer>
      ) : <Empty />}
    </Card>
  )
}

export function QuoteValueByServiceCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const rows = quoteServiceRows(current.quotations, current.deals).sort((a, b) => b.value - a.value).slice(0, 7)
  const total = sum(rows, (r) => r.value)
  const max = rows[0]?.value || 1
  return (
    <Card title="Quotation Value by Service">
      {rows.length ? (
        <ul className="space-y-2.5">
          {rows.map((r, i) => (
            <li key={r.service}>
              <button type="button" onClick={() => nav('/quotations' + qs({ service: r.service }))} className="w-full text-left group">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="truncate text-slate-600 group-hover:text-blue-700">{r.service}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-800">{inrShort(r.value)} <span className="font-normal text-slate-400">({pct(ratio(r.value, total), 0)})</span></span>
                </div>
                <Progress className="mt-1" value={(r.value / max) * 100} color={PALETTE[i]} />
              </button>
            </li>
          ))}
        </ul>
      ) : <Empty />}
    </Card>
  )
}

export function ServiceQuoteTable({ pageSize = 6 }: { pageSize?: number }) {
  const { current } = useFilters()
  const nav = useNavigate()
  const rows = quoteServiceRows(current.quotations, current.deals)
  return (
    <Card title="Service-wise Quotation Details" className="overflow-hidden">
      <DataTable
        dense
        rows={rows}
        rowKey={(r) => r.service}
        pageSize={pageSize}
        onRowClick={(r) => nav('/quotations' + qs({ service: r.service }))}
        initialSort={{ key: 'count', dir: 'desc' }}
        columns={[
          { key: 'service', header: 'Service', sort: (r) => r.service, render: (r) => <span className="font-medium text-slate-800">{r.service}</span> },
          { key: 'count', header: 'Quotes', align: 'right', sort: (r) => r.count },
          { key: 'value', header: 'Quoted', align: 'right', sort: (r) => r.value, render: (r) => inr(r.value) },
          { key: 'accepted', header: 'Accepted', align: 'right', sort: (r) => r.accepted },
          { key: 'pending', header: 'Pending', align: 'right', sort: (r) => r.pending },
          { key: 'rejected', header: 'Rejected', align: 'right', sort: (r) => r.rejected },
          { key: 'conv', header: 'Conv.', align: 'right', sort: (r) => r.conv, render: (r) => <span className="font-semibold">{pct(r.conv)}</span> },
        ]}
      />
    </Card>
  )
}

export function QuoteConversionCard() {
  const { current, previous } = useFilters()
  const k = quoteKpis(current)
  const p = quoteKpis(previous)
  const data = [{ name: 'Conversion', value: k.q2d, fill: C.blue }]
  return (
    <Card title="Quote to Deal Conversion">
      <div className="flex flex-col items-center">
        <div className="relative h-[150px] w-[150px]">
          <ResponsiveContainer>
            <RadialBarChart innerRadius="74%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#eef2f7' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-2xl font-extrabold text-slate-900">{pct(k.q2d)}</div>
        </div>
        <div className="mt-1 text-xs text-slate-500">{num(k.dealsFromQuotes)} deals / {num(k.count)} quotations</div>
        <div className="mt-2 text-[11.5px]">
          {(() => {
            const d = k.q2d - p.q2d
            return <span className={d >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{d >= 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} pts vs previous period</span>
          })()}
        </div>
      </div>
    </Card>
  )
}

export function QuoteStatusCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const by = groupBy(current.quotations, (q) => q.status)
  const data = (['Pending', 'Accepted', 'Rejected', 'Expired'] as const).map((s) => ({ name: s, value: by.get(s)?.length ?? 0 }))
  return (
    <Card title="Quotation Status">
      {current.quotations.length ? (
        <div className="flex items-center gap-4">
          <div className="h-[160px] w-[160px] shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={2} stroke="none" onClick={(d) => nav('/quotations' + qs({ status: String(d.name) }))}>
                  {data.map((d) => <Cell key={d.name} fill={colorOf(d.name)} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-2 text-[12.5px]">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2"><Badge>{d.name}</Badge><span className="ml-auto font-semibold tabular-nums">{d.value}</span></li>
            ))}
          </ul>
        </div>
      ) : <Empty />}
    </Card>
  )
}

/* ------------------------ Deals & Revenue ------------------------ */

export function DealsVsRevenueCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const rows = [...groupBy(current.deals, (d) => d.service).entries()]
    .map(([service, ds]) => ({ service, Deals: ds.length, Revenue: sum(ds.filter((d) => d.stage === 'Won'), (d) => d.value) }))
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 8)
  return (
    <Card title="Deals vs Revenue by Service" action={<Legend items={[{ label: 'Deals', color: C.blue }, { label: 'Revenue', color: C.amber }]} />}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={rows} margin={{ top: 8, right: 0, left: -14, bottom: 0 }}>
            {grid}
            <XAxis dataKey="service" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: string) => short(v, 13)} interval={0} angle={-30} textAnchor="end" height={64} fontSize={10} />
            <YAxis yAxisId="l" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis yAxisId="r" orientation="right" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: number) => inrShort(v)} width={58} />
            <Tooltip content={<ChartTooltip money={['Revenue']} />} cursor={{ fill: '#f1f5f9' }} />
            <Bar yAxisId="l" dataKey="Deals" fill={C.blue} radius={[4, 4, 0, 0]} barSize={16} onClick={(d) => nav('/deals' + qs({ service: String((d.payload as { service: string }).service) }))} />
            <Bar yAxisId="r" dataKey="Revenue" fill={C.amber} radius={[4, 4, 0, 0]} barSize={16} onClick={(d) => nav('/deals' + qs({ service: String((d.payload as { service: string }).service) }))} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <Empty />}
    </Card>
  )
}

export function RevenueByCategoryCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const won = current.deals.filter((d) => d.stage === 'Won')
  const total = sum(won, (d) => d.value)
  const rows = [...groupBy(won, (d) => d.category).entries()].map(([category, ds]) => ({ category, value: sum(ds, (d) => d.value), n: ds.length })).sort((a, b) => b.value - a.value)
  const max = rows[0]?.value || 1
  return (
    <Card title="Revenue by Order / Service Category">
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.category}>
              <button type="button" className="group w-full text-left" onClick={() => nav('/deals' + qs({ category: r.category }))}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-600 group-hover:text-blue-700">{r.category} <span className="text-slate-400">· {r.n}</span></span>
                  <span className="font-semibold tabular-nums">{inrShort(r.value)} <span className="font-normal text-slate-400">({pct(ratio(r.value, total), 0)})</span></span>
                </div>
                <Progress className="mt-1" value={(r.value / max) * 100} color={PALETTE[i]} />
              </button>
            </li>
          ))}
        </ul>
      ) : <Empty />}
    </Card>
  )
}

export function PriorityCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const total = sum(current.deals.filter((d) => d.stage === 'Won'), (d) => d.value)
  const rows = (['High', 'Medium', 'Low'] as const).map((p) => {
    const ds = current.deals.filter((d) => d.priority === p)
    const rev = sum(ds.filter((d) => d.stage === 'Won'), (d) => d.value)
    return { p, n: ds.length, rev, share: ratio(rev, total) }
  })
  return (
    <Card title="Priority Breakdown">
      <table className="w-full text-[12.5px]">
        <thead className="text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="pb-2 text-left font-semibold">Priority</th><th className="pb-2 text-right font-semibold">Deals</th><th className="pb-2 text-right font-semibold">Revenue</th><th className="pb-2 text-right font-semibold">%</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p} onClick={() => nav('/deals' + qs({ priority: r.p }))} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2.5"><Badge>{r.p}</Badge></td>
              <td className="py-2.5 text-right tabular-nums">{r.n}</td>
              <td className="py-2.5 text-right tabular-nums">{inr(r.rev)}</td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{pct(r.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {rows.map((r) => <div key={r.p} style={{ width: `${r.share}%`, background: colorOf(r.p) }} />)}
      </div>
    </Card>
  )
}

export function DailyRevenueCard({ height = 220 }: { height?: number }) {
  const { current, buckets } = useFilters()
  const booked = series(buckets, current.deals.filter((d) => d.stage === 'Won'), (d) => d.createdAt, { Revenue: (d) => d.value })
  const coll = series(buckets, current.payments, (p) => p.paidAt, { Collected: (p) => p.amount })
  const rows = booked.map((r, i) => ({ ...r, Collected: coll[i].Collected }))
  return (
    <Card title={`${grain(buckets)} Revenue Trend`} action={<Legend items={[{ label: 'Revenue', color: C.blue }, { label: 'Collected', color: C.green }]} />}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -6, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: number) => inrShort(v)} width={56} />
          <Tooltip content={<ChartTooltip money />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="Revenue" fill={C.blue} radius={[3, 3, 0, 0]} />
          <Bar dataKey="Collected" fill={C.green} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function TotalVsCollectedCard() {
  const { current, previous, scope } = useFilters()
  const k = dealKpis(current, scope.payments)
  const pk = dealKpis(previous, scope.payments)
  const p = ratio(k.collectedOnDeals, k.revenue)
  const tiles = [
    { label: 'Total Deal Value', v: k.revenue, pv: pk.revenue, icon: <IndianRupee size={16} />, cls: 'bg-blue-50 text-blue-700' },
    { label: 'Collected (on these deals)', v: k.collectedOnDeals, pv: pk.collectedOnDeals, icon: <CircleCheck size={16} />, cls: 'bg-emerald-50 text-emerald-700' },
    { label: 'Outstanding', v: k.outstanding, pv: pk.outstanding, icon: <Wallet size={16} />, cls: 'bg-amber-50 text-amber-700' },
  ]
  return (
    <Card title="Total vs Collected Revenue">
      <div className="space-y-2.5">
        {tiles.map((t) => (
          <div key={t.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${t.cls}`}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/70">{t.icon}</span>
            <div><div className="text-[11px] font-medium opacity-80">{t.label}</div><div className="text-lg font-extrabold tabular-nums">{inr(t.v)}</div></div>
          </div>
        ))}
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-slate-500"><span>Collection rate</span><b className="text-slate-800">{pct(p)}</b></div>
          <Progress value={p} color={C.green} />
        </div>
      </div>
    </Card>
  )
}

export function DealProgressCard() {
  const { current, scope } = useFilters()
  const nav = useNavigate()
  const ordersByDeal = groupBy(scope.orders, (o) => o.dealId)
  const stages = (['Negotiation', 'Won', 'Lost'] as const).map((s) => ({ s, n: current.deals.filter((d) => d.stage === s).length, v: sum(current.deals.filter((d) => d.stage === s), (d) => d.value) }))
  const won = current.deals.filter((d) => d.stage === 'Won')
  const buckets = [
    { label: 'Not started', test: (p: number) => p === 0 },
    { label: 'Under 50%', test: (p: number) => p > 0 && p < 50 },
    { label: '50–99%', test: (p: number) => p >= 50 && p < 100 },
    { label: 'Delivered', test: (p: number) => p >= 100 },
  ]
  const progOf = (id: string) => {
    const os = ordersByDeal.get(id) ?? []
    const t = sum(os, (o) => o.stagesTotal)
    return t ? (sum(os, (o) => o.stagesCompleted) / t) * 100 : 0
  }
  const prog = won.map((d) => progOf(d.id))
  return (
    <Card title="Deal Progress">
      <div className="grid grid-cols-3 gap-2">
        {stages.map((x) => (
          <button type="button" key={x.s} onClick={() => nav('/deals' + qs({ stage: x.s }))} className="rounded-xl border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40">
            <Badge>{x.s}</Badge>
            <div className="mt-1.5 text-lg font-extrabold tabular-nums">{x.n}</div>
            <div className="text-[11px] text-slate-500 tabular-nums">{inrShort(x.v)}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Delivery progress of won deals</div>
      <ul className="mt-2 space-y-2">
        {buckets.map((b, i) => {
          const n = prog.filter(b.test).length
          return (
            <li key={b.label} className="text-[12px]">
              <div className="flex justify-between"><span className="text-slate-600">{b.label}</span><b className="tabular-nums">{n}</b></div>
              <Progress className="mt-1" value={ratio(n, won.length)} color={[C.slate, C.amber, C.blue, C.green][i]} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ------------------------ Orders & Payments ------------------------ */

const ORDER_STATUSES: Order['status'][] = ['Pending', 'In Progress', 'Completed', 'On Hold']

export function OrderStatusCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const k = orderKpis(current.orders)
  const data = ORDER_STATUSES.map((s) => ({ name: s, value: current.orders.filter((o) => o.status === s).length }))
  return (
    <Card title="Order Status">
      {k.total ? (
        <div className="flex items-center gap-4">
          <div className="relative h-[160px] w-[160px] shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none" onClick={(d) => nav('/orders' + qs({ status: String(d.name) }))}>
                  {data.map((d) => <Cell key={d.name} fill={colorOf(d.name)} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><div className="text-xl font-extrabold">{k.total}</div><div className="text-[10px] uppercase text-slate-400">Orders</div></div></div>
          </div>
          <ul className="flex-1 space-y-2 text-[12.5px]">
            {data.map((d) => (
              <li key={d.name}><button type="button" onClick={() => nav('/orders' + qs({ status: d.name }))} className="flex w-full items-center gap-2 rounded px-1 hover:bg-slate-50"><Badge>{d.name}</Badge><span className="ml-auto font-semibold tabular-nums">{d.value}</span></button></li>
            ))}
            <li className="pt-1 text-[11px] text-slate-500">Overall stage progress <b className="text-slate-800">{pct(k.progress)}</b></li>
          </ul>
        </div>
      ) : <Empty />}
    </Card>
  )
}

export function OrderStageProgressCard() {
  const { current } = useFilters()
  const nav = useNavigate()
  const rows = [...groupBy(current.orders, (o) => o.service).entries()]
    .map(([service, os]) => ({ service, total: os.length, ...Object.fromEntries(ORDER_STATUSES.map((s) => [s, os.filter((o) => o.status === s).length])) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7)
  return (
    <Card title="Orders & Stage Progress" action={<Legend items={ORDER_STATUSES.map((s) => ({ label: s, color: colorOf(s) }))} />}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 34)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barSize={14}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="service" tick={axis} tickLine={false} axisLine={false} width={150} tickFormatter={(v: string) => short(v, 22)} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            {ORDER_STATUSES.map((s, i) => (
              <Bar key={s} dataKey={s} stackId="o" fill={colorOf(s)} radius={i === ORDER_STATUSES.length - 1 ? [0, 4, 4, 0] : 0} onClick={(d) => nav('/orders' + qs({ service: String((d.payload as { service: string }).service), status: s }))} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : <Empty />}
    </Card>
  )
}

export function CollectionTrendCard() {
  const { current, buckets } = useFilters()
  const rows = series(buckets, current.payments, (p) => p.paidAt, { Collected: (p) => p.amount, Payments: () => 1 })
  let run = 0
  const data = rows.map((r) => { run += r.Collected as number; return { ...r, Cumulative: run } })
  return (
    <Card title="Collection Trend" action={<Legend items={[{ label: 'Collected', color: C.green }, { label: 'Cumulative', color: C.blue }]} />}>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 0, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.25} /><stop offset="100%" stopColor={C.blue} stopOpacity={0} /></linearGradient>
          </defs>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis yAxisId="l" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: number) => inrShort(v)} width={56} />
          <YAxis yAxisId="r" orientation="right" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: number) => inrShort(v)} width={60} />
          <Tooltip content={<ChartTooltip money={['Collected', 'Cumulative']} />} />
          <Bar yAxisId="l" dataKey="Collected" fill={C.green} radius={[3, 3, 0, 0]} />
          <Area yAxisId="r" type="monotone" dataKey="Cumulative" stroke={C.blue} strokeWidth={2} fill="url(#gCum)" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CompletedOrdersTrendCard() {
  const { current, buckets, scope, cur } = useFilters()
  const completed = scope.orders.filter((o) => o.completedAt && o.completedAt >= cur.start && o.completedAt <= cur.end)
  const created = series(buckets, current.orders, (o) => o.createdAt, { Created: () => 1 })
  const done = series(buckets, completed, (o) => o.completedAt!, { Completed: () => 1 })
  const rows = created.map((r, i) => ({ ...r, Completed: done[i].Completed }))
  return (
    <Card title="Orders Created vs Completed" action={<Legend items={[{ label: 'Created', color: C.blue }, { label: 'Completed', color: C.green }]} />}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="Created" stroke={C.blue} strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="Completed" stroke={C.green} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function PaymentModeCard() {
  const { current } = useFilters()
  const total = sum(current.payments, (p) => p.amount)
  const rows = [...groupBy(current.payments, (p) => p.mode).entries()].map(([mode, ps]) => ({ mode, n: ps.length, v: sum(ps, (p) => p.amount) })).sort((a, b) => b.v - a.v)
  return (
    <Card title="Payments by Mode" icon={<Banknote size={15} />}>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.mode} className="text-[12px]">
              <div className="flex justify-between"><span className="text-slate-600">{r.mode} <span className="text-slate-400">· {r.n}</span></span><b className="tabular-nums">{inr(r.v)}</b></div>
              <Progress className="mt-1" value={ratio(r.v, total)} color={PALETTE[i]} />
            </li>
          ))}
        </ul>
      ) : <Empty />}
    </Card>
  )
}

/* ------------------------- Team & activity ------------------------- */

export function SalesTeamCard() {
  const { current, data, ownerId } = useFilters()
  const rows = data.users.filter((u) => u.team === 'Sales' && (ownerId === 'all' || u.id === ownerId)).map((u) => {
    const ls = current.leads.filter((l) => l.ownerId === u.id)
    const ds = current.deals.filter((d) => d.ownerId === u.id)
    const won = ds.filter((d) => d.stage === 'Won')
    return {
      u, leads: ls.length, qualified: ls.filter(isQualified).length, converted: ls.filter((l) => l.status === 'Converted').length,
      quotes: current.quotations.filter((q) => q.ownerId === u.id).length, deals: ds.length, value: sum(ds, (d) => d.value), revenue: sum(won, (d) => d.value),
    }
  })
  return (
    <Card title="Sales Team Activity" action={<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Sales Team</span>}>
      <DataTable
        dense pageSize={6} rows={rows} rowKey={(r) => r.u.id} initialSort={{ key: 'revenue', dir: 'desc' }}
        columns={[
          { key: 'user', header: 'User', sort: (r) => r.u.name, render: (r) => <span className="flex items-center gap-2"><Avatar name={r.u.name} /><span className="font-medium text-slate-800">{r.u.name}</span></span> },
          { key: 'leads', header: 'Leads', align: 'right', sort: (r) => r.leads },
          { key: 'converted', header: 'Converted', align: 'right', sort: (r) => r.converted },
          { key: 'conv', header: 'Conv. %', align: 'right', sort: (r) => ratio(r.converted, r.leads), render: (r) => <b>{pct(ratio(r.converted, r.leads))}</b> },
          { key: 'deals', header: 'Deals', align: 'right', sort: (r) => r.deals },
          { key: 'revenue', header: 'Revenue', align: 'right', sort: (r) => r.revenue, render: (r) => <b className="text-slate-900">{inr(r.revenue)}</b> },
        ]}
      />
    </Card>
  )
}

export function OpsTeamCard() {
  const { current, data, scope, cur } = useFilters()
  const now = new Date()
  const rows = data.users.filter((u) => u.team === 'Operations').map((u) => {
    const os = current.orders.filter((o) => o.assigneeId === u.id)
    const done = scope.orders.filter((o) => o.assigneeId === u.id && o.completedAt && o.completedAt >= cur.start && o.completedAt <= cur.end)
    return {
      u, updated: os.length, stages: sum(os, (o) => o.stagesCompleted), pendingStages: sum(os, (o) => o.stagesTotal - o.stagesCompleted),
      completed: done.length, overdue: os.filter((o) => o.status !== 'Completed' && o.dueAt < now).length,
    }
  })
  return (
    <Card title="Operations Team Activity" action={<span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Operations</span>}>
      <DataTable
        dense pageSize={6} rows={rows} rowKey={(r) => r.u.id} initialSort={{ key: 'updated', dir: 'desc' }}
        columns={[
          { key: 'user', header: 'User', sort: (r) => r.u.name, render: (r) => <span className="flex items-center gap-2"><Avatar name={r.u.name} /><span className="font-medium text-slate-800">{r.u.name}</span></span> },
          { key: 'updated', header: 'Orders', align: 'right', sort: (r) => r.updated },
          { key: 'stages', header: 'Stages done', align: 'right', sort: (r) => r.stages },
          { key: 'completed', header: 'Completed', align: 'right', sort: (r) => r.completed },
          { key: 'overdue', header: 'Overdue', align: 'right', sort: (r) => r.overdue, render: (r) => <span className={r.overdue ? 'font-semibold text-rose-600' : ''}>{r.overdue}</span> },
        ]}
      />
    </Card>
  )
}

export function CrmActivityCard({ limit = 9 }: { limit?: number }) {
  const { current, userName } = useFilters()
  const nav = useNavigate()
  const items = current.activities.slice(0, limit)
  const tone = (a: string) => (a.includes('Payment') ? C.green : a.includes('Deal') ? C.amber : a.includes('Quotation') ? C.violet : a.includes('Order') || a.includes('Stage') ? C.cyan : a.includes('disqual') ? C.rose : C.blue)
  return (
    <Card title="Recent CRM Activity" bodyClass="!pt-2">
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => nav(a.dealId && !a.action.includes('Lead') ? `/deals/${a.dealId}` : `/leads/${a.leadId}`)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50">
                <Avatar name={userName(a.userId)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-slate-700"><b className="font-semibold text-slate-900">{userName(a.userId)}</b> · <span style={{ color: tone(a.action) }}>{a.action}</span></div>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(a.at)}</div>
                </div>
                <span className="font-mono text-[11px] text-blue-600">#{a.record}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <Empty>No activity in this period</Empty>}
    </Card>
  )
}
