import clsx from 'clsx'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { delta as calcDelta, pct } from '../lib/format'
import { colorOf } from '../lib/colors'
import { useFilters } from '../lib/filters'

export function Card({ title, icon, action, children, className, bodyClass }: {
  title?: ReactNode; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string
}) {
  return (
    <section className={clsx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] animate-fade-up flex flex-col min-w-0', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 pt-4">
          <h3 className="flex items-center gap-2 whitespace-nowrap text-[13.5px] font-semibold text-slate-800">
            {icon && <span className="text-blue-600">{icon}</span>}
            {title}
          </h3>
          {action}
        </header>
      )}
      <div className={clsx('px-5 pb-5 pt-3 flex-1 min-w-0', bodyClass)}>{children}</div>
    </section>
  )
}

export function SectionTitle({ icon, children, sub }: { icon?: ReactNode; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        {icon && <span className="text-blue-600">{icon}</span>}
        {children}
      </h2>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  )
}

export function Delta({ cur, prev, invert = false, compact = false }: { cur: number; prev: number; invert?: boolean; compact?: boolean }) {
  const { compareLabel } = useFilters()
  const d = calcDelta(cur, prev)
  const up = d === null ? cur > 0 : d > 0
  const flat = d === 0
  const good = invert ? !up : up
  const cls = flat ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-rose-600'
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[11.5px] font-medium', cls)} title={`Previous period: ${prev.toLocaleString('en-IN')}`}>
      <Icon size={13} strokeWidth={2.4} />
      {d === null ? 'New' : `${d > 0 ? '+' : ''}${pct(d)}`}
      {!compact && <span className="font-normal text-slate-400">{compareLabel}</span>}
    </span>
  )
}

export function KpiCard({ label, value, cur, prev, icon, tone = 'blue', sub, invert, onClick, active }: {
  label: string; value: ReactNode; cur: number; prev: number; icon: ReactNode; tone?: keyof typeof TONES; sub?: ReactNode; invert?: boolean; onClick?: () => void; active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'group text-left rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition animate-fade-up min-w-0',
        onClick && 'hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 cursor-pointer',
        active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200/80',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={clsx('grid h-7 w-7 place-items-center rounded-lg', TONES[tone])}>{icon}</span>
        <span className="truncate text-[12.5px] font-medium text-slate-600">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</span>
        {sub && <span className="text-right text-[11px] leading-tight text-slate-500">{sub}</span>}
      </div>
      <div className="mt-2"><Delta cur={cur} prev={prev} invert={invert} /></div>
    </button>
  )
}

export const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  slate: 'bg-slate-100 text-slate-600',
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const c = color ?? colorOf(String(children))
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: c + '1a', color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {children}
    </span>
  )
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  const hue = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 360
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-white" style={{ background: `hsl(${hue} 65% 52%)` }}>
      {initials}
    </span>
  )
}

export function Progress({ value, color = '#2563eb', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  )
}

export function Empty({ children = 'No data for this period' }: { children?: ReactNode }) {
  return <div className="grid h-full min-h-[140px] place-items-center text-sm text-slate-400">{children}</div>
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}

export function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: ReadonlyArray<{ name?: string | number; value?: unknown; color?: string; payload?: { fill?: string } }>; label?: string | number; money?: boolean | string[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && label !== '' && <div className="mb-1 font-semibold text-slate-700">{label}</div>}
      {payload.map((p, i) => {
        const isMoney = money === true || (Array.isArray(money) && money.includes(String(p.name)))
        const v = Number(p.value ?? 0)
        return (
          <div key={i} className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
            <span>{p.name}</span>
            <span className="ml-auto pl-3 font-semibold text-slate-900 tabular-nums">{isMoney ? '₹' + Math.round(v).toLocaleString('en-IN') : v.toLocaleString('en-IN')}</span>
          </div>
        )
      })}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  )
}
