import type {
  Activity, Dataset, Deal, Lead, LeadSource, Order, Payment, PaymentMode, Priority, Quotation, Service, User,
} from './types'

/** Small deterministic PRNG so every visitor sees the same, internally consistent data. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const USERS: User[] = [
  { id: 'u1', name: 'Nancy Singh', team: 'Sales' },
  { id: 'u2', name: 'Sneha Choudhary', team: 'Sales' },
  { id: 'u3', name: 'Tannu Kumari', team: 'Sales' },
  { id: 'u4', name: 'Rohit Verma', team: 'Sales' },
  { id: 'u5', name: 'Ananya Das', team: 'Sales' },
  { id: 'u6', name: 'Gaurav Pant', team: 'Operations' },
  { id: 'u7', name: 'Srishti Upadhyay', team: 'Operations' },
  { id: 'u8', name: 'Azam Afaroz', team: 'Operations' },
  { id: 'u9', name: 'Harsh Mehta', team: 'Operations' },
]

export const SERVICES: Service[] = [
  { name: 'Private Limited Company', category: 'Company Registration', min: 7999, max: 18999, stages: 6, days: 14 },
  { name: 'LLP Registration', category: 'Company Registration', min: 5999, max: 12999, stages: 5, days: 12 },
  { name: 'DSC & DIN Services', category: 'Company Registration', min: 1499, max: 3999, stages: 3, days: 4 },
  { name: 'GST Registration', category: 'Tax & Compliance', min: 1499, max: 4999, stages: 4, days: 7 },
  { name: 'Annual Compliance', category: 'Tax & Compliance', min: 9999, max: 29999, stages: 6, days: 25 },
  { name: 'General Filing', category: 'Tax & Compliance', min: 999, max: 5999, stages: 3, days: 5 },
  { name: 'Penalty Resolution', category: 'Tax & Compliance', min: 2999, max: 9999, stages: 4, days: 10 },
  { name: 'Trademark', category: 'Intellectual Property', min: 4999, max: 11999, stages: 5, days: 20 },
  { name: 'FSSAI License', category: 'Licenses & Certifications', min: 2999, max: 8999, stages: 4, days: 12 },
  { name: 'ISO Certification', category: 'Licenses & Certifications', min: 6999, max: 19999, stages: 5, days: 18 },
  { name: 'Startup India Registration', category: 'Licenses & Certifications', min: 3999, max: 9999, stages: 4, days: 10 },
  { name: 'Website Development', category: 'Digital Services', min: 14999, max: 59999, stages: 6, days: 30 },
]
const SERVICE_WEIGHTS = [16, 9, 6, 11, 7, 8, 4, 9, 6, 5, 6, 5]

const SOURCES: LeadSource[] = ['Google Ads', 'Website', 'Referral', 'Just Dial', 'Social Media', 'Other']
const SOURCE_WEIGHTS = [34, 24, 13, 11, 12, 6]

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Kabir', 'Arjun', 'Riya', 'Priya', 'Sanya', 'Meera', 'Ananya', 'Rahul', 'Rohan', 'Sourav', 'Debjani', 'Arnab', 'Pooja', 'Neha', 'Karan', 'Vikram', 'Sneha', 'Tanvi', 'Aditi', 'Manish', 'Suresh', 'Farhan', 'Imran', 'Zoya', 'Harpreet', 'Gurpreet', 'Lakshmi', 'Kavya', 'Nikhil', 'Siddharth', 'Payal', 'Ritika', 'Abhishek', 'Deepak', 'Shreya', 'Ayesha']
const LAST = ['Sharma', 'Verma', 'Gupta', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Shah', 'Mehta', 'Khan', 'Singh', 'Das', 'Bose', 'Roy', 'Ghosh', 'Kapoor', 'Malhotra', 'Agarwal', 'Jain', 'Pillai', 'Rao', 'Saxena']
const BIZ_A = ['Nova', 'Bright', 'Green', 'Urban', 'Pixel', 'Prime', 'Blue', 'Swift', 'Lotus', 'Zen', 'Apex', 'Silver', 'Sun', 'Bharat', 'Vista', 'Orbit', 'Saffron', 'Indigo', 'Nimbus', 'Crest']
const BIZ_B = ['Tech', 'Foods', 'Logistics', 'Studios', 'Traders', 'Labs', 'Retail', 'Ventures', 'Solutions', 'Exports', 'Wellness', 'Infra', 'Media', 'Organics', 'Fintech']
const BIZ_C = ['Pvt Ltd', 'LLP', 'Enterprises', 'Co.', 'India', '']
const CITIES = ['Kolkata', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Noida', 'Gurugram']
const MODES: PaymentMode[] = ['UPI', 'Bank Transfer', 'Card', 'Cheque']
const MODE_WEIGHTS = [45, 35, 14, 6]

const DAY = 86_400_000
export const HISTORY_DAYS = 120

export function generateDataset(now: Date = new Date(), seed = 20261019): Dataset {
  const rnd = mulberry32(seed)
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
  const weighted = <T,>(arr: readonly T[], w: readonly number[]): T => {
    const total = w.reduce((s, x) => s + x, 0)
    let r = rnd() * total
    for (let i = 0; i < arr.length; i++) {
      r -= w[i]
      if (r <= 0) return arr[i]
    }
    return arr[arr.length - 1]
  }
  const between = (a: number, b: number) => a + rnd() * (b - a)
  const roundTo = (v: number, step: number) => Math.round(v / step) * step - 1 // e.g. 7999
  const nowMs = now.getTime()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const sales = USERS.filter((u) => u.team === 'Sales')
  const ops = USERS.filter((u) => u.team === 'Operations')
  const svcByName = new Map(SERVICES.map((s) => [s.name, s]))
  const price = (s: Service) => Math.max(s.min, roundTo(between(s.min, s.max), 500))
  // business hours offset inside a day, with the occasional late enquiry
  const workTime = () => (9 + rnd() * 10.5) * 3_600_000
  const later = (from: number, minDays: number, maxDays: number) => {
    const t = from + between(minDays, maxDays) * DAY
    const d = new Date(t)
    const h = d.getHours()
    if (h < 9) d.setHours(9 + Math.floor(rnd() * 3), Math.floor(rnd() * 60))
    else if (h > 20) {
      d.setDate(d.getDate() + 1)
      d.setHours(10 + Math.floor(rnd() * 6), Math.floor(rnd() * 60))
    }
    // never travel back before the preceding event
    return d.getTime() > from ? d.getTime() : from + between(0.01, 0.08) * DAY
  }

  const leads: Lead[] = []
  const quotations: Quotation[] = []
  const deals: Deal[] = []
  const orders: Order[] = []
  const payments: Payment[] = []
  const activities: Activity[] = []
  let leadSeq = 209001
  let quoteSeq = 10001
  let dealSeq = 801
  let orderSeq = 2001
  let paySeq = 1001
  let actSeq = 1
  const act = (at: number, userId: string, action: string, record: string, leadId: string, dealId?: string) => {
    if (at <= nowMs) activities.push({ id: `A${actSeq++}`, at: new Date(at), userId, action, record, leadId, dealId })
  }

  for (let d = HISTORY_DAYS; d >= 0; d--) {
    const dayStart = todayStart.getTime() - d * DAY
    const date = new Date(dayStart)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    // gentle growth trend + weekly seasonality + noise
    const growth = 1 + (HISTORY_DAYS - d) / HISTORY_DAYS * 0.45
    const base = (weekend ? 4.5 : 8) * growth
    const count = Math.max(1, Math.round(base + (rnd() - 0.5) * 5))
    for (let i = 0; i < count; i++) {
      let created = dayStart + workTime()
      if (d === 0) {
        // today's leads must already have happened
        const elapsed = nowMs - dayStart
        if (elapsed < 30 * 60_000) continue
        // keep today's enquiries inside business hours once the day has started
        const open = elapsed > 10 * 3_600_000 ? 9 * 3_600_000 : 0
        created = dayStart + open + rnd() * (elapsed - open - 60_000)
      }
      const service = svcByName.get(weighted(SERVICES.map((s) => s.name), SERVICE_WEIGHTS))!
      const source = weighted(SOURCES, SOURCE_WEIGHTS)
      const owner = pick(sales)
      const first = pick(FIRST)
      const last = pick(LAST)
      const company = `${pick(BIZ_A)} ${pick(BIZ_B)} ${pick(BIZ_C)}`.trim()
      const lead: Lead = {
        id: `L-${leadSeq++}`,
        name: `${first} ${last}`,
        company,
        email: `${first}.${last}`.toLowerCase() + '@' + company.split(' ')[0].toLowerCase() + 'mail.in',
        phone: `+91 ${Math.floor(between(70000, 99999))} ${Math.floor(between(10000, 99999))}`,
        city: pick(CITIES),
        source,
        service: service.name,
        category: service.category,
        status: 'New',
        ownerId: owner.id,
        createdAt: new Date(created),
      }
      leads.push(lead)
      act(created + 60_000 * between(2, 40), owner.id, 'Lead created', lead.id, lead.id)

      const ageDays = (nowMs - created) / DAY
      // Referral & website leads qualify more often
      const qualBoost = source === 'Referral' ? 0.18 : source === 'Website' ? 0.06 : source === 'Just Dial' ? -0.08 : 0
      const roll = rnd()
      if (ageDays < 0.06) {
        lead.status = roll < 0.6 ? 'New' : 'Contacted'
        continue
      }
      if (roll < 0.36 - qualBoost) {
        lead.status = 'Unqualified'
        act(later(created, 0.2, 3), owner.id, 'Lead disqualified', lead.id, lead.id)
        continue
      }
      if (roll < 0.46 - qualBoost && ageDays < 12) {
        lead.status = 'Contacted'
        continue
      }
      const qualifiedAt = later(created, 0.02, Math.max(0.03, Math.min(1.5, ageDays * 0.7)))
      if (qualifiedAt > nowMs) {
        lead.status = 'Contacted'
        continue
      }
      lead.status = 'Qualified'
      lead.qualifiedAt = new Date(qualifiedAt)
      act(qualifiedAt, owner.id, 'Lead qualified', lead.id, lead.id)

      // 1-3 quotations: the main service plus occasional add-ons / revisions
      const wantsDeal = rnd() < 0.55 + qualBoost
      const nQuotes = 1 + (rnd() < 0.4 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0)
      let t = qualifiedAt
      let won = false
      for (let q = 0; q < nQuotes; q++) {
        const qs = q === 0 ? service : svcByName.get(weighted(SERVICES.map((s) => s.name), SERVICE_WEIGHTS))!
        t = later(t, q === 0 ? 0.02 : 0.3, q === 0 ? 1 : 3)
        if (t > nowMs) break
        const quote: Quotation = {
          id: `Q-${quoteSeq++}`,
          leadId: lead.id,
          service: qs.name,
          category: qs.category,
          amount: price(qs),
          status: 'Pending',
          createdAt: new Date(t),
          ownerId: owner.id,
        }
        quotations.push(quote)
        act(t, owner.id, 'Quotation created', quote.id, lead.id)
        const decisionAt = later(t, 0.08, 2.5)
        const accept = wantsDeal && (q === 0 || rnd() < 0.45)
        if (decisionAt > nowMs) continue
        if (!accept) {
          const age = (nowMs - t) / DAY
          if (rnd() < 0.45) quote.status = 'Rejected'
          else if (age > 15) quote.status = 'Expired'
          continue
        }
        quote.status = 'Accepted'
        const priority: Priority = weighted(['High', 'Medium', 'Low'] as const, [30, 48, 22])
        const dealAt = decisionAt
        const stageRoll = rnd()
        const recent = (nowMs - dealAt) / DAY < 2.5
        const stage = recent && stageRoll < 0.25 ? 'Negotiation' : stageRoll < 0.08 ? 'Lost' : 'Won'
        const deal: Deal = {
          id: `D-${dealSeq++}`,
          leadId: lead.id,
          quotationId: quote.id,
          service: qs.name,
          category: qs.category,
          value: Math.round(quote.amount * between(0.9, 1)),
          priority,
          stage,
          createdAt: new Date(dealAt),
          ownerId: owner.id,
        }
        deals.push(deal)
        act(dealAt, owner.id, 'Deal created', deal.id, lead.id, deal.id)
        if (stage !== 'Won') continue
        won = true

        // orders: main delivery + sometimes a bundled government-fee / add-on order
        const split = rnd() < 0.3 && deal.value > 6000
        const parts = split ? [0.75, 0.25] : [1]
        let paidSoFar = 0
        const dealOrders: Order[] = []
        parts.forEach((share, idx) => {
          const oStart = later(dealAt, idx * 0.5, idx * 0.5 + 1.5)
          if (oStart > nowMs) return
          const svc = qs
          const totalStages = idx === 0 ? svc.stages : 2
          const expected = (idx === 0 ? svc.days : 4) * between(0.8, 1.5)
          const elapsed = (nowMs - oStart) / DAY
          let done = Math.min(totalStages, Math.floor((elapsed / expected) * totalStages))
          const assignee = pick(ops)
          let status: Order['status'] = done >= totalStages ? 'Completed' : done === 0 ? 'Pending' : 'In Progress'
          if (status !== 'Completed' && rnd() < 0.12) status = 'On Hold'
          if (status === 'On Hold') done = Math.max(1, Math.min(done, totalStages - 1))
          const order: Order = {
            id: `O-${orderSeq++}`,
            dealId: deal.id,
            leadId: lead.id,
            service: svc.name,
            title: idx === 0 ? 'Service delivery' : 'Govt. fee & filing',
            category: svc.category,
            amount: Math.round(deal.value * share),
            status,
            stagesTotal: totalStages,
            stagesCompleted: done,
            assigneeId: assignee.id,
            createdAt: new Date(oStart),
            dueAt: new Date(oStart + expected * DAY),
            completedAt: status === 'Completed' ? new Date(Math.min(nowMs - 3_600_000, oStart + expected * DAY)) : undefined,
          }
          orders.push(order)
          dealOrders.push(order)
          act(oStart, assignee.id, 'Order created', order.id, lead.id, deal.id)
          if (done > 0) act(Math.min(nowMs - 60_000, oStart + (expected * DAY * done) / totalStages), assignee.id, 'Stage completed', order.id, lead.id, deal.id)
          if (order.completedAt) act(order.completedAt.getTime(), assignee.id, 'Order completed', order.id, lead.id, deal.id)
        })

        // payments: advance, optional milestone, and final on completion
        const addPay = (at: number, amount: number, kind: Payment['kind'], orderId: string) => {
          if (at > nowMs || amount <= 0) return
          payments.push({
            id: `P-${paySeq++}`,
            dealId: deal.id,
            leadId: lead.id,
            orderId,
            amount,
            mode: weighted(MODES, MODE_WEIGHTS),
            kind,
            paidAt: new Date(at),
            ownerId: owner.id,
          })
          paidSoFar += amount
          act(at, owner.id, 'Payment recorded', `P-${paySeq - 1}`, lead.id, deal.id)
        }
        const main = dealOrders[0]
        if (!main) continue
        const advShare = pick([0.3, 0.5, 0.5, 0.6, 1])
        const advance = Math.round(deal.value * advShare)
        if (rnd() < 0.93) addPay(later(dealAt, 0, 1.2), advance, advShare === 1 ? 'Full payment' : 'Advance', main.id)
        if (advShare < 1 && paidSoFar > 0) {
          const progress = main.stagesCompleted / main.stagesTotal
          if (progress >= 0.5 && rnd() < 0.5 && advShare < 0.5) {
            addPay(later(main.createdAt.getTime(), 2, 6), Math.round(deal.value * 0.3), 'Milestone', main.id)
          }
          if (main.completedAt && rnd() < 0.82) {
            addPay(later(main.completedAt.getTime(), 0, 4), deal.value - paidSoFar, 'Final', dealOrders[dealOrders.length - 1].id)
          }
        }
      }
      if (won) {
        lead.status = 'Converted'
        const firstWon = deals.find((x) => x.leadId === lead.id && x.stage === 'Won')
        lead.convertedAt = firstWon?.createdAt
      }
    }
  }

  // re-number leads chronologically so IDs read naturally in tables
  leads.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const remap = new Map<string, string>()
  leads.forEach((l, i) => {
    const id = `L-${209001 + i}`
    remap.set(l.id, id)
    l.id = id
  })
  const fix = (id: string) => remap.get(id) ?? id
  for (const x of [...quotations, ...deals, ...orders, ...payments]) x.leadId = fix(x.leadId)
  for (const a of activities) {
    a.leadId = fix(a.leadId)
    a.record = fix(a.record)
  }
  activities.sort((a, b) => b.at.getTime() - a.at.getTime())
  return { users: USERS, services: SERVICES, leads, quotations, deals, orders, payments, activities, generatedAt: now }
}
