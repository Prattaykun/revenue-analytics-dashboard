export const C = {
  blue: '#2563eb',
  sky: '#38bdf8',
  green: '#10b981',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  slate: '#94a3b8',
  indigo: '#6366f1',
  orange: '#f97316',
}
export const PALETTE = [C.blue, C.green, C.amber, C.violet, C.cyan, C.rose, C.indigo, C.orange, C.sky, C.slate, '#14b8a6', '#a855f7']

export const STATUS_COLORS: Record<string, string> = {
  New: C.sky,
  Contacted: C.indigo,
  Qualified: C.green,
  Converted: C.amber,
  Unqualified: C.rose,
  Pending: C.amber,
  Accepted: C.green,
  Rejected: C.rose,
  Expired: C.slate,
  Negotiation: C.violet,
  Won: C.green,
  Lost: C.rose,
  'In Progress': C.blue,
  Completed: C.green,
  'On Hold': C.rose,
  High: C.rose,
  Medium: C.amber,
  Low: C.green,
}
export const colorOf = (k: string, i = 0) => STATUS_COLORS[k] ?? PALETTE[i % PALETTE.length]
