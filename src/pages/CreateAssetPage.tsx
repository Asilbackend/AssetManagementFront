import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DynamicField } from '../components/forms/DynamicField'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'
import { assetTypes, categories } from '../data/mockData'
import type { Status } from '../types'
import { buildEmptyAttributes, buildAssetCode, nextSequenceForType } from '../utils/asset'

const defaultStatus: Status = 'available'
const today = new Date().toISOString().slice(0, 10)

export function CreateAssetPage() {
  const navigate = useNavigate()
  const { assets, createAsset } = useAssetStore()
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const typeOptions = useMemo(
    () => assetTypes.filter((assetType) => assetType.categoryId === categoryId),
    [categoryId],
  )
  const [assetTypeId, setAssetTypeId] = useState(typeOptions[0]?.id ?? '')
  const selectedType = typeOptions.find((item) => item.id === assetTypeId) ?? typeOptions[0]
  const [form, setForm] = useState({
    name: '',
    purchaseDate: today,
    warrantyDate: '',
    status: defaultStatus,
    attributes: buildEmptyAttributes(selectedType?.attributes ?? []),
  })

  useEffect(() => {
    if (!typeOptions.some((item) => item.id === assetTypeId) && typeOptions[0]) {
      setAssetTypeId(typeOptions[0].id)
    }
  }, [assetTypeId, typeOptions])

  useEffect(() => {
    if (!selectedType) {
      return
    }

    setForm((current) => ({
      ...current,
      attributes: buildEmptyAttributes(selectedType.attributes),
    }))
  }, [selectedType])

  const generatedCode = useMemo(() => {
    if (!selectedType) {
      return ''
    }

    const sequence = nextSequenceForType(assets, selectedType.id, form.purchaseDate)
    return buildAssetCode(selectedType, form.purchaseDate, sequence)
  }, [assets, form.purchaseDate, selectedType])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedType) {
      return
    }

    createAsset({
      name: form.name,
      categoryId,
      assetTypeId: selectedType.id,
      purchaseDate: form.purchaseDate,
      warrantyDate: form.warrantyDate,
      status: form.status,
      attributes: form.attributes,
    })

    navigate('/')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset create"
        title="Category → type → dynamic fieldlar"
        description="Omborchi avval category tanlaydi, keyin asset type tanlaydi. Asset code avtomatik generatsiya qilinadi: asset type code + yil + oy + tartib raqami."
        rightSlot={
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Auto code: {generatedCode}
          </div>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Category *</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Asset type *</span>
            <select
              value={assetTypeId}
              onChange={(event) => setAssetTypeId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            >
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
          </label>
        </div>

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
            <h3 className="text-xl font-semibold text-slate-900">{selectedType?.name}</h3>
            <p className="text-sm text-slate-500">{selectedType?.description}</p>
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
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Asset yaratish
          </button>
          <button
            type="button"
            onClick={() =>
              setForm({
                name: '',
                purchaseDate: today,
                warrantyDate: '',
                status: defaultStatus,
                attributes: buildEmptyAttributes(selectedType?.attributes ?? []),
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Formani tozalash
          </button>
        </div>
      </form>
    </div>
  )
}
