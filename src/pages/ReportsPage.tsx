import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { useAssetStore } from '../context/AssetContext'
import { reportPresets } from '../data/mockData'
import type { ReportPeriod } from '../types'
import { formatCurrency, formatDate } from '../utils/asset'
import {
  exportReportAsPdf,
  exportReportAsWord,
  filterAssetsForReport,
  getReportPreset,
} from '../utils/report'

export function ReportsPage() {
  const { assets } = useAssetStore()
  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [message, setMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const activePreset = getReportPreset(period)

  const reportAssets = useMemo(() => filterAssetsForReport(assets, period), [assets, period])
  const totals = useMemo(
    () => ({
      assetCount: reportAssets.length,
      totalPrice: reportAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0),
      assignedCount: reportAssets.filter((asset) => asset.status === 'assigned').length,
      avgPrice:
        reportAssets.length > 0
          ? reportAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0) / reportAssets.length
          : 0,
    }),
    [reportAssets],
  )
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(reportAssets.length / pageSize))
  const paginatedAssets = reportAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [period])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hisobotlar"
        title="Narxlar bilan haftalik, oylik, chorak va yillik hisobotlar"
        description={`${activePreset.description} Word formatda yuklab olish yoki print oynasi orqali PDF ko'rinishida saqlash mumkin.`}
        rightSlot={
          <>
            <button
              type="button"
              onClick={() => {
                try {
                  exportReportAsWord(reportAssets, period)
                  setMessage('Word hisobot yuklab olindi.')
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Word export xatoligi.')
                }
              }}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Word export
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  exportReportAsPdf(reportAssets, period)
                  setMessage('PDF uchun print oynasi ochildi.')
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'PDF export xatoligi.')
                }
              }}
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
            >
              PDF export
            </button>
          </>
        }
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2">
          {reportPresets.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                period === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
        {message ? <p className="mt-4 text-sm text-slate-500">{message}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Assetlar</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.assetCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Jami qiymat</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">{formatCurrency(totals.totalPrice)}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Assigned</p>
          <p className="mt-3 text-3xl font-semibold text-blue-700">{totals.assignedCount}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">O'rtacha narx</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(totals.avgPrice)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{activePreset.label} assetlar ro'yxati</h3>
          <p className="mt-1 text-sm text-slate-500">Narxlar va purchase date asosida shakllangan hisobot.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.24em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Asset code</th>
                <th className="px-5 py-4">Nomi</th>
                <th className="px-5 py-4">Narx</th>
                <th className="px-5 py-4">Sotib olingan sana</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Qaytarilgan sana</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssets.map((asset) => (
                <tr key={asset.id} className="border-t border-slate-100 bg-white">
                  <td className="px-5 py-4 font-semibold text-slate-900">{asset.assetCode}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="text-sm text-slate-500">{asset.assetTypeName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{formatCurrency(asset.purchasePrice)}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{formatDate(asset.purchaseDate)}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{asset.status}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{formatDate(asset.returnDate ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportAssets.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              Tanlangan davr bo'yicha asset topilmadi.
            </div>
          ) : null}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          variant="light"
        />
      </section>
    </div>
  )
}
