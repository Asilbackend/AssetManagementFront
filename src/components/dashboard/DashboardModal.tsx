import type { PropsWithChildren } from 'react'

type DashboardModalProps = PropsWithChildren<{
  title: string
  description: string
  onClose: () => void
  onBack?: () => void
}>

export function DashboardModal({
  title,
  description,
  onClose,
  onBack,
  children,
}: DashboardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/20 bg-[#fbfaf7] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
                >
                  Orqaga
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
              >
                Yopish
              </button>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="max-w-3xl text-sm text-slate-500">{description}</p>
          </div>
        </div>

        <div className="max-h-[calc(92vh-120px)] overflow-auto p-6">{children}</div>
      </div>
    </div>
  )
}
