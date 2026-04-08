import { useEffect, useMemo, useState } from 'react'
import { AssetDetailCard } from '../components/assets/AssetDetailCard'
import { PageHeader } from '../components/layout/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { SearchSelect } from '../components/ui/SearchSelect'
import { getAssetAgentStatuses, getAssetReadiness, getAssetType } from '../domain/rules'
import type { Asset, MockData, User } from '../domain/types'
import { useAppStore } from '../store/AppStore'
import type { AssetRecord, CategoryType } from '../types'
import { statusTone } from '../utils/asset'

const today = new Date().toISOString().slice(0, 10)

export function AssignAssetPage() {
  const { data, getUsersByRole, getUserById, assignAssetsFromWarehouse } = useAppStore()
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [previewAssetId, setPreviewAssetId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [targetRole, setTargetRole] = useState<'IT_SPECIALIST' | 'ASSET_CUSTODIAN'>('IT_SPECIALIST')
  const [form, setForm] = useState({
    departmentId: '',
    date: today,
    employee: '',
    note: '',
    returnDate: '',
  })

  const assignableUsers = getUsersByRole(targetRole)
  const departments = data?.departments ?? []

  const assignableAssets = useMemo(() => {
    if (!data) {
      return []
    }

    const normalizedSearch = search.trim().toLowerCase()

    return data.assets.filter((asset) => {
      if (asset.currentStage !== 'WAREHOUSE') {
        return false
      }

      if (
        targetRole === 'ASSET_CUSTODIAN' &&
        getAssetReadiness(asset, data.assetTypes, data.agentStatuses) !== 'READY'
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [asset.assetTag, asset.name, asset.type, asset.serialNumber, asset.location]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [data, search, targetRole])

  const previewAsset =
    assignableAssets.find((asset) => asset.id === previewAssetId) ??
    assignableAssets.find((asset) => selectedAssetIds.includes(asset.id)) ??
    assignableAssets[0]

  const previewRecord = useMemo(() => {
    if (!data || !previewAsset) {
      return undefined
    }

    return toAssetRecord(previewAsset, data, getUserById)
  }, [data, getUserById, previewAsset])

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(assignableAssets.length / pageSize))
  const paginatedAssets = assignableAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, targetRole])

  useEffect(() => {
    setSelectedAssetIds((current) =>
      current.filter((assetId) => assignableAssets.some((asset) => asset.id === assetId)),
    )
  }, [assignableAssets])

  useEffect(() => {
    setForm((current) => ({ ...current, employee: '' }))
  }, [targetRole])

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId],
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedAssetIds.length === 0 || !form.employee) {
      return
    }

    assignAssetsFromWarehouse(selectedAssetIds, form.employee, {
      departmentId: form.departmentId || undefined,
      effectiveDate: form.date,
      note: form.note,
      returnDate: form.returnDate || undefined,
    })

    setSelectedAssetIds([])
    setPreviewAssetId('')
    setForm({
      departmentId: '',
      date: today,
      employee: '',
      note: '',
      returnDate: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset assign"
        title="Assetni IT yoki custodianga biriktirish"
        description="Jarayon endi bosqichma-bosqich ishlaydi: warehouse manager avval assetni IT specialistga yuboradi. Faqat IT tayyorlab, asset READY holatga kelgandan keyingina warehouse manager uni custodianga topshira oladi."
        rightSlot={
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Tanlangan assetlar: {selectedAssetIds.length}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                Available assets
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {targetRole === 'IT_SPECIALIST'
                  ? "IT specialistga yuborilishi mumkin bo'lgan assetlar"
                  : "Custodianga yuborilishi mumkin bo'lgan tayyor assetlar"}
              </h3>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Code, nomi yoki type bo'yicha qidirish"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100 lg:max-w-sm"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {paginatedAssets.map((asset) => {
              const selected = selectedAssetIds.includes(asset.id)

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    toggleAsset(asset.id)
                    setPreviewAssetId(asset.id)
                  }}
                  className={[
                    'rounded-3xl border p-4 text-left transition',
                    selected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 bg-slate-50 hover:border-amber-200 hover:bg-white',
                  ].join(' ')}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{asset.name}</p>
                        <p className="text-sm text-slate-500">{asset.type}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          targetRole === 'ASSET_CUSTODIAN' && data
                            ? getAssetReadiness(asset, data.assetTypes, data.agentStatuses) === 'READY'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                            : statusTone('available')
                        }`}
                      >
                        {targetRole === 'ASSET_CUSTODIAN' && data
                          ? getAssetReadiness(asset, data.assetTypes, data.agentStatuses)
                          : 'Omborda'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{asset.assetTag}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            variant="light"
          />
        </section>

        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                Biriktirish ma'lumotlari
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Workflow handoff formasi
              </h3>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Biriktirish bosqichi *</span>
              <select
                value={targetRole}
                onChange={(event) =>
                  setTargetRole(event.target.value as 'IT_SPECIALIST' | 'ASSET_CUSTODIAN')
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              >
                <option value="IT_SPECIALIST">IT Specialist</option>
                <option value="ASSET_CUSTODIAN">Asset Custodian</option>
              </select>
              <span className="text-xs text-slate-500">
                Custodianga yuborish faqat READY assetlar uchun ruxsat etiladi.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Department *</span>
              <select
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, departmentId: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                required
              >
                <option value="">Tanlang</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Berilgan sana *</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                required
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                {targetRole === 'IT_SPECIALIST' ? 'IT Specialist *' : 'Asset Custodian *'}
              </span>
              <div className="rounded-[24px] border border-slate-200 p-3">
                <SearchSelect
                  label={targetRole === 'IT_SPECIALIST' ? 'IT user search' : 'Custodian user search'}
                  options={assignableUsers.map((user) => ({
                    label: `${user.fullName} - ${user.team}`,
                    value: user.id,
                  }))}
                  value={form.employee}
                  placeholder={targetRole === 'IT_SPECIALIST' ? 'it specialist' : 'asset custodian'}
                  onChange={(value) => setForm((current) => ({ ...current, employee: value }))}
                  variant="light"
                />
              </div>
              <span className="text-xs text-slate-500">
                {targetRole === 'IT_SPECIALIST'
                  ? "F.I.Sh qo'lda yozilmaydi, role=`IT_SPECIALIST` userlardan tanlanadi."
                  : "F.I.Sh qo'lda yozilmaydi, role=`ASSET_CUSTODIAN` userlardan tanlanadi."}
              </span>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Izoh</span>
              <textarea
                rows={4}
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Masalan: 3-qavat branch ofisga berildi"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                Qaytarib berilgan sana
              </span>
              <input
                type="date"
                value={form.returnDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, returnDate: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
              <span className="text-xs text-slate-500">
                Ixtiyoriy. Asset qaytarilganda shu maydonni to'ldirish mumkin.
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              {targetRole === 'IT_SPECIALIST'
                ? "Tanlangan assetlarni IT specialistga yuborish"
                : "Tanlangan assetlarni custodianga biriktirish"}
            </button>
          </form>

          <AssetDetailCard asset={previewRecord} />
        </div>
      </div>
    </div>
  )
}

function toAssetRecord(
  asset: Asset,
  data: MockData,
  getUserById: (userId: string | null) => User | null,
): AssetRecord {
  const assetType = getAssetType(asset, data.assetTypes)
  const latestAssignment = data.assignments.find((item) => item.assetId === asset.id)
  const assignee = getUserById(asset.currentAssigneeId)
  const categoryType = mapCategoryType(assetType?.category)
  const departmentName =
    latestAssignment?.departmentName ??
    asset.metadata.department ??
    (asset.currentStage === 'WAREHOUSE' ? undefined : assignee?.team)
  const securityStatuses = getAssetAgentStatuses(
    asset.id,
    data.agentStatuses,
    data.assetTypes,
    asset,
  )

  return {
    id: asset.id,
    assetCode: asset.assetTag,
    name: asset.name,
    categoryType,
    categoryId: assetType?.id ?? asset.type.toLowerCase(),
    categoryName: assetType?.category ?? 'Uncategorized',
    assetTypeId: assetType?.id ?? asset.type.toLowerCase(),
    assetTypeName: asset.type,
    status: asset.currentStage === 'WAREHOUSE' ? 'available' : 'assigned',
    purchasePrice: asset.actualPrice ?? asset.expectedPrice ?? 0,
    expectedPrice: asset.expectedPrice,
    actualPrice: asset.actualPrice,
    requestId: asset.requestId,
    purchaseDate: asset.procurementDate,
    warrantyDate: addYears(asset.procurementDate, 3),
    departmentId: latestAssignment?.departmentId,
    departmentName,
    returnDate: latestAssignment?.returnDate,
    attributes: asset.metadata,
    securityStatuses,
    history: data.assignments
      .filter((item) => item.assetId === asset.id)
      .map((item) => ({
        id: item.id,
        action: item.action === 'CREATED' ? 'created' : 'assigned',
        date: item.effectiveDate ?? item.createdAt.slice(0, 10),
        actor: getUserById(item.toUserId)?.fullName ?? getUserById(item.fromUserId)?.fullName ?? 'System',
        note: item.note,
        departmentId: item.departmentId,
        departmentName: item.departmentName,
        returnDate: item.returnDate,
      })),
  }
}

function mapCategoryType(category?: string): CategoryType {
  switch (category) {
    case 'Application':
      return 'SOFTWARE'
    case 'Endpoint':
    case 'Infrastructure':
    case 'Network':
      return 'HARDWARE'
    default:
      return 'NON_IT'
  }
}

function addYears(dateValue: string, years: number) {
  const next = new Date(dateValue)
  next.setFullYear(next.getFullYear() + years)
  return next.toISOString().slice(0, 10)
}
