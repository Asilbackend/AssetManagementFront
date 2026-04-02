import { useMemo, useState } from 'react'
import { AssetDetailCard } from '../components/assets/AssetDetailCard'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'
import { departments } from '../data/mockData'
import { statusTone } from '../utils/asset'

const today = new Date().toISOString().slice(0, 10)

export function AssignAssetPage() {
  const { assets, assignAssets } = useAssetStore()
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [previewAssetId, setPreviewAssetId] = useState<string>('')
  const [form, setForm] = useState({
    departmentId: '',
    date: today,
    employee: '',
    note: '',
    returnDate: '',
  })

  const assignableAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.status === 'available' &&
          (asset.assetCode.toLowerCase().includes(search.toLowerCase()) ||
            asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.assetTypeName.toLowerCase().includes(search.toLowerCase())),
      ),
    [assets, search],
  )

  const previewAsset =
    assets.find((asset) => asset.id === previewAssetId) ??
    assignableAssets.find((asset) => selectedAssetIds.includes(asset.id)) ??
    assignableAssets[0]

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId],
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedAssetIds.length === 0) {
      return
    }

    assignAssets(selectedAssetIds, form)
    setSelectedAssetIds([])
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
        title="Assetni departmentga biriktirish"
        description="Bu sahifada faqat biriktirishga oid ma'lumotlar kiritiladi. Asset ma'lumotlarini qayta yozishga hojat yo'q, omborchi faqat kerakli bog'lovchi maydonlarni to'ldiradi."
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
                Ombordan berilishi mumkin bo'lgan assetlar
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
            {assignableAssets.map((asset) => {
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
                        <p className="text-sm text-slate-500">{asset.assetTypeName}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(asset.status)}`}
                      >
                        {asset.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{asset.assetCode}</p>
                  </div>
                </button>
              )
            })}
          </div>
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
                Departmentga topshirish formasi
              </h3>
            </div>

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

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Qabul qilgan xodim *</span>
              <input
                value={form.employee}
                onChange={(event) =>
                  setForm((current) => ({ ...current, employee: event.target.value }))
                }
                placeholder="F.I.Sh"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                required
              />
            </label>

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
              Tanlangan assetlarni biriktirish
            </button>
          </form>

          <AssetDetailCard asset={previewAsset} />
        </div>
      </div>
    </div>
  )
}
