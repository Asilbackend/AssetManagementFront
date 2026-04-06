import { useMemo, useState } from 'react'
import { AgentInstallPanel } from '../components/assets/AgentInstallPanel'
import { AssetAssignmentModal } from '../components/assets/AssetAssignmentModal'
import { AssetTable } from '../components/assets/AssetTable'
import { Badge } from '../components/ui/Badge'
import { getAllowedAgents, getAssetReadiness } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function ITSpecialistDashboard() {
  const { data, currentUser, getUserById, getUsersByRole, updateAgentStatus, forwardToCustodian } =
    useAppStore()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [handoffAssetId, setHandoffAssetId] = useState<string | null>(null)

  if (!data || !currentUser) {
    return null
  }

  const myAssets = data.assets.filter(
    (asset) => asset.currentStage === 'IT_SPECIALIST' && asset.currentAssigneeId === currentUser.id,
  )

  const selectedAsset = myAssets.find((asset) => asset.id === selectedAssetId) ?? myAssets[0] ?? null

  const totals = useMemo(() => {
    const ready = myAssets.filter(
      (asset) => getAssetReadiness(asset, data.assetTypes, data.agentStatuses) === 'READY',
    ).length
    const requiredAgents = myAssets.reduce(
      (sum, asset) => sum + getAllowedAgents(asset, data.assetTypes).length,
      0,
    )

    return { ready, requiredAgents }
  }, [data.agentStatuses, data.assetTypes, myAssets])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">IT Specialist Dashboard</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Preparation and agent readiness</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Only the security agents allowed by the asset type are shown here. An asset becomes READY
          only when every allowed agent reaches the INSTALLED state.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard label="Assigned to me" value={myAssets.length} />
          <MetricCard label="Ready to handoff" value={totals.ready} />
          <MetricCard label="Required agent tasks" value={totals.requiredAgents} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <AssetTable
            assets={myAssets}
            data={data}
            getUserById={getUserById}
            actions={(asset) => {
              const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

              return (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    Open agent panel
                  </button>
                  {readiness === 'READY' ? (
                    <button
                      type="button"
                      onClick={() => setHandoffAssetId(asset.id)}
                      className="rounded-full border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      Forward to Custodian
                    </button>
                  ) : null}
                </div>
              )
            }}
          />
        </div>
        <div className="space-y-4">
          {selectedAsset ? (
            <>
              <AgentInstallPanel asset={selectedAsset} data={data} onUpdate={updateAgentStatus} />
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Required Agents</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {getAllowedAgents(selectedAsset, data.assetTypes).map((agent) => (
                    <Badge key={agent} tone="info">
                      {agent}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Failed or missing agents keep the asset in NOT READY state until resolved.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-white/10 px-6 py-12 text-sm text-slate-400">
              No assets are currently assigned to this IT specialist.
            </div>
          )}
        </div>
      </section>

      <AssetAssignmentModal
        open={Boolean(handoffAssetId)}
        title="Forward READY asset to Asset Custodian"
        users={getUsersByRole('ASSET_CUSTODIAN')}
        role="ASSET_CUSTODIAN"
        onClose={() => setHandoffAssetId(null)}
        onConfirm={(userId) => {
          if (!handoffAssetId) {
            return
          }

          forwardToCustodian(handoffAssetId, userId)
          setHandoffAssetId(null)
        }}
      />
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
