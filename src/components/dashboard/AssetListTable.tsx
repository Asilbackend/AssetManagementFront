import { Link } from 'react-router-dom'
import type { AssetRecord } from '../../types'
import { statusLabels, statusTone } from '../../utils/asset'
import { useAppStore } from '../../store/AppStore'

type AssetListTableProps = {
  assets: AssetRecord[]
  selectedAssetId?: string
  onSelect?: (assetId: string) => void
  onViewDetails?: (assetId: string) => void
}

export function AssetListTable({
  assets,
  selectedAssetId,
  onSelect,
  onViewDetails,
}: AssetListTableProps) {
  const { currentUser } = useAppStore()
  const canEdit = currentUser?.role === 'WAREHOUSE_MANAGER'

  if (assets.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Ushbu filter bo'yicha asset topilmadi.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.24em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Asset code</th>
              <th className="px-5 py-4">Nomi</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Department</th>
              <th className="px-5 py-4">Sana</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className={[
                  'border-t border-slate-100 transition hover:bg-amber-50/70',
                  selectedAssetId === asset.id ? 'bg-amber-50/80' : 'bg-white',
                ].join(' ')}
                onClick={() => onSelect?.(asset.id)}
              >
                <td className="px-5 py-4 font-semibold text-slate-900">{asset.assetCode}</td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{asset.name}</p>
                    <p className="text-sm text-slate-500">{asset.assetTypeName}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(asset.status)}`}
                  >
                    {statusLabels[asset.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {asset.departmentName ?? 'Ombor'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{asset.purchaseDate}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onViewDetails?.(asset.id)
                      }}
                      className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-700"
                    >
                      Details
                    </button>
                    {canEdit ? (
                      <Link
                        to={`/assets/${asset.id}/edit`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
