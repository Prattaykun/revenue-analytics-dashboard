import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheck, Handshake, IndianRupee, Percent, Wallet, TrendingUp } from 'lucide-react'
import { Badge, Card, KpiCard, Progress } from '../components/ui'
import { Chip, DataTable } from '../components/DataTable'
import { DailyRevenueCard, DealProgressCard, DealsVsRevenueCard, PriorityCard, RevenueByCategoryCard, TotalVsCollectedCard } from '../components/charts'
import { useFilters } from '../lib/filters'
import { fmtDate, inr, inrShort, num, pct, ratio } from '../lib/format'
import { dealKpis, groupBy, paidByDeal, sum } from '../lib/metrics'
import { C } from '../lib/colors'

export default function Deals() {
  const { current, previous, scope, leadById, userName } = useFilters()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const f = { service: params.get('service') ?? '', category: params.get('category') ?? '', priority: params.get('priority') ?? '', stage: params.get('stage') ?? '' }
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const c = dealKpis(current, scope.payments)
  const p = dealKpis(previous, scope.payments)
  const paid = paidByDeal(scope.payments)
  const ordersByDeal = groupBy(scope.orders, (o) => o.dealId)
  const progress = (id: string) => {
    const os = ordersByDeal.get(id) ?? []
    const t = sum(os, (o) => o.stagesTotal)
    return t ? (sum(os, (o) => o.stagesCompleted) / t) * 100 : 0
  }
  const rows = current.deals.filter((d) => (!f.service || d.service === f.service) && (!f.category || d.category === f.category) && (!f.priority || d.priority === f.priority) && (!f.stage || d.stage === f.stage))
  const activeFilters = Object.entries(f).filter(([, v]) => v)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Deals Created" icon={<Handshake size={15} />} value={num(c.deals)} sub={<>{num(c.won)} won</>} cur={c.deals} prev={p.deals} />
        <KpiCard label="Revenue (Won)" tone="indigo" icon={<IndianRupee size={15} />} value={inrShort(c.revenue)} cur={c.revenue} prev={p.revenue} onClick={() => setParam('stage', 'Won')} active={f.stage === 'Won'} />
        <KpiCard label="Collected" tone="green" icon={<CircleCheck size={15} />} value={inrShort(c.collected)} cur={c.collected} prev={p.collected} />
        <KpiCard label="Outstanding" tone="amber" icon={<Wallet size={15} />} value={inrShort(c.outstanding)} cur={c.outstanding} prev={p.outstanding} invert />
        <KpiCard label="Avg. Deal Size" tone="cyan" icon={<TrendingUp size={15} />} value={inrShort(c.avgDeal)} cur={c.avgDeal} prev={p.avgDeal} />
        <KpiCard label="Win Rate" tone="violet" icon={<Percent size={15} />} value={pct(c.winRate)} cur={c.winRate} prev={p.winRate} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DealsVsRevenueCard />
        <RevenueByCategoryCard />
        <PriorityCard />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6"><DailyRevenueCard height={250} /></div>
        <div className="xl:col-span-3"><TotalVsCollectedCard /></div>
        <div className="xl:col-span-3"><DealProgressCard /></div>
      </div>
      <Card title="Deals" icon={<Handshake size={15} />} action={<span className="text-[11px] text-slate-400">Click a deal for its orders &amp; payments</span>}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['', 'Negotiation', 'Won', 'Lost'].map((s) => <Chip key={s} active={f.stage === s} onClick={() => setParam('stage', s)}>{s || 'All stages'}</Chip>)}
          <span className="mx-1 h-5 w-px bg-slate-200" />
          {['High', 'Medium', 'Low'].map((s) => <Chip key={s} active={f.priority === s} onClick={() => setParam('priority', f.priority === s ? '' : s)}>{s}</Chip>)}
          {activeFilters.filter(([k]) => k === 'service' || k === 'category').map(([k, v]) => (
            <button key={k} type="button" onClick={() => setParam(k, '')} className="h-8 rounded-full bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100">{v} ✕</button>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(d) => d.id}
          search={(d) => `${d.id} ${d.leadId} ${leadById.get(d.leadId)?.name} ${leadById.get(d.leadId)?.company} ${d.service} ${d.category} ${d.stage} ${d.priority}`}
          placeholder="Search deal, lead, service…"
          onRowClick={(d) => nav(`/deals/${d.id}`)}
          initialSort={{ key: 'created', dir: 'desc' }}
          columns={[
            { key: 'id', header: 'Deal', sort: (d) => d.id, render: (d) => <span className="font-mono text-xs text-blue-600">{d.id}</span> },
            { key: 'lead', header: 'Lead', sort: (d) => leadById.get(d.leadId)?.name ?? '', render: (d) => <div><div className="font-medium text-slate-900">{leadById.get(d.leadId)?.name}</div><div className="text-[11px] text-slate-400">{leadById.get(d.leadId)?.company}</div></div> },
            { key: 'service', header: 'Service', sort: (d) => d.service },
            { key: 'value', header: 'Value', align: 'right', sort: (d) => d.value, render: (d) => <b className="text-slate-900">{inr(d.value)}</b> },
            { key: 'collected', header: 'Collected', align: 'right', sort: (d) => paid.get(d.id) ?? 0, render: (d) => inr(paid.get(d.id) ?? 0) },
            { key: 'outstanding', header: 'Outstanding', align: 'right', sort: (d) => (d.stage === 'Won' ? d.value - (paid.get(d.id) ?? 0) : 0), render: (d) => { const o = d.stage === 'Won' ? d.value - (paid.get(d.id) ?? 0) : 0; return <span className={o > 0 ? 'text-amber-600' : 'text-slate-400'}>{inr(o)}</span> } },
            { key: 'priority', header: 'Priority', sort: (d) => d.priority, render: (d) => <Badge>{d.priority}</Badge> },
            { key: 'stage', header: 'Stage', sort: (d) => d.stage, render: (d) => <Badge>{d.stage}</Badge> },
            { key: 'progress', header: 'Delivery', sort: (d) => progress(d.id), render: (d) => <div className="flex w-28 items-center gap-2"><Progress value={progress(d.id)} color={progress(d.id) >= 100 ? C.green : C.blue} /><span className="text-[11px] tabular-nums text-slate-500">{pct(progress(d.id), 0)}</span></div> },
            { key: 'collect', header: 'Paid %', align: 'right', sort: (d) => ratio(paid.get(d.id) ?? 0, d.value), render: (d) => pct(ratio(paid.get(d.id) ?? 0, d.value), 0) },
            { key: 'owner', header: 'Owner', sort: (d) => userName(d.ownerId), render: (d) => userName(d.ownerId) },
            { key: 'created', header: 'Created', sort: (d) => d.createdAt.getTime(), render: (d) => <span className="text-slate-500">{fmtDate(d.createdAt)}</span> },
          ]}
        />
      </Card>
    </>
  )
}
