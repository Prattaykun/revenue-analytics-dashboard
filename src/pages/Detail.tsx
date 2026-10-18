import { ArrowLeft, Building2, CalendarDays, FileText, Handshake, Mail, MapPin, Package, Phone, Receipt, User as UserIcon, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Card, Empty, Progress, Stat } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { useFilters } from '../lib/filters'
import { fmtDate, fmtDateTime, inr, pct, ratio } from '../lib/format'
import { sum } from '../lib/metrics'
import { C } from '../lib/colors'
import type { Deal, Order, Payment, Quotation } from '../data/types'

function Back({ to, label }: { to: string; label: string }) {
  const nav = useNavigate()
  return (
    <button type="button" onClick={() => (window.history.length > 1 ? nav(-1) : nav(to))} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-blue-700">
      <ArrowLeft size={15} /> {label}
    </button>
  )
}

function Info({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <div className="flex items-center gap-2 text-[13px] text-slate-600"><span className="text-slate-400">{icon}</span>{children}</div>
}

export function OrdersTable({ orders, onClick }: { orders: Order[]; onClick?: (o: Order) => void }) {
  const { userName } = useFilters()
  return (
    <DataTable
      dense rows={orders} rowKey={(o) => o.id} pageSize={8} onRowClick={onClick} initialSort={{ key: 'created', dir: 'desc' }}
      columns={[
        { key: 'id', header: 'Order', sort: (o) => o.id, render: (o) => <span className="font-mono text-xs text-blue-600">{o.id}</span> },
        { key: 'service', header: 'Service', sort: (o) => o.service, render: (o) => <div><div className="text-slate-800">{o.service}</div><div className="text-[11px] text-slate-400">{o.title}</div></div> },
        { key: 'amount', header: 'Amount', align: 'right', sort: (o) => o.amount, render: (o) => inr(o.amount) },
        { key: 'status', header: 'Status', sort: (o) => o.status, render: (o) => <Badge>{o.status}</Badge> },
        { key: 'progress', header: 'Progress', sort: (o) => o.stagesCompleted / o.stagesTotal, render: (o) => (
          <div className="flex w-36 items-center gap-2"><Progress value={(o.stagesCompleted / o.stagesTotal) * 100} color={o.status === 'On Hold' ? C.rose : o.status === 'Completed' ? C.green : C.blue} /><span className="text-[11px] tabular-nums text-slate-500">{o.stagesCompleted}/{o.stagesTotal}</span></div>
        ) },
        { key: 'assignee', header: 'Assignee', sort: (o) => userName(o.assigneeId), render: (o) => userName(o.assigneeId) },
        { key: 'created', header: 'Created', sort: (o) => o.createdAt.getTime(), render: (o) => fmtDate(o.createdAt) },
        { key: 'due', header: 'Due', sort: (o) => o.dueAt.getTime(), render: (o) => <span className={o.status !== 'Completed' && o.dueAt < new Date() ? 'font-medium text-rose-600' : ''}>{fmtDate(o.dueAt)}</span> },
      ]}
    />
  )
}

export function PaymentsTable({ payments, onClick, pageSize = 8 }: { payments: Payment[]; onClick?: (p: Payment) => void; pageSize?: number }) {
  return (
    <DataTable
      dense rows={payments} rowKey={(p) => p.id} pageSize={pageSize} onRowClick={onClick} initialSort={{ key: 'paid', dir: 'desc' }}
      search={payments.length > 8 ? (p) => `${p.id} ${p.dealId} ${p.orderId} ${p.leadId} ${p.mode} ${p.kind}` : undefined}
      placeholder="Search payment, deal, mode…"
      columns={[
        { key: 'id', header: 'Payment', sort: (p) => p.id, render: (p) => <span className="font-mono text-xs text-blue-600">{p.id}</span> },
        { key: 'deal', header: 'Deal', sort: (p) => p.dealId, render: (p) => <span className="font-mono text-xs">{p.dealId}</span> },
        { key: 'order', header: 'Order', sort: (p) => p.orderId, render: (p) => <span className="font-mono text-xs">{p.orderId}</span> },
        { key: 'kind', header: 'Type', sort: (p) => p.kind },
        { key: 'mode', header: 'Mode', sort: (p) => p.mode },
        { key: 'amount', header: 'Amount', align: 'right', sort: (p) => p.amount, render: (p) => <b className="text-emerald-700">{inr(p.amount)}</b> },
        { key: 'paid', header: 'Paid on', sort: (p) => p.paidAt.getTime(), render: (p) => fmtDateTime(p.paidAt) },
      ]}
    />
  )
}

function DealsTable({ deals, paid }: { deals: Deal[]; paid: Map<string, number> }) {
  const nav = useNavigate()
  return (
    <DataTable
      dense rows={deals} rowKey={(d) => d.id} onRowClick={(d) => nav(`/deals/${d.id}`)} initialSort={{ key: 'created', dir: 'desc' }}
      columns={[
        { key: 'id', header: 'Deal', sort: (d) => d.id, render: (d) => <span className="font-mono text-xs text-blue-600">{d.id}</span> },
        { key: 'service', header: 'Service', sort: (d) => d.service },
        { key: 'value', header: 'Value', align: 'right', sort: (d) => d.value, render: (d) => inr(d.value) },
        { key: 'collected', header: 'Collected', align: 'right', sort: (d) => paid.get(d.id) ?? 0, render: (d) => inr(paid.get(d.id) ?? 0) },
        { key: 'priority', header: 'Priority', sort: (d) => d.priority, render: (d) => <Badge>{d.priority}</Badge> },
        { key: 'stage', header: 'Stage', sort: (d) => d.stage, render: (d) => <Badge>{d.stage}</Badge> },
        { key: 'created', header: 'Created', sort: (d) => d.createdAt.getTime(), render: (d) => fmtDate(d.createdAt) },
      ]}
    />
  )
}

function QuotesTable({ quotes, dealByQuote }: { quotes: Quotation[]; dealByQuote: Map<string, Deal> }) {
  const nav = useNavigate()
  return (
    <DataTable
      dense rows={quotes} rowKey={(q) => q.id} initialSort={{ key: 'created', dir: 'desc' }}
      onRowClick={(q) => { const d = dealByQuote.get(q.id); if (d) nav(`/deals/${d.id}`) }}
      columns={[
        { key: 'id', header: 'Quotation', sort: (q) => q.id, render: (q) => <span className="font-mono text-xs text-blue-600">{q.id}</span> },
        { key: 'service', header: 'Service', sort: (q) => q.service },
        { key: 'amount', header: 'Amount', align: 'right', sort: (q) => q.amount, render: (q) => inr(q.amount) },
        { key: 'status', header: 'Status', sort: (q) => q.status, render: (q) => <Badge>{q.status}</Badge> },
        { key: 'deal', header: 'Deal', render: (q) => dealByQuote.get(q.id) ? <span className="font-mono text-xs text-blue-600">{dealByQuote.get(q.id)!.id} →</span> : <span className="text-slate-300">—</span> },
        { key: 'created', header: 'Created', sort: (q) => q.createdAt.getTime(), render: (q) => fmtDateTime(q.createdAt) },
      ]}
    />
  )
}

function Timeline({ leadId, dealId }: { leadId: string; dealId?: string }) {
  const { data, userName } = useFilters()
  const items = data.activities.filter((a) => a.leadId === leadId && (!dealId || a.dealId === dealId)).slice(0, 14)
  return (
    <Card title="Activity Timeline" icon={<CalendarDays size={15} />}>
      {items.length ? (
        <ol className="relative ml-2 space-y-3 border-l border-slate-200 pl-5">
          {items.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
              <div className="text-[12.5px] text-slate-800"><b>{a.action}</b> <span className="font-mono text-[11px] text-blue-600">#{a.record}</span></div>
              <div className="text-[11px] text-slate-400">{fmtDateTime(a.at)} · {userName(a.userId)}</div>
            </li>
          ))}
        </ol>
      ) : <Empty>No activity yet</Empty>}
    </Card>
  )
}

