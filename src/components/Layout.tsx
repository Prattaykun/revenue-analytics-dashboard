import clsx from 'clsx'
import { BarChart3, CalendarDays, Download, FileText, Handshake, LayoutDashboard, Menu, Package, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useFilters, type Preset } from '../lib/filters'
import { exportCsv } from '../lib/export'
import { SERVICES } from '../data/generate'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/deals', label: 'Deals & Revenue', icon: Handshake },
  { to: '/orders', label: 'Orders & Payments', icon: Package },
]
const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom' },
]
const CATEGORIES = [...new Set(SERVICES.map((s) => s.category))]

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const f = useFilters()
  const sel = 'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"><BarChart3 size={18} /></span>
        <div className="leading-tight"><div className="text-[15px] font-extrabold text-slate-900">RevenueIQ</div><div className="text-[11px] text-slate-500">Business Analytics</div></div>
      </div>
      <div className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Dashboards</div>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setOpen(false)}
          className={({ isActive }) => clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition', isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
        <div className="text-[12px] font-semibold">Demo workspace</div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">Seeded dummy data · {f.data.leads.length.toLocaleString('en-IN')} leads, {f.data.deals.length} deals, {f.data.payments.length} payments over 120 days.</p>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button type="button" aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => setOpen(false)}><X size={18} /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button type="button" aria-label="Open menu" className="rounded-lg border border-slate-200 bg-white p-2 lg:hidden" onClick={() => setOpen(true)}><Menu size={18} /></button>
            <div className="mr-auto min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-[#0b1f4d] sm:text-xl">Business Performance &amp; Revenue Analytics</h1>
              <p className="text-[12px] text-slate-500">Track leads, conversions, quotations, deals, revenue and operations · <span className="font-medium text-slate-700">{f.rangeLabel}</span></p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Date range">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" onClick={() => f.set({ preset: p.id })} className={clsx('h-8 rounded-md px-2.5 text-[12.5px] font-medium transition', f.preset === p.id ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}>
                    {p.label}
                  </button>
                ))}
              </div>
              {f.preset === 'custom' && (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 h-9">
                  <CalendarDays size={15} className="text-slate-400" />
                  <input aria-label="From date" type="date" value={f.customFrom} min={f.minDate} max={f.customTo} onChange={(e) => e.target.value && f.set({ customFrom: e.target.value })} className="bg-transparent text-[12.5px] outline-none" />
                  <span className="text-slate-400">→</span>
                  <input aria-label="To date" type="date" value={f.customTo} min={f.customFrom} max={f.maxDate} onChange={(e) => e.target.value && f.set({ customTo: e.target.value })} className="bg-transparent text-[12.5px] outline-none" />
                </div>
              )}
              <select aria-label="Sales user" className={sel} value={f.ownerId} onChange={(e) => f.set({ ownerId: e.target.value })}>
                <option value="all">All Users</option>
                {f.data.users.filter((u) => u.team === 'Sales').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select aria-label="Service category" className={sel} value={f.category} onChange={(e) => f.set({ category: e.target.value })}>
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => exportCsv(loc.pathname, f)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[13px] font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700">
                <Download size={15} /> Export
              </button>
            </div>
          </div>
        </header>
        <main key={loc.pathname} className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-[1600px] px-6 pb-6 text-[11px] text-slate-400">Dummy data generated client-side. Built by Prattay Roy Chowdhury for SecureRegent.</footer>
      </div>
    </div>
  )
}
