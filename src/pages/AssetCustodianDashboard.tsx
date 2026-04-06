import { useMemo, useState } from 'react'
import { AssetAssignmentModal } from '../components/assets/AssetAssignmentModal'
import { AssetTable } from '../components/assets/AssetTable'
import { Badge } from '../components/ui/Badge'
import { assetSupportsIp, getAssetReadiness } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function AssetCustodianDashboard() {
  const {
    data,
    currentUser,
    getUserById,
    getUsersByRole,
    takeAssetAsCustodian,
    assignToEmployee,
    returnToWarehouse,
  } = useAppStore()
  const [employeeAssetId, setEmployeeAssetId] = useState<string | null>(null)

  if (!data || !currentUser) {
    return null
  }

  const queued = data.assets.filter(
    (asset) => asset.currentStage === 'ASSET_CUSTODIAN' && asset.currentAssigneeId === currentUser.id,
  )

  const stats = useMemo(() => {
    const ready = data.assets.filter(
      (asset) => getAssetReadiness(asset, data.assetTypes, data.agentStatuses) === 'READY',
    ).length
    const employeeAssigned = data.assets.filter((asset) => asset.currentStage === 'EMPLOYEE').length
    return { ready, employeeAssigned, activeQueue: queued.length }
  }, [data, queued.length])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Asset Custodian Dashboard</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Custody decisions and employee handoff</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Custodians can inspect the full fleet in read-only mode, take only READY assets, assign
          them to employees, or return them to the warehouse manager.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Ready fleet" value={stats.ready} />
          <StatCard label="Custodian queue" value={stats.activeQueue} />
          <StatCard label="With employees" value={stats.employeeAssigned} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Custodian Queue</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Assets assigned to me</h3>
          </div>
          <Badge tone="info">{queued.length} waiting</Badge>
        </div>
        <div className="mt-4">
          <AssetTable
            assets={queued}
            data={data}
            getUserById={getUserById}
            actions={(asset) => {
              const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

              return (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => takeAssetAsCustodian(asset.id)}
                    className="rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200"
                  >
                    Take asset
                  </button>
                  {readiness === 'READY' ? (
                    <button
                      type="button"
                      onClick={() => setEmployeeAssetId(asset.id)}
                      className="rounded-full border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      Assign to Employee
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => returnToWarehouse(asset.id)}
                    className="rounded-full border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-200"
                  >
                    Return to Warehouse
                  </button>
                </div>
              )
            }}
          />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Fleet Dashboard</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Read-only view of all assets</h3>
        <div className="mt-4">
          <AssetTable assets={data.assets} data={data} getUserById={getUserById} />
        </div>
      </section>

      <AssetAssignmentModal
        open={Boolean(employeeAssetId)}
        title="Assign asset to Employee"
        users={getUsersByRole('EMPLOYEE')}
        role="EMPLOYEE"
        showIpAddress={
          employeeAssetId
            ? assetSupportsIp(
                data.assets.find((asset) => asset.id === employeeAssetId)!,
                data.assetTypes,
              )
            : false
        }
        onClose={() => setEmployeeAssetId(null)}
        onConfirm={(userId, extras) => {
          if (!employeeAssetId) {
            return
          }

          assignToEmployee(employeeAssetId, userId, extras?.ipAddress)
          setEmployeeAssetId(null)
        }}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
