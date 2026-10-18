import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { LeadKpiRow } from './Overview'
import { LeadFunnelCard, LeadSourceTrendCard, LeadSourcesCard, LeadStatusTrendCard, LeadTrendCard } from '../components/charts'
import { Badge, Card } from '../components/ui'
import { Chip, DataTable } from '../components/DataTable'
import { useFilters } from '../lib/filters'
import { fmtDateTime } from '../lib/format'
import { isQualified } from '../lib/metrics'
import type { Lead } from '../data/types'

const STATUS_CHIPS = [
  { id: '', label: 'All' },
  { id: 'New', label: 'New' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'Qualified+', label: 'Qualified (incl. converted)' },
  { id: 'Converted', label: 'Converted' },
  { id: 'Unqualified', label: 'Unqualified' },
]
const SOURCES = ['Google Ads', 'Website', 'Referral', 'Just Dial', 'Social Media', 'Other']

export default function Leads() {
  const { current, scope, userName } = useFilters()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const source = params.get('source') ?? ''
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const counts = (l: Lead) => (status === 'Qualified+' ? isQualified(l) : !status || l.status === status) && (!source || l.source === source)
  const rows = current.leads.filter(counts)
  const qByLead = new Map<string, number>()
  for (const q of scope.quotations) qByLead.set(q.leadId, (qByLead.get(q.leadId) ?? 0) + 1)
  const dByLead = new Map<string, number>()
  for (const d of scope.deals) dByLead.set(d.leadId, (dByLead.get(d.leadId) ?? 0) + 1)

  return (
    <>
      <LeadKpiRow extra={false} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LeadFunnelCard />
        <LeadSourcesCard />
        <div className="md:col-span-2 xl:col-span-1"><LeadTrendCard /></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LeadStatusTrendCard />
        <LeadSourceTrendCard />
      </div>
      <Card title="All Leads" icon={<Users size={15} />} action={<span className="text-[11px] text-slate-400">Click a lead to see its quotations, deals, orders &amp; payments</span>}>
        <div className="mb-3 flex flex-wrap gap-2">
          {STATUS_CHIPS.map((c) => <Chip key={c.id} active={status === c.id} onClick={() => setParam('status', c.id)}>{c.label}</Chip>)}
          <select aria-label="Lead source" value={source} onChange={(e) => setParam('source', e.target.value)} className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none">
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable
          rows={rows}
          rowKey={(l) => l.id}
          search={(l) => `${l.id} ${l.name} ${l.company} ${l.city} ${l.service} ${l.source} ${l.status} ${userName(l.ownerId)}`}
          placeholder="Search name, company, ID, city…"
          onRowClick={(l) => nav(`/leads/${l.id}`)}
          initialSort={{ key: 'created', dir: 'desc' }}
          columns={[
            { key: 'id', header: 'Lead', sort: (l) => l.id, render: (l) => <span className="font-mono text-xs text-blue-600">{l.id}</span> },
            { key: 'name', header: 'Name', sort: (l) => l.name, render: (l) => <div><div className="font-medium text-slate-900">{l.name}</div><div className="text-[11px] text-slate-400">{l.company}</div></div> },
            { key: 'service', header: 'Service', sort: (l) => l.service },
            { key: 'source', header: 'Source', sort: (l) => l.source },
            { key: 'city', header: 'City', sort: (l) => l.city },
            { key: 'owner', header: 'Owner', sort: (l) => userName(l.ownerId), render: (l) => userName(l.ownerId) },
            { key: 'status', header: 'Status', sort: (l) => l.status, render: (l) => <Badge>{l.status}</Badge> },
            { key: 'q', header: 'Quotes', align: 'right', sort: (l) => qByLead.get(l.id) ?? 0, render: (l) => qByLead.get(l.id) ?? 0 },
            { key: 'd', header: 'Deals', align: 'right', sort: (l) => dByLead.get(l.id) ?? 0, render: (l) => dByLead.get(l.id) ?? 0 },
            { key: 'created', header: 'Created', sort: (l) => l.createdAt.getTime(), render: (l) => <span className="text-slate-500">{fmtDateTime(l.createdAt)}</span> },
          ]}
        />
      </Card>
    </>
  )
}
