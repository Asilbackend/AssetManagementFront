import { useMemo, useState } from 'react'
import { AssetAssignmentModal } from '../components/assets/AssetAssignmentModal'
import { AssetTable } from '../components/assets/AssetTable'
import { Badge } from '../components/ui/Badge'
import { assetSupportsIp, getAssetReadiness } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

type RequestDraftItem = {
  id: string
  name: string
  quantity: number
  specs: string
  expectedPrice: number
}

function createEmptyItem(): RequestDraftItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    quantity: 1,
    specs: '',
    expectedPrice: 0,
  }
}

export function AssetCustodianDashboard() {
  const {
    data,
    currentUser,
    getUserById,
    getUsersByRole,
    takeAssetAsCustodian,
    assignToEmployee,
    returnToWarehouse,
    createRequest,
  } = useAppStore()
  const [employeeAssetId, setEmployeeAssetId] = useState<string | null>(null)
  const [requestTitle, setRequestTitle] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<RequestDraftItem[]>([createEmptyItem()])

  if (!data || !currentUser) {
    return null
  }

  const queued = data.assets.filter(
    (asset) => asset.currentStage === 'ASSET_CUSTODIAN' && asset.currentAssigneeId === currentUser.id,
  )
  const myRequests = (data.requests ?? []).filter((request) => request.createdBy === currentUser.id)

  const stats = useMemo(() => {
    const ready = data.assets.filter(
      (asset) => getAssetReadiness(asset, data.assetTypes, data.agentStatuses) === 'READY',
    ).length
    const employeeAssigned = data.assets.filter((asset) => asset.currentStage === 'EMPLOYEE').length
    const approvedRequests = myRequests.filter((request) => request.status === 'APPROVED').length
    return { ready, employeeAssigned, activeQueue: queued.length, approvedRequests }
  }, [data, myRequests, queued.length])

  const resetRequestForm = () => {
    setRequestTitle('')
    setFileUrl('')
    setNote('')
    setItems([createEmptyItem()])
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Manager Workspace</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Request, custody, and employee handoff</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Manager request yaratadi, tayyor assetni qabul qiladi va employee ga tarqatadi. Request
          owner bo'lgan manager keyin shu assetning asosiy custodian egasi bo'ladi.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Ready fleet" value={stats.ready} />
          <StatCard label="Manager queue" value={stats.activeQueue} />
          <StatCard label="Approved requests" value={stats.approvedRequests} />
          <StatCard label="With employees" value={stats.employeeAssigned} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            createRequest({
              title: requestTitle,
              fileUrl,
              note,
              items: items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                specs: item.specs,
                expectedPrice: item.expectedPrice,
              })),
            })
            resetRequestForm()
          }}
          className="space-y-4 rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Request Create</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Procurement zayavkasi</h3>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Request title *</span>
            <input
              value={requestTitle}
              onChange={(event) => setRequestTitle(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              placeholder="Masalan: Finance team laptop refresh"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Word/PDF file URL</span>
            <input
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              placeholder="https://... yoki /docs/request.docx"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Note</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              placeholder="Vendor, urgency, budget context..."
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Items</p>
              <button
                type="button"
                onClick={() => setItems((current) => [...current, createEmptyItem()])}
                className="rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200"
              >
                Add item
              </button>
            </div>
            {items.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-200">Item #{index + 1}</p>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                      className="text-xs text-rose-300"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  value={item.name}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)),
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Asset nomi"
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) } : entry,
                        ),
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Soni"
                    required
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.expectedPrice}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, expectedPrice: Math.max(0, Number(event.target.value) || 0) }
                            : entry,
                        ),
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Expected price"
                    required
                  />
                </div>
                <textarea
                  rows={3}
                  value={item.specs}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, specs: event.target.value } : entry)),
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Specs / xarakteristika"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Create request
          </button>
        </form>

        <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">My Requests</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Procurement lifecycle</h3>
            </div>
            <Badge tone="info">{myRequests.length} total</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {myRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                Hali request yaratilmagan.
              </div>
            ) : (
              myRequests.map((request) => (
                <article key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{request.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{request.id}</p>
                    </div>
                    <Badge tone={request.status === 'APPROVED' ? 'ready' : request.status === 'PURCHASED' ? 'info' : 'pending'}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {request.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span>
                            {item.fulfilledQuantity ?? 0}/{item.quantity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.specs || 'Specs kiritilmagan'}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
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
