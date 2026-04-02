import { reportPresets } from '../data/mockData'
import type { AssetRecord } from '../types'
import { categoryTypeLabels } from './category'
import { formatCurrency, formatDate, statusLabels } from './asset'
import type { ReportPeriod } from '../types'

export const getReportPreset = (period: ReportPeriod) =>
  reportPresets.find((item) => item.id === period) ?? reportPresets[0]

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const getReportReferenceDate = (assets: AssetRecord[]) => {
  if (assets.length === 0) {
    return new Date()
  }

  return assets.reduce((latest, asset) => {
    const assetDate = new Date(asset.purchaseDate)
    return assetDate > latest ? assetDate : latest
  }, new Date(assets[0].purchaseDate))
}

export const getReportRange = (period: ReportPeriod, referenceDate = new Date()) => {
  const end = startOfDay(referenceDate)
  const start = new Date(end)

  switch (period) {
    case 'weekly':
      start.setDate(end.getDate() - 6)
      break
    case 'monthly':
      start.setMonth(end.getMonth() - 1)
      start.setDate(start.getDate() + 1)
      break
    case 'quarterly':
      start.setMonth(end.getMonth() - 3)
      start.setDate(start.getDate() + 1)
      break
    case 'yearly':
      start.setFullYear(end.getFullYear() - 1)
      start.setDate(start.getDate() + 1)
      break
  }

  return { start, end }
}

export const filterAssetsForReport = (
  assets: AssetRecord[],
  period: ReportPeriod,
  referenceDate = getReportReferenceDate(assets),
) => {
  const range = getReportRange(period, referenceDate)
  return assets.filter((asset) => {
    const purchaseDate = startOfDay(new Date(asset.purchaseDate))
    return purchaseDate >= range.start && purchaseDate <= range.end
  })
}

export const buildReportHtml = (
  assets: AssetRecord[],
  period: ReportPeriod,
  generatedAt = new Date(),
) => {
  const totalPrice = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)
  const preset = getReportPreset(period)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${preset.label} hisobot</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
      h1 { margin-bottom: 8px; }
      .muted { color: #64748b; font-size: 12px; }
      .cards { display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; min-width: 180px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
      th { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${preset.label} hisobot</h1>
    <p class="muted">Generated: ${formatDate(generatedAt.toISOString())}</p>
    <div class="cards">
      <div class="card"><strong>Assetlar</strong><br />${assets.length}</div>
      <div class="card"><strong>Jami qiymat</strong><br />${formatCurrency(totalPrice)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Asset code</th>
          <th>Nomi</th>
          <th>Category type</th>
          <th>Status</th>
          <th>Narx</th>
          <th>Purchase date</th>
          <th>Department</th>
        </tr>
      </thead>
      <tbody>
        ${assets
          .map(
            (asset) => `
          <tr>
            <td>${asset.assetCode}</td>
            <td>${asset.name}</td>
            <td>${categoryTypeLabels[asset.categoryType]}</td>
            <td>${statusLabels[asset.status]}</td>
            <td>${formatCurrency(asset.purchasePrice)}</td>
            <td>${formatDate(asset.purchaseDate)}</td>
            <td>${asset.departmentName ?? 'Ombor'}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </body>
</html>`
}

export const exportReportAsWord = (assets: AssetRecord[], period: ReportPeriod) => {
  const html = buildReportHtml(assets, period)
  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${period}-asset-report.doc`
  link.click()
  URL.revokeObjectURL(url)
}

export const exportReportAsPdf = (assets: AssetRecord[], period: ReportPeriod) => {
  const reportWindow = window.open('', '_blank', 'width=1200,height=900')

  if (!reportWindow) {
    throw new Error('PDF oynasini ochib bo\'lmadi. Browser pop-up ruxsatini tekshiring.')
  }

  reportWindow.document.open()
  reportWindow.document.write(buildReportHtml(assets, period))
  reportWindow.document.close()
  reportWindow.focus()
  reportWindow.print()
}
