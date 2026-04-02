/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { departments, initialAssets } from '../data/mockData'
import type { AssetRecord, AssignPayload, CategoryType, CreateAssetInput, UpdateAssetInput } from '../types'
import { validateCreateAssetPayload, validateUpdateAssetPayload } from '../utils/catalog'
import {
  buildAssetCode,
  filterAssetsByCategoryType,
  nextSequenceForType,
} from '../utils/asset'

type AssetContextValue = {
  assets: AssetRecord[]
  getAssetById: (assetId: string) => AssetRecord | undefined
  listAssets: (filters?: { categoryType?: CategoryType | 'all' }) => AssetRecord[]
  createAsset: (payload: CreateAssetInput) => AssetRecord[]
  updateAsset: (assetId: string, payload: UpdateAssetInput) => AssetRecord
  assignAssets: (assetIds: string[], payload: AssignPayload) => void
}

const AssetContext = createContext<AssetContextValue | null>(null)

export function AssetProvider({ children }: PropsWithChildren) {
  const [assets, setAssets] = useState<AssetRecord[]>(initialAssets)

  const value = useMemo<AssetContextValue>(
    () => ({
      assets,
      getAssetById: (assetId) => assets.find((asset) => asset.id === assetId),
      listAssets: (filters) =>
        filterAssetsByCategoryType(assets, filters?.categoryType ?? 'all'),
      createAsset: (payload) => {
        const { assetType, category } = validateCreateAssetPayload(payload)
        const baseSequence = nextSequenceForType(assets, assetType.id, payload.purchaseDate)
        const createdAssets = Array.from({ length: payload.quantity }, (_, index) => {
          const sequence = baseSequence + index

          return {
            id: crypto.randomUUID(),
            assetCode: buildAssetCode(assetType, payload.purchaseDate, sequence),
            name: payload.name.trim(),
            categoryType: category.categoryType,
            categoryId: category.id,
            categoryName: category.name,
            assetTypeId: assetType.id,
            assetTypeName: assetType.name,
            status: payload.status,
            purchasePrice: payload.purchasePrice,
            purchaseDate: payload.purchaseDate,
            warrantyDate: payload.warrantyDate,
            returnDate: undefined,
            attributes: { ...payload.attributes },
            history: [
              {
                id: crypto.randomUUID(),
                action: 'created' as const,
                date: payload.purchaseDate,
                actor: 'Omborchi',
                note:
                  payload.quantity > 1
                    ? `${assetType.name} omborga qabul qilindi. Batch size: ${payload.quantity}.`
                    : `${assetType.name} omborga qabul qilindi.`,
              },
            ],
          }
        })

        setAssets((current) => [...createdAssets.reverse(), ...current])
        return createdAssets
      },
      updateAsset: (assetId, payload) => {
        const existingAsset = assets.find((asset) => asset.id === assetId)

        if (!existingAsset) {
          throw new Error('Asset topilmadi.')
        }

        const { assetType, category } = validateUpdateAssetPayload(payload)
        const typeChanged =
          existingAsset.assetTypeId !== assetType.id ||
          existingAsset.purchaseDate !== payload.purchaseDate
        const assetCode = typeChanged
          ? buildAssetCode(
              assetType,
              payload.purchaseDate,
              nextSequenceForType(
                assets.filter((asset) => asset.id !== assetId),
                assetType.id,
                payload.purchaseDate,
              ),
            )
          : existingAsset.assetCode

        const updatedAsset: AssetRecord = {
          ...existingAsset,
          assetCode,
          name: payload.name.trim(),
          categoryType: category.categoryType,
          categoryId: category.id,
          categoryName: category.name,
          assetTypeId: assetType.id,
          assetTypeName: assetType.name,
          status: payload.status,
          purchasePrice: payload.purchasePrice,
          purchaseDate: payload.purchaseDate,
          warrantyDate: payload.warrantyDate,
          returnDate: existingAsset.returnDate,
          attributes: payload.attributes,
        }

        setAssets((current) =>
          current.map((asset) => (asset.id === assetId ? updatedAsset : asset)),
        )

        return updatedAsset
      },
      assignAssets: (assetIds, payload) => {
        const department = departments.find((item) => item.id === payload.departmentId)

        if (!department) {
          return
        }

        setAssets((current) =>
          current.map((asset) => {
            if (!assetIds.includes(asset.id)) {
              return asset
            }

            return {
              ...asset,
              status: 'assigned',
              departmentId: department.id,
              departmentName: department.name,
              returnDate: payload.returnDate,
              history: [
                {
                  id: crypto.randomUUID(),
                  action: 'assigned',
                  date: payload.date,
                  actor: payload.employee,
                  note:
                    payload.note ||
                    `${department.name} bo'limiga topshirildi.${payload.returnDate ? ` Qaytarilgan sana: ${payload.returnDate}.` : ''}`,
                  departmentId: department.id,
                  departmentName: department.name,
                  returnDate: payload.returnDate,
                },
                ...asset.history,
              ],
            }
          }),
        )
      },
    }),
    [assets],
  )

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>
}

export const useAssetStore = () => {
  const context = useContext(AssetContext)

  if (!context) {
    throw new Error('useAssetStore must be used within AssetProvider')
  }

  return context
}
