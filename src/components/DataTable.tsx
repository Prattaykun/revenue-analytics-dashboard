import clsx from 'clsx'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sort?: (row: T) => number | string
  align?: 'left' | 'right' | 'center'
  className?: string
}

export function DataTable<T>({ rows, columns, search, onRowClick, pageSize = 10, initialSort, toolbar, placeholder = 'Search…', rowKey, dense }: {
  rows: T[]
  columns: Column<T>[]
  search?: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  toolbar?: ReactNode
  placeholder?: string
  rowKey: (row: T) => string
  dense?: boolean
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = needle && search ? rows.filter((r) => search(r).toLowerCase().includes(needle)) : rows
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sort) {
        const f = col.sort
        out = [...out].sort((a, b) => {
          const x = f(a)
          const y = f(b)
          const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
          return sort.dir === 'asc' ? c : -c
        })
      }
    }
    return out
  }, [rows, q, sort, columns, search])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const p = Math.min(page, pages - 1)
  const view = filtered.slice(p * pageSize, (p + 1) * pageSize)

  const toggle = (key: string) => {
    setPage(0)
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  return (
    <div className="min-w-0">
      {(search || toolbar) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {search && (
            <label className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0) }}
                placeholder={placeholder}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}
          {toolbar}
          <span className="ml-auto text-xs text-slate-500">{filtered.length.toLocaleString('en-IN')} records</span>
        </div>
      )}
      <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-slate-50 text-[11.5px] uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={clsx('px-3 py-2.5 font-semibold', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}>
                  {c.sort ? (
                    <button type="button" onClick={() => toggle(c.key)} className={clsx('inline-flex items-center gap-1 uppercase hover:text-slate-800', sort?.key === c.key && 'text-blue-600')}>
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {view.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={clsx('transition', onRowClick && 'cursor-pointer hover:bg-blue-50/50')}>
                {columns.map((c) => (
                  <td key={c.key} className={clsx('px-3 whitespace-nowrap text-slate-700', dense ? 'py-2' : 'py-2.5', c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left', c.className)}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-400">No matching records</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Page {p + 1} of {pages}</span>
          <button type="button" aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={clsx('h-8 rounded-full border px-3 text-xs font-medium transition', active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700')}>
      {children}
    </button>
  )
}