export function LeadDetail() {
  const { id } = useParams()
  const { data, leadById, userName } = useFilters()
  const nav = useNavigate()
  const lead = id ? leadById.get(id) : undefined
  if (!lead) return <Card><Empty>Lead not found. <Link className="ml-1 text-blue-600" to="/leads">Back to leads</Link></Empty></Card>
  const quotes = data.quotations.filter((q) => q.leadId === lead.id)
  const deals = data.deals.filter((d) => d.leadId === lead.id)
  const orders = data.orders.filter((o) => o.leadId === lead.id)
  const payments = data.payments.filter((p) => p.leadId === lead.id)
  const paid = new Map<string, number>()
  for (const p of payments) paid.set(p.dealId, (paid.get(p.dealId) ?? 0) + p.amount)
  const dealByQuote = new Map(deals.map((d) => [d.quotationId, d]))
  const won = sum(deals.filter((d) => d.stage === 'Won'), (d) => d.value)
  const collected = sum(payments, (p) => p.amount)

  return (
    <>
      <Back to="/leads" label="Back" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white">{lead.name.split(' ').map((p) => p[0]).join('')}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold text-slate-900">{lead.name}</h2><Badge>{lead.status}</Badge><span className="font-mono text-xs text-slate-400">{lead.id}</span></div>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <Info icon={<Building2 size={14} />}>{lead.company}</Info>
                <Info icon={<MapPin size={14} />}>{lead.city}</Info>
                <Info icon={<Mail size={14} />}>{lead.email}</Info>
                <Info icon={<Phone size={14} />}>{lead.phone}</Info>
                <Info icon={<FileText size={14} />}>Interested in {lead.service} · via {lead.source}</Info>
                <Info icon={<UserIcon size={14} />}><span className="flex items-center gap-1.5"><Avatar name={userName(lead.ownerId)} />{userName(lead.ownerId)}</span></Info>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Quotations" value={quotes.length} sub={inr(sum(quotes, (q) => q.amount)) + ' quoted'} />
            <Stat label="Deals" value={deals.length} sub={`${deals.filter((d) => d.stage === 'Won').length} won`} />
            <Stat label="Revenue (won)" value={inr(won)} sub={`${orders.length} orders`} />
            <Stat label="Collected" value={inr(collected)} sub={`${inr(Math.max(0, won - collected))} outstanding`} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-slate-500">
            <span>Created <b className="text-slate-700">{fmtDateTime(lead.createdAt)}</b></span>
            {lead.qualifiedAt && <span>Qualified <b className="text-slate-700">{fmtDateTime(lead.qualifiedAt)}</b></span>}
            {lead.convertedAt && <span>Converted <b className="text-slate-700">{fmtDateTime(lead.convertedAt)}</b></span>}
          </div>
        </Card>
        <Timeline leadId={lead.id} />
      </div>
      <Card title={`Quotations (${quotes.length})`} icon={<FileText size={15} />} action={<span className="text-[11px] text-slate-400">Lead-wise quotation history</span>}>{quotes.length ? <QuotesTable quotes={quotes} dealByQuote={dealByQuote} /> : <Empty>No quotations yet</Empty>}</Card>
      <Card title={`Deals (${deals.length})`} icon={<Handshake size={15} />}>{deals.length ? <DealsTable deals={deals} paid={paid} /> : <Empty>No deals yet</Empty>}</Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={`Orders (${orders.length})`} icon={<Package size={15} />}>{orders.length ? <OrdersTable orders={orders} onClick={(o) => nav(`/deals/${o.dealId}`)} /> : <Empty>No orders yet</Empty>}</Card>
        <Card title={`Payments (${payments.length})`} icon={<Receipt size={15} />}>{payments.length ? <PaymentsTable payments={payments} onClick={(p) => nav(`/deals/${p.dealId}`)} /> : <Empty>No payments yet</Empty>}</Card>
      </div>
    </>
  )
}

