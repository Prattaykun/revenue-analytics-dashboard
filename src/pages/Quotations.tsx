import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheck, Clock, FileText, IndianRupee, Percent, Receipt } from 'lucide-react'
import { Badge, Card, KpiCard } from '../components/ui'
import { Chip, DataTable } from '../components/DataTable'
import { QuoteConversionCard, QuoteStatusCard, QuoteValueByServiceCard, QuotesByServiceCard, ServiceQuoteTable } from '../components/charts'
import { useFilters } from '../lib/filters'
import { fmtDateTime, inr, inrShort, num, pct } from '../lib/format'
import { groupBy, quoteKpis, sum } from '../lib/metrics'

export default function Quotations() {
  const { current, previous, leadById, userName } = useFilters()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const service = params.get('service') ?? ''
  const status = params.get('status') ?? ''
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const c = quoteKpis(current)
  const p = quoteKpis(previous)
  const rows = current.quotations.filter((q) => (!service || q.service === service) && (!status || q.status === status))
  const dealByQuote = new Map(current.deals.map((d) => [d.quotationId, d]))

  const leadRows = [...groupBy(rows, (q) => q.leadId).entries()].map(([leadId, qsx]) => {
    const sorted = [...qsx].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return {
      lead: leadById.get(leadId)!,
      n: qsx.length,
      value: sum(qsx, (q) => q.amount),
      accepted: qsx.filter((q) => q.status === 'Accepted').length,
      services: [...new Set(qsx.map((q) => q.service))].join(', '),
      latest: sorted[0],
    }
  })
  const services = [...new Set(current.quotations.map((q) => q.service))].sort()

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Quotations" icon={<FileText size={15} />} value={num(c.count)} cur={c.count} prev={p.count} />
        <KpiCard label="Quotation Value" tone="indigo" icon={<IndianRupee size={15} />} value={inrShort(c.value)} cur={c.value} prev={p.value} />
        <KpiCard label="Accepted" tone="green" icon={<CircleCheck size={15} />} value={num(c.accepted)} cur={c.accepted} prev={p.accepted} onClick={() => setParam('status', 'Accepted')} active={status === 'Accepted'} />
        <KpiCard label="Pending" tone="amber" icon={<Clock size={15} />} value={num(c.pending)} cur={c.pending} prev={p.pending} onClick={() => setParam('status', 'Pending')} active={status === 'Pending'} />
        <KpiCard label="Avg. Quote" tone="cyan" icon={<Receipt size={15} />} value={inrShort(c.avg)} cur={c.avg} prev={p.avg} />
        <KpiCard label="Quote → Deal" tone="violet" icon={<Percent size={15} />} value={pct(c.q2d)} cur={c.q2d} prev={p.q2d} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuotesByServiceCard />
        <QuoteValueByServiceCard />
        <QuoteStatusCard />
        <QuoteConversionCard />
      </div>
      <ServiceQuoteTable pageSize={12} />
      <Card title="Quotations" icon={<FileText size={15} />}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['', 'Pending', 'Accepted', 'Rejected', 'Expired'].map((s) => <Chip key={s} active={status === s} onClick={() => setParam('status', s)}>{s || 'All statuses'}</Chip>)}
          <select aria-label="Service" value={service} onChange={(e) => setParam('service', e.target.value)} className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none">
            <option value="">All services</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable
          rows={rows}
          rowKey={(q) => q.id}
          search={(q) => `${q.id} ${q.leadId} ${leadById.get(q.leadId)?.name} ${leadById.get(q.leadId)?.company} ${q.service} ${q.status}`}
          placeholder="Search quote, lead, service…"
          onRowClick={(q) => nav(`/leads/${q.leadId}`)}
          initialSort={{ key: 'created', dir: 'desc' }}
          columns={[
            { key: 'id', header: 'Quote', sort: (q) => q.id, render: (q) => <span className="font-mono text-xs text-blue-600">{q.id}</span> },
            { key: 'lead', header: 'Lead', sort: (q) => leadById.get(q.leadId)?.name ?? '', render: (q) => <div><div className="font-medium text-slate-900">{leadById.get(q.leadId)?.name}</div><div className="text-[11px] text-slate-400">{q.leadId}</div></div> },
            { key: 'service', header: 'Service', sort: (q) => q.service },
            { key: 'amount', header: 'Amount', align: 'right', sort: (q) => q.amount, render: (q) => inr(q.amount) },
            { key: 'status', header: 'Status', sort: (q) => q.status, render: (q) => <Badge>{q.status}</Badge> },
            { key: 'deal', header: 'Deal', render: (q) => dealByQuote.get(q.id) ? <button type="button" onClick={(e) => { e.stopPropagation(); nav(`/deals/${dealByQuote.get(q.id)!.id}`) }} className="font-mono text-xs text-blue-600 hover:underline">{dealByQuote.get(q.id)!.id}</button> : <span className="text-slate-300">—</span> },
            { key: 'owner', header: 'Owner', sort: (q) => userName(q.ownerId), render: (q) => userName(q.ownerId) },
            { key: 'created', header: 'Created', sort: (q) => q.createdAt.getTime(), render: (q) => <span className="text-slate-500">{fmtDateTime(q.createdAt)}</span> },
          ]}
        />
      </Card>
      <Card title="Lead-wise Quotation History" action={<span className="text-[11px] text-slate-400">One lead → many quotations</span>}>
        <DataTable
          rows={leadRows}
          rowKey={(r) => r.lead.id}
          search={(r) => `${r.lead.id} ${r.lead.name} ${r.lead.company} ${r.services}`}
          placeholder="Search lead…"
          onRowClick={(r) => nav(`/leads/${r.lead.id}`)}
          initialSort={{ key: 'n', dir: 'desc' }}
          columns={[
            { key: 'lead', header: 'Lead', sort: (r) => r.lead.name, render: (r) => <div><div className="font-medium text-slate-900">{r.lead.name}</div><div className="text-[11px] text-slate-400">{r.lead.id} · {r.lead.company}</div></div> },
            { key: 'n', header: 'Quotes', align: 'right', sort: (r) => r.n },
            { key: 'services', header: 'Services quoted', sort: (r) => r.services, className: 'max-w-[280px] truncate' },
            { key: 'value', header: 'Total value', align: 'right', sort: (r) => r.value, render: (r) => inr(r.value) },
            { key: 'accepted', header: 'Accepted', align: 'right', sort: (r) => r.accepted },
            { key: 'latest', header: 'Latest', sort: (r) => r.latest.createdAt.getTime(), render: (r) => <span className="flex items-center gap-2"><Badge>{r.latest.status}</Badge><span className="text-[11px] text-slate-400">{fmtDateTime(r.latest.createdAt)}</span></span> },
          ]}
        />
      </Card>
    </>
  )
}
