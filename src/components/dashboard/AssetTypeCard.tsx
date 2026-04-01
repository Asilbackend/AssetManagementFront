import type { AssetTypeDefinition } from '../../types'

type AssetTypeCardProps = {
  assetType: AssetTypeDefinition
  assetCount: number
  active: boolean
  onClick: () => void
}

export function AssetTypeCard({
  assetType,
  assetCount,
  active,
  onClick,
}: AssetTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-5 text-left shadow-[var(--shadow-card)] transition',
        active
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-amber-200',
      ].join(' ')}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{assetType.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{assetType.description}</p>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
            {assetCount}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Shu typedagi assetlar soni
        </p>
      </div>
    </button>
  )
}
