import { getAllowedAgents, getAssetAgentStatuses, getAssetReadiness } from '../../domain/rules'
import type { AgentStatus, Asset, MockData } from '../../domain/types'
import { Badge } from '../ui/Badge'

const buttonStyles: Record<AgentStatus, string> = {
  PENDING: 'border-amber-400/30 text-amber-300',
  INSTALLED: 'border-emerald-400/30 text-emerald-300',
  FAILED: 'border-rose-400/30 text-rose-300',
}

export function AgentInstallPanel({
  asset,
  data,
  onUpdate,
}: {
  asset: Asset
  data: MockData
  onUpdate: (assetId: string, agent: MockData['agents'][number]['code'], status: AgentStatus) => void
}) {
  const statuses = getAssetAgentStatuses(asset.id, data.agentStatuses, data.assetTypes, asset)
  const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Agent Control</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{asset.assetTag}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Only agents allowed by the asset type can be installed here.
          </p>
        </div>
        <Badge tone={readiness === 'READY' ? 'ready' : 'pending'}>{readiness}</Badge>
      </div>
      <div className="mt-5 rounded-[1.4rem] border border-cyan-400/20 bg-cyan-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Recommended Install Plan
        </p>
        <p className="mt-2 text-sm text-slate-200">
          Asset type <span className="font-semibold text-white">{asset.type}</span> requires these
          agents:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {getAllowedAgents(asset, data.assetTypes).map((agent) => (
            <Badge key={`recommended-${agent}`} tone="info">
              Install {agent}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Suggestion is generated from the asset type to agent mapping in mock data.
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {getAllowedAgents(asset, data.assetTypes).map((agent) => {
          const record = statuses.find((status) => status.agent === agent)
          const currentStatus = record?.status ?? 'PENDING'

          return (
            <div key={agent} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{agent}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {data.agents.find((item) => item.code === agent)?.description}
                  </p>
                </div>
                <Badge
                  tone={
                    currentStatus === 'INSTALLED'
                      ? 'ready'
                      : currentStatus === 'FAILED'
                        ? 'danger'
                        : 'pending'
                  }
                >
                  {currentStatus}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['PENDING', 'INSTALLED', 'FAILED'] as AgentStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onUpdate(asset.id, agent, status)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${buttonStyles[status]} ${
                      currentStatus === status ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
