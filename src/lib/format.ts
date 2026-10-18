const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const numFmt = new Intl.NumberFormat('en-IN')

export const inr = (v: number) => inrFmt.format(Math.round(v))
export const num = (v: number) => numFmt.format(Math.round(v))

/** Compact Indian notation: ₹1.2K, ₹3.4L, ₹1.1Cr */
export function inrShort(v: number) {
  const a = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)}Cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)}L`
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(1)}K`
  return `${sign}₹${Math.round(a)}`
}

export const pct = (v: number, digits = 1) => `${(Number.isFinite(v) ? v : 0).toFixed(digits)}%`
export const ratio = (a: number, b: number) => (b ? (a / b) * 100 : 0)

export function delta(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null
  return ((cur - prev) / prev) * 100
}

const dFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const dShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dtFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
export const fmtDate = (d: Date) => dFmt.format(d)
export const fmtShort = (d: Date) => dShort.format(d)
export const fmtDateTime = (d: Date) => dtFmt.format(d)

export function toInputDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function fromInputDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function timeAgo(d: Date, now = new Date()) {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
