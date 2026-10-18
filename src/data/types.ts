export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Unqualified'
export type LeadSource = 'Google Ads' | 'Website' | 'Referral' | 'Just Dial' | 'Social Media' | 'Other'
export type QuoteStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Expired'
export type DealStage = 'Negotiation' | 'Won' | 'Lost'
export type Priority = 'High' | 'Medium' | 'Low'
export type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold'
export type PaymentMode = 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque'

export interface User {
  id: string
  name: string
  team: 'Sales' | 'Operations'
}

export interface Service {
  name: string
  category: string
  min: number
  max: number
  stages: number
  days: number // typical turnaround
}

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  city: string
  source: LeadSource
  service: string
  category: string
  status: LeadStatus
  ownerId: string
  createdAt: Date
  qualifiedAt?: Date
  convertedAt?: Date
}

export interface Quotation {
  id: string
  leadId: string
  service: string
  category: string
  amount: number
  status: QuoteStatus
  createdAt: Date
  ownerId: string
}

export interface Deal {
  id: string
  leadId: string
  quotationId: string
  service: string
  category: string
  value: number
  priority: Priority
  stage: DealStage
  createdAt: Date
  ownerId: string
}

export interface Order {
  id: string
  dealId: string
  leadId: string
  service: string
  title: string
  category: string
  amount: number
  status: OrderStatus
  stagesTotal: number
  stagesCompleted: number
  assigneeId: string
  createdAt: Date
  dueAt: Date
  completedAt?: Date
}

export interface Payment {
  id: string
  dealId: string
  leadId: string
  orderId: string
  amount: number
  mode: PaymentMode
  kind: 'Advance' | 'Milestone' | 'Final' | 'Full payment'
  paidAt: Date
  ownerId: string
}

export interface Activity {
  id: string
  at: Date
  userId: string
  action: string
  record: string
  leadId: string
  dealId?: string
}

export interface Dataset {
  users: User[]
  services: Service[]
  leads: Lead[]
  quotations: Quotation[]
  deals: Deal[]
  orders: Order[]
  payments: Payment[]
  activities: Activity[]
  generatedAt: Date
}
