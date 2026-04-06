import { useMemo, useState } from 'react'
import { AssetDetailCard } from '../components/assets/AssetDetailCard'
import { AssetListTable } from '../components/dashboard/AssetListTable'
import { DashboardModal } from '../components/dashboard/DashboardModal'
import { AssetTypeCard } from '../components/dashboard/AssetTypeCard'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'
import { assetTypes, categories, securityAgents } from '../data/mockData'
import type { CategoryType, Status } from '../types'
import { filterAssetsByCategoryType, statusLabels } from '../utils/asset'
import {
  categoryTypeDescriptions,
  categoryTypeLabels,
  categoryTypeTabs,
  categoryTypeTone,
  filterCategoriesByType,
} from '../utils/category'

const statusTabs = [
  { id: 'all', label: 'Barchasi' },
  { id: 'available', label: 'Available' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'broken', label: 'Broken' },
] as const

type StatusFilter = (typeof statusTabs)[number]['id']
type CategoryTypeFilter = 'all' | CategoryType

export function DashboardPage() {
  const { assets, listAssets } = useAssetStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<CategoryTypeFilter>('all')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [modalView, setModalView] = useState<'list' | 'detail' | null>(null)

  const categoryScopedAssets = useMemo(
    () => listAssets({ categoryType: categoryTypeFilter }),
    [categoryTypeFilter, listAssets],
  )

  const visibleAssets = useMemo(
    () =>
      filterAssetsByCategoryType(assets, categoryTypeFilter).filter((asset) =>
        statusFilter === 'all' ? true : asset.status === (statusFilter as Status),
      ),
    [assets, categoryTypeFilter, statusFilter],
  )

  const filteredCategories = useMemo(
    () => filterCategoriesByType(categories, categoryTypeFilter),
    [categoryTypeFilter],
  )

  const filteredAssetTypes = useMemo(
    () =>
      assetTypes.filter((assetType) =>
        categoryTypeFilter === 'all' ? true : assetType.categoryType === categoryTypeFilter,
      ),
    [categoryTypeFilter],
  )

  const assetsByType = useMemo(
    () =>
      Object.fromEntries(
        filteredAssetTypes.map((assetType) => [
          assetType.id,
          visibleAssets.filter((asset) => asset.assetTypeId === assetType.id),
        ]),
      ),
    [filteredAssetTypes, visibleAssets],
  )

  const modalAssets = assetsByType[selectedTypeId] ?? []
  const selectedAsset =
    modalAssets.find((asset) => asset.id === selectedAssetId) ?? modalAssets[0]

  const categorySections = useMemo(
    () =>
      filteredCategories.map((category) => {
        const categoryAssetTypes = filteredAssetTypes.filter(
          (assetType) => assetType.categoryId === category.id,
        )

        return {
          ...category,
          categoryAssetTypes,
          assetCount: visibleAssets.filter((asset) => asset.categoryId === category.id).length,
        }
      }),
    [filteredAssetTypes, filteredCategories, visibleAssets],
  )

  const stats = useMemo(
    () => ({
      totalAssets: categoryScopedAssets.length,
      visibleAssets: visibleAssets.length,
      assignedCount: categoryScopedAssets.filter((asset) => asset.status === 'assigned').length,
      activeCategoryCount: filteredCategories.length,
      activeTypeCount: filteredAssetTypes.length,
    }),
    [categoryScopedAssets, filteredAssetTypes, filteredCategories, visibleAssets],
  )

  const edrCoverage = useMemo(() => {
    const edrCapableAssets = assets.filter((asset) =>
      asset.securityStatuses.some((item) => item.agent === 'EDR'),
    )
    const edrInstalledAssets = edrCapableAssets.filter((asset) =>
      asset.securityStatuses.some((item) => item.agent === 'EDR' && item.status === 'INSTALLED'),
    )

    return {
      capable: edrCapableAssets.length,
      installed: edrInstalledAssets.length,
      percent:
        edrCapableAssets.length > 0
          ? Math.round((edrInstalledAssets.length / edrCapableAssets.length) * 100)
          : 0,
    }
  }, [assets])

  const agentAssetCounts = useMemo(
    () =>
      securityAgents.map((agent) => ({
        agent,
        assetCount: assets.filter((asset) =>
          asset.securityStatuses.some((item) => item.agent === agent),
        ).length,
        installedCount: assets.filter((asset) =>
          asset.securityStatuses.some(
            (item) => item.agent === agent && item.status === 'INSTALLED',
          ),
        ).length,
      })),
    [assets],
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
        title="Category type bo'yicha boshqariladigan asset dashboard"
        description="Dashboard endi category type ni birinchi darajali filter sifatida ishlatadi. Tanlangan type asosida categorylar, asset typelar, asset sonlari va modal ro'yxatlar dinamik yangilanadi."
        rightSlot={
          <>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Scope assetlar: {stats.totalAssets}
            </div>
            <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
              Ko'rinayotgan assetlar: {stats.visibleAssets}
            </div>
          </>
        }
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
              Category type filter
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Assetlarni asosiy guruh bo'yicha filtrlash
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Hardware, Software va Non-IT Assets kesimida dashboard ko'rinishini boshqaring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryTypeTabs.map((tab) => {
              const count =
                tab.id === 'all'
                  ? assets.length
                  : assets.filter((asset) => asset.categoryType === tab.id).length

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryTypeFilter(tab.id)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    categoryTypeFilter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Scope asset
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalAssets}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Hozirgi ko'rinish
          </p>
          <p className="mt-3 text-3xl font-semibold text-amber-700">{stats.visibleAssets}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Assigned
          </p>
          <p className="mt-3 text-3xl font-semibold text-blue-700">{stats.assignedCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Category
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.activeCategoryCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Asset type
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.activeTypeCount}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            EDR coverage
          </p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{edrCoverage.percent}%</p>
          <p className="mt-2 text-sm text-slate-500">
            EDR o'rnatilishi mumkin bo'lgan {edrCoverage.capable} ta assetdan{' '}
            {edrCoverage.installed} tasida EDR o'rnatilgan.
          </p>
        </article>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                Agent statistics
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Har bir agent bo'yicha assetlar soni
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              `Asset count` agent qo'llanadigan assetlar, `Installed` esa amalda o'rnatilganlari.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {agentAssetCounts.map((item) => (
              <article
                key={item.agent}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.agent}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{item.assetCount}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Installed: {item.installedCount}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
              Status filter
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Tanlangan category type ichida status bo'yicha kesim
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const count =
                tab.id === 'all'
                  ? categoryScopedAssets.length
                  : categoryScopedAssets.filter((asset) => asset.status === tab.id).length

              return (
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
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {categoryTypeFilter !== 'all' ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                Current type
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {categoryTypeLabels[categoryTypeFilter]}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {categoryTypeDescriptions[categoryTypeFilter]}
              </p>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${categoryTypeTone[categoryTypeFilter]}`}
            >
              {categoryTypeLabels[categoryTypeFilter]}
            </span>
          </div>
        </section>
      ) : null}

      {categorySections.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-semibold text-slate-900">Bu type uchun category topilmadi</h3>
          <p className="mt-2 text-sm text-slate-500">
            Non-IT Assets uchun tuzilma tayyor. Keyinchalik yangi categorylar qo'shilsa shu filter
            ichida avtomatik ko'rinadi.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {categorySections.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryTypeTone[category.categoryType]}`}
                      >
                        {categoryTypeLabels[category.categoryType]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-600">{category.englishLabel}</p>
                    <p className="mt-2 text-sm text-slate-500">{category.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      Asset type lar: {category.categoryAssetTypes.length}
                    </div>
                    <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                      Assetlar: {category.assetCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.categoryAssetTypes.map((assetType) => (
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
          ))}
        </div>
      )}

      {modalView === 'list' ? (
        <DashboardModal
          title={assetTypes.find((item) => item.id === selectedTypeId)?.name ?? 'Asset list'}
          description={`Filter: ${categoryTypeFilter === 'all' ? 'All category types' : categoryTypeLabels[categoryTypeFilter]}, ${statusFilter === 'all' ? 'Barchasi' : statusLabels[statusFilter as Status]}.`}
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
          description="Assetga tegishli to'liq ma'lumot, category type, xarakteristika va history shu modal ichida ko'rsatiladi."
          onClose={closeModal}
          onBack={() => setModalView('list')}
        >
          <AssetDetailCard asset={selectedAsset} />
        </DashboardModal>
      ) : null}
    </div>
  )
}
