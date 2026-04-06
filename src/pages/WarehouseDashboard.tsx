import { useMemo, useState } from 'react'
import { AssetAssignmentModal } from '../components/assets/AssetAssignmentModal'
import { AssetTable } from '../components/assets/AssetTable'
import { Badge } from '../components/ui/Badge'
import { assetSearchText, getAssetReadiness, getAssetType } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function WarehouseDashboard() {
  const { data, createAsset, assignFromWarehouse, getUserById, getUsersByRole } = useAppStore()
  const [search, setSearch] = useState('')
  const [readinessFilter, setReadinessFilter] = useState<'ALL' | 'READY' | 'NOT_READY'>('ALL')
  const [assetTypeName, setAssetTypeName] = useState('')
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
  const [assignRole, setAssignRole] = useState<'IT_SPECIALIST' | 'ASSET_CUSTODIAN' | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: '',
    serialNumber: '',
    vendor: '',
    location: '',
    procurementDate: new Date().toISOString().slice(0, 10),
    metadata: {} as Record<string, string>,
  })

  if (!data) {
    return null
  }

  const selectedType = data.assetTypes.find((type) => type.name === assetTypeName)

  const filteredAssets = data.assets.filter((asset) => {
    const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)
    const matchesSearch = assetSearchText(asset, data, getUserById(asset.currentAssigneeId)).includes(
      search.toLowerCase(),
    )
    const matchesReadiness = readinessFilter === 'ALL' || readiness === readinessFilter
    return matchesSearch && matchesReadiness
  })

  const summary = useMemo(() => {
    const total = data.assets.length
    const ready = data.assets.filter(
      (asset) => getAssetReadiness(asset, data.assetTypes, data.agentStatuses) === 'READY',
    ).length
    const warehouse = data.assets.filter((asset) => asset.currentStage === 'WAREHOUSE').length
    return { total, ready, warehouse }
  }, [data])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Warehouse Manager</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Asset intake and dispatch</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Create assets from predefined asset types, then hand them to IT for preparation or to
            the custodian only when the asset is already READY.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SummaryCard label="Total assets" value={summary.total} />
            <SummaryCard label="Ready assets" value={summary.ready} />
            <SummaryCard label="Warehouse queue" value={summary.warehouse} />
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Asset Types</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Allowed agent map</h3>
            </div>
            <select
              value={assetTypeName}
              onChange={(event) => {
                const next = event.target.value
                setAssetTypeName(next)
                setForm((current) => ({ ...current, type: next, metadata: {} }))
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select type</option>
              {data.assetTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {selectedType ? (
            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
              <p className="text-base font-semibold text-white">{selectedType.name}</p>
              <p className="mt-2 text-sm text-slate-400">{selectedType.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedType.allowedAgents.map((agent) => (
                  <Badge key={agent} tone="info">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.6rem] border border-dashed border-white/10 px-5 py-8 text-sm text-slate-400">
              Select an asset type to preview the enforced allowed-agent rule.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create Asset</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Dynamic intake form</h3>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              createAsset(form)
              setForm({
                name: '',
                type: '',
                serialNumber: '',
                vendor: '',
                location: '',
                procurementDate: new Date().toISOString().slice(0, 10),
                metadata: {},
              })
              setAssetTypeName('')
            }}
          >
            <Input
              label="Asset name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Asset type"
                value={form.type}
                onChange={(value) => {
                  setAssetTypeName(value)
                  setForm((current) => ({ ...current, type: value, metadata: {} }))
                }}
              >
                <option value="">Select type</option>
                {data.assetTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Serial number"
                value={form.serialNumber}
                onChange={(value) => setForm((current) => ({ ...current, serialNumber: value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Vendor"
                value={form.vendor}
                onChange={(value) => setForm((current) => ({ ...current, vendor: value }))}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(value) => setForm((current) => ({ ...current, location: value }))}
              />
            </div>
            <Input
              label="Procurement date"
              type="date"
              value={form.procurementDate}
              onChange={(value) => setForm((current) => ({ ...current, procurementDate: value }))}
            />
            {selectedType?.fields.map((field) =>
              field.type === 'select' ? (
                <Select
                  key={field.id}
                  label={field.label}
                  value={form.metadata[field.id] ?? ''}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      metadata: { ...current.metadata, [field.id]: value },
                    }))
                  }
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  key={field.id}
                  label={field.label}
                  type={field.type}
                  value={form.metadata[field.id] ?? ''}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      metadata: { ...current.metadata, [field.id]: value },
                    }))
                  }
                />
              ),
            )}
            <button
              type="submit"
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Create asset
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by tag, serial, type, assignee..."
              className="min-w-72 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            />
            <select
              value={readinessFilter}
              onChange={(event) =>
                setReadinessFilter(event.target.value as 'ALL' | 'READY' | 'NOT_READY')
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">All readiness</option>
              <option value="READY">READY</option>
              <option value="NOT_READY">NOT READY</option>
            </select>
          </div>
          <AssetTable
            assets={filteredAssets}
            data={data}
            getUserById={getUserById}
            actions={(asset) => {
              const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)
              const assetType = getAssetType(asset, data.assetTypes)

              return (
                <div className="space-y-2">
                  {asset.currentStage === 'WAREHOUSE' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAssetId(asset.id)
                        setAssignRole('IT_SPECIALIST')
                      }}
                      className="rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200"
                    >
                      Send to IT
                    </button>
                  ) : null}
                  {asset.currentStage === 'WAREHOUSE' && readiness === 'READY' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAssetId(asset.id)
                        setAssignRole('ASSET_CUSTODIAN')
                      }}
                      className="rounded-full border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      Send to Custodian
                    </button>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    Required agents: {assetType?.allowedAgents.join(', ') ?? 'None'}
                  </p>
                </div>
              )
            }}
          />
        </div>
      </section>

      <AssetAssignmentModal
        open={Boolean(activeAssetId && assignRole)}
        title={
          assignRole === 'IT_SPECIALIST'
            ? 'Assign asset to IT Specialist'
            : 'Assign asset to Asset Custodian'
        }
        users={assignRole ? getUsersByRole(assignRole) : []}
        role={assignRole ?? 'IT_SPECIALIST'}
        onClose={() => {
          setActiveAssetId(null)
          setAssignRole(null)
        }}
        onConfirm={(userId) => {
          if (!activeAssetId) {
            return
          }

          assignFromWarehouse(activeAssetId, userId)
          setActiveAssetId(null)
          setAssignRole(null)
        }}
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date'
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
      />
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
      >
        {children}
      </select>
    </div>
  )
}
