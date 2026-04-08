import { useEffect, useMemo, useState } from 'react'
import { getAssetReadiness, readinessLabel, roleLabel, workflowStageLabel } from '../../domain/rules'
import type { Asset, MockData, User } from '../../domain/types'
import { Badge } from '../ui/Badge'
import { Pagination } from '../ui/Pagination'

export function AssetTable({
  assets,
  data,
  getUserById,
  actions,
}: {
  assets: Asset[]
  data: MockData
  getUserById: (userId: string | null) => User | null
  actions?: (asset: Asset) => React.ReactNode
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const totalPages = Math.max(1, Math.ceil(assets.length / pageSize))
  const paginatedAssets = useMemo(
    () => assets.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [assets, currentPage],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [assets.length])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/50">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="px-4 py-3 text-left font-medium">Turi</th>
              <th className="px-4 py-3 text-left font-medium">Bosqich</th>
              <th className="px-4 py-3 text-left font-medium">Tayyorlik</th>
              <th className="px-4 py-3 text-left font-medium">Biriktirilgan</th>
              <th className="px-4 py-3 text-left font-medium">Joylashuv</th>
              <th className="px-4 py-3 text-left font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {paginatedAssets.map((asset) => {
              const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)
              const assignee = getUserById(asset.currentAssigneeId)

              return (
                <tr key={asset.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{asset.assetTag}</p>
                    <p className="mt-1 text-xs text-slate-400">{asset.name}</p>
                    <p className="mt-2 text-xs text-slate-500">{asset.serialNumber}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{asset.type}</p>
                    <p className="mt-1 text-xs text-slate-500">{asset.vendor}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone="info">{workflowStageLabel(asset.currentStage)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={readiness === 'READY' ? 'ready' : 'pending'}>{readinessLabel(readiness)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <p>{assignee?.fullName ?? 'Biriktirilmagan'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {assignee?.role ? roleLabel(assignee.role) : 'Egasi yo‘q'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{asset.location}</td>
                  <td className="px-4 py-4">{actions ? actions(asset) : null}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
