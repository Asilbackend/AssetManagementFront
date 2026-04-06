import { Link } from 'react-router-dom'
import type { AssetRecord } from '../../types'
import {
  formatDate,
  readAssetPrimaryDetails,
  securityStatusTone,
  statusTone,
} from '../../utils/asset'
import { useAppStore } from '../../store/AppStore'

type AssetDetailCardProps = {
  asset?: AssetRecord
}

export function AssetDetailCard({ asset }: AssetDetailCardProps) {
  const { currentUser } = useAppStore()
  const canEdit = currentUser?.role === 'WAREHOUSE_MANAGER'

  if (!asset) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
        Asset tanlang, shu yerda uning to'liq ma'lumoti chiroyli ko'rinishda chiqadi.
      </div>
    )
  }

  const mainDetails = readAssetPrimaryDetails(asset)

  return (
    <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Asset detail
          </p>
          <h3 className="text-2xl font-semibold text-slate-900">{asset.name}</h3>
          <p className="text-sm text-slate-500">{asset.assetTypeName}</p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusTone(asset.status)}`}
        >
          {asset.status}
        </span>
        {canEdit ? (
          <Link
            to={`/assets/${asset.id}/edit`}
            className="inline-flex w-fit rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit asset
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {mainDetails.map((detail) => (
          <article
            key={detail.label}
            className="rounded-2xl bg-slate-50 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {detail.label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">{detail.value}</p>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Security agent holati
        </h4>
        {asset.securityStatuses.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {asset.securityStatuses.map((item) => (
              <article
                key={`${asset.id}-${item.agent}`}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{item.agent}</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${securityStatusTone(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Ushbu asset uchun security agent talab qilinmaydi.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Xarakteristikalar
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(asset.attributes).map(([key, value]) => (
            <article key={key} className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {key}
              </p>
              <p className="mt-2 text-sm text-slate-700">{value}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          History
        </h4>
        <div className="space-y-3">
          {asset.history.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{item.note}</p>
                <p className="mt-1 text-sm text-slate-500">{item.actor}</p>
              </div>
              <div className="text-sm text-slate-500">
                <p>{formatDate(item.date)}</p>
                <p>{item.departmentName ?? 'Ombor'}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
