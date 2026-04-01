type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  rightSlot?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  rightSlot,
}: PageHeaderProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/85 p-6 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {rightSlot ? <div className="flex flex-wrap gap-3">{rightSlot}</div> : null}
      </div>
    </div>
  )
}