export function DealDetail() {
  const { id } = useParams()
  const { data, dealById, leadById, userName } = useFilters()
  const deal = id ? dealById.get(id) : undefined
  if (!deal) return <Card><Empty>Deal not found. <Link className="ml-1 text-blue-600" to="/deals">Back to deals</Link></Empty></Card>
  const lead = leadById.get(deal.leadId)!
  const quote = data.quotations.find((q) => q.id === deal.quotationId)
  const orders = data.orders.filter((o) => o.dealId === deal.id)
  const payments = data.payments.filter((p) => p.dealId === deal.id)
  const collected = sum(payments, (p) => p.amount)
  const total = deal.stage === 'Won' ? deal.value : 0
  const stagesT = sum(orders, (o) => o.stagesTotal)
  const prog = stagesT ? (sum(orders, (o) => o.stagesCompleted) / stagesT) * 100 : 0
  const steps = ['Quotation accepted', 'Deal won', 'Orders in execution', 'Delivered', 'Fully paid']
  const reached = [true, deal.stage === 'Won', orders.length > 0, orders.length > 0 && orders.every((o) => o.status === 'Completed'), total > 0 && collected >= total]

  return (
    <>
      <Back to="/deals" label="Back" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">{deal.service}</h2>
            <Badge>{deal.stage}</Badge><Badge>{deal.priority}</Badge>
            <span className="font-mono text-xs text-slate-400">{deal.id}</span>
          </div>
          <div className="mt-1 text-[13px] text-slate-500">
            {deal.category} · Lead <Link to={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">{lead.name} ({lead.company})</Link> · Quote {quote && <span className="font-mono text-xs">{quote.id} ({inr(quote.amount)})</span>} · Owner {userName(deal.ownerId)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Deal value" value={inr(deal.value)} sub={`Created ${fmtDate(deal.createdAt)}`} />
            <Stat label="Collected" value={inr(collected)} sub={`${payments.length} payments`} />
            <Stat label="Outstanding" value={inr(Math.max(0, total - collected))} sub={total ? pct(ratio(collected, total)) + ' collected' : 'Not won yet'} />
            <Stat label="Delivery" value={pct(prog, 0)} sub={`${orders.length} orders`} />
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-[11px] text-slate-500"><span>Collection</span><span>{inr(collected)} / {inr(total || deal.value)}</span></div>
            <Progress value={ratio(collected, total || deal.value)} color={C.green} />
          </div>
          <ol className="mt-5 grid grid-cols-5 gap-2">
            {steps.map((s, i) => (
              <li key={s} className="text-center">
                <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${reached[i] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                <div className={`mt-1 text-[11px] leading-tight ${reached[i] ? 'text-slate-700' : 'text-slate-400'}`}>{s}</div>
              </li>
            ))}
          </ol>
        </Card>
        <Timeline leadId={deal.leadId} dealId={deal.id} />
      </div>
      <Card title={`Orders (${orders.length})`} icon={<Package size={15} />}>{orders.length ? <OrdersTable orders={orders} /> : <Empty>No orders yet{deal.stage !== 'Won' ? ' (deal not won)' : ''}</Empty>}</Card>
      <Card title={`Payments (${payments.length})`} icon={<Wallet size={15} />}>{payments.length ? <PaymentsTable payments={payments} /> : <Empty>No payments received yet</Empty>}</Card>
    </>
  )
}
