import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheck, Clock, CreditCard, Package, PauseCircle, Wallet } from 'lucide-react'
import { Card, KpiCard } from '../components/ui'
import { Chip } from '../components/DataTable'
import { CollectionTrendCard, CompletedOrdersTrendCard, OrderStageProgressCard, OrderStatusCard, PaymentModeCard } from '../components/charts'
import { OrdersTable, PaymentsTable } from './Detail'
import { useFilters } from '../lib/filters'
import { inrShort, num } from '../lib/format'
import { orderKpis, sum } from '../lib/metrics'

export default function Orders() {
  const { current, previous } = useFilters()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const service = params.get('service') ?? ''
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const c = orderKpis(current.orders)
  const p = orderKpis(previous.orders)
  const coll = sum(current.payments, (x) => x.amount)
  const pcoll = sum(previous.payments, (x) => x.amount)
  const rows = current.orders.filter((o) => (!status || o.status === status) && (!service || o.service === service))

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Orders" icon={<Package size={15} />} value={num(c.total)} cur={c.total} prev={p.total} onClick={() => setParam('status', '')} active={!status} />
        <KpiCard label="Completed" tone="green" icon={<CircleCheck size={15} />} value={num(c.completed)} cur={c.completed} prev={p.completed} onClick={() => setParam('status', 'Completed')} active={status === 'Completed'} />
        <KpiCard label="In Progress" tone="blue" icon={<Clock size={15} />} value={num(c.inProgress + c.pending)} sub={<>{c.pending} not<br />started</>} cur={c.inProgress + c.pending} prev={p.inProgress + p.pending} onClick={() => setParam('status', 'In Progress')} active={status === 'In Progress'} />
        <KpiCard label="On Hold" tone="rose" icon={<PauseCircle size={15} />} value={num(c.onHold)} cur={c.onHold} prev={p.onHold} invert onClick={() => setParam('status', 'On Hold')} active={status === 'On Hold'} />
        <KpiCard label="Payments Received" tone="indigo" icon={<CreditCard size={15} />} value={num(current.payments.length)} cur={current.payments.length} prev={previous.payments.length} />
        <KpiCard label="Amount Collected" tone="green" icon={<Wallet size={15} />} value={inrShort(coll)} cur={coll} prev={pcoll} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OrderStatusCard />
        <OrderStageProgressCard />
        <PaymentModeCard />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CompletedOrdersTrendCard />
        <CollectionTrendCard />
      </div>
      <Card title="Orders" icon={<Package size={15} />} action={<span className="text-[11px] text-slate-400">Click an order to open its deal</span>}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['', 'Pending', 'In Progress', 'Completed', 'On Hold'].map((s) => <Chip key={s} active={status === s} onClick={() => setParam('status', s)}>{s || 'All'}</Chip>)}
          {service && <button type="button" onClick={() => setParam('service', '')} className="h-8 rounded-full bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100">{service} ✕</button>}
        </div>
        <OrdersTable orders={rows} onClick={(o) => nav(`/deals/${o.dealId}`)} />
      </Card>
      <Card title="Payment History" icon={<CreditCard size={15} />}>
        <PaymentsTable payments={current.payments} onClick={(x) => nav(`/deals/${x.dealId}`)} pageSize={10} />
      </Card>
    </>
  )
}
