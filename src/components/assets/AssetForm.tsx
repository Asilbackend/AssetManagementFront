import { useMemo, useState } from 'react'
import { DynamicField } from '../forms/DynamicField'
import { assetTypes, categories } from '../../data/mockData'
import type { AssetRecord, CategoryType, CreateAssetInput, Status, UpdateAssetInput } from '../../types'
import { buildAssetCode, buildEmptyAttributes, nextSequenceForType } from '../../utils/asset'
import { categoryTypeDescriptions, categoryTypeLabels, categoryTypeTone } from '../../utils/category'

const defaultStatus: Status = 'available'
const today = new Date().toISOString().slice(0, 10)

type AssetFormProps =
  | {
      mode: 'create'
      assets: AssetRecord[]
      initialAsset?: undefined
      submitLabel: string
      onSubmit: (payload: CreateAssetInput) => void
    }
  | {
      mode: 'edit'
      assets: AssetRecord[]
      initialAsset?: AssetRecord
      submitLabel: string
      onSubmit: (payload: UpdateAssetInput) => void
    }

const pickDefaultCategoryType = (asset?: AssetRecord): CategoryType =>
  asset?.categoryType ?? categories[0]?.categoryType ?? 'HARDWARE'

const pickDefaultCategoryId = (categoryType: CategoryType, asset?: AssetRecord) =>
  asset?.categoryId ??
  categories.find((category) => category.categoryType === categoryType)?.id ??
  ''

const pickDefaultAssetTypeId = (categoryId: string, asset?: AssetRecord) =>
  asset?.assetTypeId ?? assetTypes.find((assetType) => assetType.categoryId === categoryId)?.id ?? ''

