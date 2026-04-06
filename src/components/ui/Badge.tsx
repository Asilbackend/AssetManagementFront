export function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode
  tone?: 'slate' | 'ready' | 'pending' | 'danger' | 'info'
}) {
  const toneMap = {
    slate: 'border-white/10 bg-white/5 text-slate-200',
    ready: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300',
    pending: 'border-amber-400/25 bg-amber-500/15 text-amber-300',
    danger: 'border-rose-400/25 bg-rose-500/15 text-rose-300',
    info: 'border-cyan-400/25 bg-cyan-500/15 text-cyan-300',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase ${toneMap[tone]}`}
    >
      {children}
    </span>
  )
}
