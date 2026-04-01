import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { assetTypes, categories, departments, initialAssets } from '../data/mockData'
import type { AssetRecord, AssignPayload, CreateAssetInput } from '../types'
import { buildAssetCode, nextSequenceForType } from '../utils/asset'

type AssetContextValue = {
  assets: AssetRecord[]
  createAsset: (payload: CreateAssetInput) => AssetRecord
  assignAssets: (assetIds: string[], payload: AssignPayload) => void
}

const AssetContext = createContext<AssetContextValue | null>(null)

export function AssetProvider({ children }: PropsWithChildren) {
  const [assets, setAssets] = useState<AssetRecord[]>(initialAssets)

  const value = useMemo<AssetContextValue>(
    () => ({
      assets,
      createAsset: (payload) => {
        const assetType = assetTypes.find((item) => item.id === payload.assetTypeId)
        const category = categories.find((item) => item.id === payload.categoryId)

        if (!assetType || !category) {
          throw new Error('Invalid category or asset type')
        }

        const sequence = nextSequenceForType(assets, assetType.id, payload.purchaseDate)
        const assetCode = buildAssetCode(assetType, payload.purchaseDate, sequence)
        const createdAsset: AssetRecord = {
          id: crypto.randomUUID(),
          assetCode,
          name: payload.name.trim(),
          categoryId: category.id,
          categoryName: category.name,
          assetTypeId: assetType.id,
          assetTypeName: assetType.name,
          status: payload.status,
          purchaseDate: payload.purchaseDate,
          warrantyDate: payload.warrantyDate,
          attributes: payload.attributes,
          history: [
            {
              id: crypto.randomUUID(),
              action: 'created',
              date: payload.purchaseDate,
              actor: 'Omborchi',
              note: `${assetType.name} omborga qabul qilindi.`,
            },
          ],
        }

        setAssets((current) => [createdAsset, ...current])
        return createdAsset
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
              history: [
                {
                  id: crypto.randomUUID(),
                  action: 'assigned',
                  date: payload.date,
                  actor: payload.employee,
                  note: payload.note || `${department.name} bo'limiga topshirildi.`,
                  departmentId: department.id,
                  departmentName: department.name,
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
