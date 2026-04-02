import { assetTypes, categories } from '../data/mockData'
import type { CreateAssetInput, UpdateAssetInput } from '../types'

const validateAssetSelection = (
  payload: Pick<CreateAssetInput, 'categoryType' | 'categoryId' | 'assetTypeId'>,
) => {
  const category = categories.find((item) => item.id === payload.categoryId)
  const assetType = assetTypes.find((item) => item.id === payload.assetTypeId)

  if (!category) {
    throw new Error('Tanlangan category topilmadi.')
  }

  if (!assetType) {
    throw new Error('Tanlangan asset type topilmadi.')
  }

  if (payload.categoryType !== category.categoryType) {
    throw new Error('Category type va category o\'rtasida moslik yo\'q.')
  }

  if (assetType.categoryId !== category.id) {
    throw new Error('Category va asset type o\'rtasida moslik yo\'q.')
  }

  if (assetType.categoryType !== payload.categoryType) {
    throw new Error('Category type va asset type o\'rtasida moslik yo\'q.')
  }

  return { category, assetType }
}

export const validateCreateAssetPayload = (payload: CreateAssetInput) => {
  if (!Number.isInteger(payload.quantity) || payload.quantity < 1) {
    throw new Error('Soni kamida 1 bo\'lishi kerak.')
  }

  if (!Number.isFinite(payload.purchasePrice) || payload.purchasePrice < 0) {
    throw new Error('Narx 0 yoki undan katta bo\'lishi kerak.')
  }

  return validateAssetSelection(payload)
}

export const validateUpdateAssetPayload = (payload: UpdateAssetInput) => {
  if (!Number.isFinite(payload.purchasePrice) || payload.purchasePrice < 0) {
    throw new Error('Narx 0 yoki undan katta bo\'lishi kerak.')
  }

  return validateAssetSelection(payload)
}
