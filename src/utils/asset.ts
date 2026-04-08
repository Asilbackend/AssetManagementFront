import type {
  AssetAttribute,
  AssetRecord,
  AssetTypeDefinition,
  CategoryType,
  SecurityInstallStatus,
  Status,
} from '../types'
import { categoryTypeLabels } from './category'

export const statusLabels: Record<Status, string> = {
  available: 'Omborda',
  assigned: 'Biriktirilgan',
  maintenance: "Ta'mirda",
  broken: 'Nosoz',
}

export const formatDate = (value: string) => {
  if (!value) {
    return 'Kiritilmagan'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

export const buildAssetCode = (
  assetType: AssetTypeDefinition,
  referenceDate: string,
  sequence: number,
) => {
  const date = referenceDate ? new Date(referenceDate) : new Date()
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const serial = String(sequence).padStart(3, '0')
  return `${assetType.code}-${year}${month}-${serial}`
}

export const nextSequenceForType = (
  assets: AssetRecord[],
  assetTypeId: string,
  referenceDate: string,
) => {
  const date = referenceDate ? new Date(referenceDate) : new Date()
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const prefix = `${year}${month}`

  return (
    assets.filter(
      (asset) =>
        asset.assetTypeId === assetTypeId &&
        asset.assetCode.split('-')[1] === prefix,
    ).length + 1
  )
}

export const buildEmptyAttributes = (attributes: AssetAttribute[]) =>
  Object.fromEntries(attributes.map((attribute) => [attribute.name, '']))

export const filterAssetsByCategoryType = (
  assets: AssetRecord[],
  categoryType: CategoryType | 'all',
) =>
  categoryType === 'all'
    ? assets
    : assets.filter((asset) => asset.categoryType === categoryType)

export const readAssetPrimaryDetails = (asset: AssetRecord) => [
  { label: 'Asset kodi', value: asset.assetCode },
  { label: 'Ariza ID', value: asset.requestId ?? "Bog'lanmagan" },
  { label: 'Kategoriya turi', value: categoryTypeLabels[asset.categoryType] },
  { label: 'Kategoriya', value: asset.categoryName },
  { label: 'Asset turi', value: asset.assetTypeName },
  { label: 'Holati', value: statusLabels[asset.status] },
  { label: 'Xarid narxi', value: formatCurrency(asset.purchasePrice) },
  { label: 'Kutilgan narx', value: formatCurrency(asset.expectedPrice ?? asset.purchasePrice) },
  { label: 'Amaldagi narx', value: formatCurrency(asset.actualPrice ?? asset.purchasePrice) },
  { label: 'Bo‘lim', value: asset.departmentName ?? 'Ombor' },
  { label: 'Qaytarish sanasi', value: formatDate(asset.returnDate ?? '') },
  { label: 'Xarid sanasi', value: formatDate(asset.purchaseDate) },
  { label: 'Kafolat sanasi', value: formatDate(asset.warrantyDate) },
]

export const statusTone = (status: Status) => {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-700'
    case 'assigned':
      return 'bg-blue-100 text-blue-700'
    case 'maintenance':
      return 'bg-amber-100 text-amber-700'
    case 'broken':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export const securityStatusTone = (status: SecurityInstallStatus) => {
  switch (status) {
    case 'INSTALLED':
      return 'bg-emerald-100 text-emerald-700'
    case 'FAILED':
      return 'bg-rose-100 text-rose-700'
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export const securityStatusLabel = (status: SecurityInstallStatus) => {
  switch (status) {
    case 'INSTALLED':
      return "O'rnatilgan"
    case 'FAILED':
      return 'Xatolik'
    case 'PENDING':
    default:
      return 'Kutilmoqda'
  }
}