export function AssetForm({
  mode,
  assets,
  initialAsset,
  submitLabel,
  onSubmit,
}: AssetFormProps) {
  const [error, setError] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>(() =>
    pickDefaultCategoryType(initialAsset),
  )
  const [categoryId, setCategoryId] = useState(() =>
    pickDefaultCategoryId(pickDefaultCategoryType(initialAsset), initialAsset),
  )
  const [assetTypeId, setAssetTypeId] = useState(() =>
    pickDefaultAssetTypeId(
      pickDefaultCategoryId(pickDefaultCategoryType(initialAsset), initialAsset),
      initialAsset,
    ),
  )
  const [form, setForm] = useState({
    name: initialAsset?.name ?? '',
    quantity: 1,
    purchasePrice: initialAsset?.purchasePrice ?? 0,
    purchaseDate: initialAsset?.purchaseDate ?? today,
    warrantyDate: initialAsset?.warrantyDate ?? '',
    status: initialAsset?.status ?? defaultStatus,
    attributes: initialAsset?.attributes ?? {},
  })

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.categoryType === categoryType),
    [categoryType],
  )
  const activeCategoryId = categoryOptions.some((category) => category.id === categoryId)
    ? categoryId
    : categoryOptions[0]?.id ?? ''
  const typeOptions = useMemo(
    () => assetTypes.filter((assetType) => assetType.categoryId === activeCategoryId),
    [activeCategoryId],
  )
  const activeAssetTypeId = typeOptions.some((item) => item.id === assetTypeId)
    ? assetTypeId
    : typeOptions[0]?.id ?? ''
  const selectedType = typeOptions.find((item) => item.id === activeAssetTypeId) ?? typeOptions[0]

  const updateAttributesForType = (nextAssetTypeId: string) => {
    const nextType = assetTypes.find((assetType) => assetType.id === nextAssetTypeId)

    setForm((current) => ({
      ...current,
      attributes: Object.fromEntries(
        (nextType?.attributes ?? []).map((field) => [
          field.name,
          current.attributes[field.name] ?? '',
        ]),
      ),
    }))
  }

  const handleCategoryTypeChange = (nextCategoryType: CategoryType) => {
    const nextCategoryId =
      categories.find((category) => category.categoryType === nextCategoryType)?.id ?? ''
    const nextAssetTypeId =
      assetTypes.find((assetType) => assetType.categoryId === nextCategoryId)?.id ?? ''

    setCategoryType(nextCategoryType)
    setCategoryId(nextCategoryId)
    setAssetTypeId(nextAssetTypeId)
    updateAttributesForType(nextAssetTypeId)
  }

  const handleCategoryChange = (nextCategoryId: string) => {
    const nextAssetTypeId =
      assetTypes.find((assetType) => assetType.categoryId === nextCategoryId)?.id ?? ''

    setCategoryId(nextCategoryId)
    setAssetTypeId(nextAssetTypeId)
    updateAttributesForType(nextAssetTypeId)
  }

  const handleAssetTypeChange = (nextAssetTypeId: string) => {
    setAssetTypeId(nextAssetTypeId)
    updateAttributesForType(nextAssetTypeId)
  }

  const generatedCode = useMemo(() => {
    if (!selectedType) {
      return ''
    }

    const scope = mode === 'edit' && initialAsset
      ? assets.filter((asset) => asset.id !== initialAsset.id)
      : assets
    const sequence = nextSequenceForType(scope, selectedType.id, form.purchaseDate)
    const effectiveSequence =
      mode === 'edit' &&
      initialAsset &&
      initialAsset.assetTypeId === selectedType.id &&
      initialAsset.purchaseDate === form.purchaseDate
        ? Number(initialAsset.assetCode.split('-')[2])
        : sequence

    return buildAssetCode(selectedType, form.purchaseDate, effectiveSequence)
  }, [assets, form.purchaseDate, initialAsset, mode, selectedType])

  const handleReset = () => {
    const nextCategoryType = pickDefaultCategoryType(initialAsset)
    const nextCategoryId = pickDefaultCategoryId(nextCategoryType, initialAsset)
    const nextAssetTypeId = pickDefaultAssetTypeId(nextCategoryId, initialAsset)
    const nextType = assetTypes.find((assetType) => assetType.id === nextAssetTypeId)

    setError('')
    setCategoryType(nextCategoryType)
    setCategoryId(nextCategoryId)
    setAssetTypeId(nextAssetTypeId)
    setForm({
      name: initialAsset?.name ?? '',
      quantity: 1,
      purchasePrice: initialAsset?.purchasePrice ?? 0,
      purchaseDate: initialAsset?.purchaseDate ?? today,
      warrantyDate: initialAsset?.warrantyDate ?? '',
      status: initialAsset?.status ?? defaultStatus,
      attributes: initialAsset?.attributes ?? buildEmptyAttributes(nextType?.attributes ?? []),
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedType) {
      setError('Tanlangan category uchun asset type topilmadi.')
      return
    }

    try {
      setError('')
      const basePayload = {
        name: form.name,
        categoryType,
        categoryId: activeCategoryId,
        assetTypeId: activeAssetTypeId,
        purchasePrice: form.purchasePrice,
        purchaseDate: form.purchaseDate,
        warrantyDate: form.warrantyDate,
        status: form.status,
        attributes: form.attributes,
      }

      if (mode === 'create') {
        onSubmit({
          ...basePayload,
          quantity: form.quantity,
        })
      } else {
        onSubmit(basePayload)
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Asset saqlashda xatolik yuz berdi.',
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Category type *</span>
          <select
            value={categoryType}
            onChange={(event) => handleCategoryTypeChange(event.target.value as CategoryType)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          >
            <option value="HARDWARE">Hardware</option>
            <option value="SOFTWARE">Software</option>
            <option value="NON_IT">Non-IT Assets</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Category *</span>
          <select
            value={activeCategoryId}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            required
            disabled={categoryOptions.length === 0}
          >
            {categoryOptions.length === 0 ? (
              <option value="">Bu category type uchun category yo'q</option>
            ) : null}
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.englishLabel})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Asset type *</span>
          <select
            value={activeAssetTypeId}
            onChange={(event) => handleAssetTypeChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            required
            disabled={typeOptions.length === 0}
          >
            {typeOptions.length === 0 ? <option value="">Asset type topilmadi</option> : null}
            {typeOptions.map((assetType) => (
              <option key={assetType.id} value={assetType.id}>
                {assetType.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Asset code</span>
          <input
            value={generatedCode}
            readOnly
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          />
          {mode === 'create' && form.quantity > 1 ? (
            <span className="text-xs text-slate-500">
              Birinchi code ko'rsatilmoqda. Qolgan assetlar shu ketma-ketlikda tartib raqami bilan
              yaratiladi.
            </span>
          ) : null}
        </label>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
              Selected category type
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {categoryTypeLabels[categoryType]}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{categoryTypeDescriptions[categoryType]}</p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${categoryTypeTone[categoryType]}`}
          >
            {categoryTypeLabels[categoryType]}
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Asset name *</span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Masalan: Branch Firewall 01"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            required
          />
        </label>

        {mode === 'create' ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Soni *</span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              required
            />
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Status *</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as Status,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          >
            <option value="available">Omborda</option>
            <option value="maintenance">Ta'mirda</option>
            <option value="broken">Nosoz</option>
            <option value="assigned">Biriktirilgan</option>
          </select>
          </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Sotib olingan narxi *</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.purchasePrice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                purchasePrice: Math.max(0, Number(event.target.value) || 0),
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Purchase date *</span>
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, purchaseDate: event.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Warranty date</span>
          <input
            type="date"
            value={form.warrantyDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, warrantyDate: event.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-[28px] bg-slate-50 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Dynamic fields
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {selectedType?.name ?? 'Asset type tanlang'}
          </h3>
          <p className="text-sm text-slate-500">
            {selectedType?.description ?? 'Avval category type va category tanlang.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {selectedType?.attributes.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={form.attributes[field.name] ?? ''}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  attributes: {
                    ...current.attributes,
                    [field.name]: value,
                  },
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!selectedType || categoryOptions.length === 0}
          className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Formani tozalash
        </button>
      </div>
    </form>
  )
}
