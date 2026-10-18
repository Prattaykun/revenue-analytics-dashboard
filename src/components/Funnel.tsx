import { num, pct } from '../lib/format'

export interface FunnelStage { label: string; value: number; color: string; onClick?: () => void }

/** SVG funnel (trapezoid stack) – each stage is clickable for drill-down. */
export function Funnel({ stages, side }: { stages: FunnelStage[]; side?: FunnelStage & { note?: string } }) {
  const top = stages[0]?.value || 1
  const h = 60
  const gap = 6
  const W = 260
  const minW = 70
  const widthFor = (i: number) => W - ((W - minW) * i) / Math.max(1, stages.length)
  return (
    <div className="flex items-center justify-center gap-4">
      <svg viewBox={`0 0 ${W} ${stages.length * (h + gap)}`} className="w-full max-w-[280px]" role="img" aria-label="Lead funnel">
        {stages.map((s, i) => {
          const w1 = widthFor(i)
          const w2 = widthFor(i + 1)
          const y = i * (h + gap)
          const x1 = (W - w1) / 2
          const x2 = (W - w2) / 2
          return (
            <g key={s.label} onClick={s.onClick} className={s.onClick ? 'cursor-pointer transition-opacity hover:opacity-85' : ''}>
              <title>{`${s.label}: ${num(s.value)}`}</title>
              <path d={`M${x1},${y} L${x1 + w1},${y} L${x2 + w2},${y + h} L${x2},${y + h} Z`} fill={s.color} />
              <text x={W / 2} y={y + h / 2 - 5} textAnchor="middle" className="fill-white" fontSize="12" fontWeight={600}>{s.label}</text>
              <text x={W / 2} y={y + h / 2 + 12} textAnchor="middle" className="fill-white" fontSize="17" fontWeight={800}>{num(s.value)}</text>
              <text x={W / 2} y={y + h / 2 + 24} textAnchor="middle" className="fill-white/80" fontSize="10">{pct((s.value / top) * 100)}</text>
            </g>
          )
        })}
      </svg>
      {side && (
        <button type="button" onClick={side.onClick} className="shrink-0 rounded-xl border-2 border-dashed px-3 py-2 text-center transition hover:bg-rose-50" style={{ borderColor: side.color + '88' }}>
          <div className="text-[11px] font-medium" style={{ color: side.color }}>{side.label}</div>
          <div className="text-lg font-bold" style={{ color: side.color }}>{num(side.value)}</div>
          <div className="text-[10px] text-slate-500">{side.note ?? pct((side.value / top) * 100)}</div>
        </button>
      )}
    </div>
  )
}
