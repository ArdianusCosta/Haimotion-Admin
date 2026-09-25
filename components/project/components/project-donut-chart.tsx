import React from 'react'

export function ProjectDonutChart({ segments, total }: { segments: { pct: number; color: string }[]; total: number }) {
  const r = 42, cx = 60, cy = 60
  const C = 2 * Math.PI * r
  let cum = 0
  const validSegs = segments.filter(s => s.pct > 0)
  
  return (
    <div className="relative mx-auto flex size-[120px] items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth={20} />
        {validSegs.map((seg, i) => {
          const dashArr = `${seg.pct * C} ${C}`
          const dashOff = -(cum * C)
          cum += seg.pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={20}
              strokeDasharray={dashArr} strokeDashoffset={dashOff}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )
        })}
      </svg>
      <div className="relative flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold">{total}</span>
        <span className="text-[10px] text-muted-foreground">tasks</span>
      </div>
    </div>
  )
}
