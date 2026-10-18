import { CircleCheck, FileText, Handshake, IndianRupee, Percent, UserCheck, UserPlus, UserX, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { KpiCard, SectionTitle } from '../components/ui'
import {
  CrmActivityCard, DailyRevenueCard, DealsVsRevenueCard, LeadFunnelCard, LeadSourcesCard, LeadTrendCard, OpsTeamCard, OrderStageProgressCard,
  PriorityCard, QuoteConversionCard, QuoteStatusCard, DealProgressCard, OrderStatusCard, QuoteValueByServiceCard, QuotesByServiceCard, RevenueByCategoryCard, SalesTeamCard, ServiceQuoteTable, TargetCard, TotalVsCollectedCard, qs,
} from '../components/charts'
import { useFilters } from '../lib/filters'
import { dealKpis, leadKpis, quoteKpis } from '../lib/metrics'
import { inrShort, num, pct } from '../lib/format'

export function LeadKpiRow({ extra = true }: { extra?: boolean }) {
  const { current, previous, scope } = useFilters()
  const nav = useNavigate()
  const c = leadKpis(current)
  const p = leadKpis(previous)
  const qc = quoteKpis(current)
  const qp = quoteKpis(previous)
  const dc = dealKpis(current, scope.payments)
  const dp = dealKpis(previous, scope.payments)
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${extra ? 'lg:grid-cols-4 min-[1800px]:grid-cols-8' : 'lg:grid-cols-5'}`}>
      <KpiCard label="Total Leads" icon={<UserPlus size={15} />} value={num(c.total)} cur={c.total} prev={p.total} onClick={() => nav('/leads')} />
      <KpiCard label="Qualified Leads" tone="green" icon={<UserCheck size={15} />} value={num(c.qualified)} sub={<><b className="text-slate-700">{pct(c.total ? (c.qualified / c.total) * 100 : 0)}</b><br />qualified</>} cur={c.qualified} prev={p.qualified} onClick={() => nav('/leads' + qs({ status: 'Qualified+' }))} />
      <KpiCard label="Converted Leads" tone="violet" icon={<CircleCheck size={15} />} value={num(c.converted)} sub={<><b className="text-slate-700">{pct(c.convRate)}</b><br />of leads</>} cur={c.converted} prev={p.converted} onClick={() => nav('/leads' + qs({ status: 'Converted' }))} />
      <KpiCard label="Unqualified Leads" tone="rose" icon={<UserX size={15} />} value={num(c.unqualified)} sub={<><b className="text-slate-700">{pct(c.total ? (c.unqualified / c.total) * 100 : 0)}</b><br />unqualified</>} cur={c.unqualified} prev={p.unqualified} invert onClick={() => nav('/leads' + qs({ status: 'Unqualified' }))} />
      <KpiCard label="Conversion Rate" tone="cyan" icon={<Percent size={15} />} value={pct(c.convRate)} cur={c.convRate} prev={p.convRate} />
      {extra && <>
        <KpiCard label="Quotations Created" tone="indigo" icon={<FileText size={15} />} value={num(qc.count)} cur={qc.count} prev={qp.count} onClick={() => nav('/quotations')} />
        <KpiCard label="Deals Won" tone="amber" icon={<Handshake size={15} />} value={num(dc.won)} sub={<>{num(dc.deals)}<br />created</>} cur={dc.won} prev={dp.won} onClick={() => nav('/deals' + qs({ stage: 'Won' }))} />
        <KpiCard label="Revenue Collected" tone="green" icon={<IndianRupee size={15} />} value={inrShort(dc.collected)} cur={dc.collected} prev={dp.collected} onClick={() => nav('/orders')} />
      </>}
    </div>
  )
}

export default function Overview() {
  return (
    <>
      <LeadKpiRow />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TargetCard />
        <LeadFunnelCard />
        <LeadTrendCard height={190} />
        <LeadSourcesCard />
      </div>

      <SectionTitle icon={<FileText size={16} />} sub="Click a bar or row to drill into quotations">Quotation Analytics</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-5"><QuotesByServiceCard /></div>
        <div className="xl:col-span-4"><QuoteValueByServiceCard /></div>
        <div className="md:col-span-2 xl:col-span-3"><QuoteConversionCard /></div>
        <div className="md:col-span-2 xl:col-span-8"><ServiceQuoteTable pageSize={5} /></div>
        <div className="md:col-span-2 xl:col-span-4"><QuoteStatusCard /></div>
      </div>

      <SectionTitle icon={<IndianRupee size={16} />} sub="Revenue = value of won deals in period · Collected = payments received">Deals &amp; Revenue</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-5"><DealsVsRevenueCard /></div>
        <div className="xl:col-span-4"><RevenueByCategoryCard /></div>
        <div className="xl:col-span-3"><PriorityCard /></div>
        <div className="md:col-span-2 xl:col-span-6"><DailyRevenueCard height={230} /></div>
        <div className="xl:col-span-3"><TotalVsCollectedCard /></div>
        <div className="xl:col-span-3"><DealProgressCard /></div>
      </div>

      <SectionTitle icon={<Package size={16} />}>Team, Orders &amp; CRM Activity</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7"><SalesTeamCard /></div>
        <div className="xl:col-span-5"><OpsTeamCard /></div>
        <div className="xl:col-span-4"><OrderStatusCard /></div>
        <div className="xl:col-span-4"><OrderStageProgressCard /></div>
        <div className="xl:col-span-4"><CrmActivityCard limit={8} /></div>
      </div>
    </>
  )
}
