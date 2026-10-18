import type { useFilters } from './filters'
import { toInputDate } from './format'

type F = ReturnType<typeof useFilters>

function download(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Exports the records behind the current page, respecting all active filters. */
export function exportCsv(path: string, f: F) {
  const tag = `${toInputDate(f.cur.start)}_to_${toInputDate(f.cur.end)}`
  const d = (x: Date) => x.toISOString()
  const s = f.current
  if (path.startsWith('/quotations')) {
    download(`quotations_${tag}.csv`, [['Quote ID', 'Lead ID', 'Service', 'Category', 'Amount (INR)', 'Status', 'Created', 'Owner'],
      ...s.quotations.map((q) => [q.id, q.leadId, q.service, q.category, q.amount, q.status, d(q.createdAt), f.userName(q.ownerId)])])
  } else if (path.startsWith('/deals')) {
    download(`deals_${tag}.csv`, [['Deal ID', 'Lead ID', 'Quote ID', 'Service', 'Category', 'Value (INR)', 'Priority', 'Stage', 'Created', 'Owner'],
      ...s.deals.map((x) => [x.id, x.leadId, x.quotationId, x.service, x.category, x.value, x.priority, x.stage, d(x.createdAt), f.userName(x.ownerId)])])
  } else if (path.startsWith('/orders')) {
    download(`payments_${tag}.csv`, [['Payment ID', 'Deal ID', 'Order ID', 'Lead ID', 'Amount (INR)', 'Mode', 'Type', 'Paid at'],
      ...s.payments.map((p) => [p.id, p.dealId, p.orderId, p.leadId, p.amount, p.mode, p.kind, d(p.paidAt)])])
  } else {
    download(`leads_${tag}.csv`, [['Lead ID', 'Name', 'Company', 'City', 'Source', 'Service', 'Status', 'Owner', 'Created'],
      ...s.leads.map((l) => [l.id, l.name, l.company, l.city, l.source, l.service, l.status, f.userName(l.ownerId), d(l.createdAt)])])
  }
}
