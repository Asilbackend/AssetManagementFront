import { useMemo, useState } from 'react'
import { AssetDetailCard } from '../components/assets/AssetDetailCard'
import { AssetListTable } from '../components/dashboard/AssetListTable'
import { DashboardModal } from '../components/dashboard/DashboardModal'
import { AssetTypeCard } from '../components/dashboard/AssetTypeCard'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'
import { assetTypes, categories } from '../data/mockData'
import type { Status } from '../types'
import { statusLabels } from '../utils/asset'

const statusTabs = [
  { id: 'all', label: 'Barchasi' },
  { id: 'available', label: 'Available' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'broken', label: 'Broken' },
] as const

type StatusFilter = (typeof statusTabs)[number]['id']

export function DashboardPage() {
  const { assets } = useAssetStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [modalView, setModalView] = useState<'list' | 'detail' | null>(null)

  const visibleAssets = useMemo(
    () =>
      assets.filter((asset) =>
        statusFilter === 'all' ? true : asset.status === (statusFilter as Status),
      ),
    [assets, statusFilter],
  )

  const assetsByType = useMemo(
    () =>
      Object.fromEntries(
        assetTypes.map((assetType) => [
          assetType.id,
          visibleAssets.filter((asset) => asset.assetTypeId === assetType.id),
        ]),
      ),
    [visibleAssets],
  )

  const modalAssets = assetsByType[selectedTypeId] ?? []
  const selectedAsset =
    modalAssets.find((asset) => asset.id === selectedAssetId) ?? modalAssets[0]

  const stats = useMemo(() => {
    const assignedCount = assets.filter((asset) => asset.status === 'assigned').length
    const availableCount = assets.filter((asset) => asset.status === 'available').length
    const maintenanceCount = assets.filter((asset) => asset.status === 'maintenance').length
    const brokenCount = assets.filter((asset) => asset.status === 'broken').length
    const activeCategoryCount = categories.filter((category) =>
      assets.some((asset) => asset.categoryId === category.id),
    ).length
    const activeTypeCount = assetTypes.filter((assetType) =>
      assets.some((asset) => asset.assetTypeId === assetType.id),
    ).length

    return {
      assignedCount,
      availableCount,
      maintenanceCount,
      brokenCount,
      activeCategoryCount,
      activeTypeCount,
    }
  }, [assets])

  const filteredCategories = useMemo(
    () =>
      categories
        .map((category) => {
          const categoryTypes = assetTypes
            .filter((assetType) => assetType.categoryId === category.id)
            .filter((assetType) => (assetsByType[assetType.id] ?? []).length > 0)

          return {
            ...category,
            categoryTypes,
          }
        })
        .filter((category) => category.categoryTypes.length > 0),
    [assetsByType],
  )

  const openTypeModal = (typeId: string) => {
    const nextAssets = assetsByType[typeId] ?? []
    setSelectedTypeId(typeId)
    setSelectedAssetId(nextAssets[0]?.id ?? '')
    setModalView('list')
  }

  const openDetailsModal = (assetId: string) => {
    setSelectedAssetId(assetId)
    setModalView('detail')
  }

  const closeModal = () => {
    setModalView(null)
    setSelectedTypeId('')
    setSelectedAssetId('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Category → Asset type → modal asset list"
        description="Asset type bosilganda list pastda emas, modal ichida ochiladi. `Details` bosilganda esa assetning to'liq ma'lumoti alohida modalda chiqadi."
        rightSlot={
          <>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Jami assetlar: {assets.length}
            </div>
            <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
              Jami type lar: {assetTypes.length}
            </div>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Umumiy asset
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{assets.length}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Assigned
          </p>
          <p className="mt-3 text-3xl font-semibold text-blue-700">{stats.assignedCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Assigned bo'lmagan
          </p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">
            {assets.length - stats.assignedCount}
          </p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Category
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.activeCategoryCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Type
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.activeTypeCount}</p>
        </article>
        {/* <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Riskdagi asset
          </p>
          <p className="mt-3 text-3xl font-semibold text-amber-700">
            {stats.maintenanceCount + stats.brokenCount}
          </p>
        </article> */}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
              Filter
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Assigned assetlarni ham dashboard ichida ko'rish
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ].join(' ')}
              >
                {tab.id === 'all'
                  ? tab.label
                  : `${tab.label} (${assets.filter((asset) => asset.status === tab.id).length})`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {filteredCategories.map((category) => {
          const categoryAssetCount = visibleAssets.filter(
            (asset) => asset.categoryId === category.id,
          ).length

          return (
            <section key={category.id} className="space-y-4">
              <div className="rounded-[28px] border border-slate-400 bg-slate-200  p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      Asset type lar: {category.categoryTypes.length}
                    </div>
                    <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                      Assetlar: {categoryAssetCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.categoryTypes.map((assetType) => (
                  <AssetTypeCard
                    key={assetType.id}
                    assetType={assetType}
                    assetCount={(assetsByType[assetType.id] ?? []).length}
                    active={selectedTypeId === assetType.id}
                    onClick={() => openTypeModal(assetType.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {modalView === 'list' ? (
        <DashboardModal
          title={assetTypes.find((item) => item.id === selectedTypeId)?.name ?? 'Asset list'}
          description={`Bu typedagi assetlar ro'yxati. Filter: ${statusFilter === 'all' ? 'Barchasi' : statusLabels[statusFilter as Status]}. Details bosib to'liq ma'lumotga o'tishingiz mumkin.`}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                  Asset list
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {assetTypes.find((item) => item.id === selectedTypeId)?.name}
                </h3>
              </div>
              <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                Assetlar: {modalAssets.length}
              </div>
            </div>

            <AssetListTable
              assets={modalAssets}
              selectedAssetId={selectedAsset?.id}
              onSelect={setSelectedAssetId}
              onViewDetails={openDetailsModal}
            />
          </div>
        </DashboardModal>
      ) : null}

      {modalView === 'detail' ? (
        <DashboardModal
          title={selectedAsset?.name ?? 'Asset detail'}
          description="Assetga tegishli to'liq ma'lumot, xarakteristika va history shu modal ichida ko'rsatiladi."
          onClose={closeModal}
          onBack={() => setModalView('list')}
        >
          <AssetDetailCard asset={selectedAsset} />
        </DashboardModal>
      ) : null}
    </div>
  )
}
