/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import type { Asset, MockData, User } from '../domain/types'
import type {
  AssetHistory,
  AssetRecord,
  CategoryType,
  CreateAssetInput,
  UpdateAssetInput,
} from '../types'
import { useAppStore } from '../store/AppStore'
import { getAssetAgentStatuses } from '../domain/rules'
import {
  readLegacyAssetTypeId,
  readLegacyCategoryId,
  readLegacyCategoryName,
  readLegacyCategoryType,
  readLegacyPurchasePrice,
  readLegacyStatus,
  readLegacyWarrantyDate,
} from '../utils/mockSync'
import { filterAssetsByCategoryType } from '../utils/asset'

type AssetContextValue = {
  assets: AssetRecord[]
  getAssetById: (assetId: string) => AssetRecord | undefined
  listAssets: (filters?: { categoryType?: CategoryType | 'all' }) => AssetRecord[]
  createAsset: (payload: CreateAssetInput) => AssetRecord[]
  updateAsset: (assetId: string, payload: UpdateAssetInput) => AssetRecord
  assignAssets: (
    assetIds: string[],
    payload: {
      departmentId: string
      date: string
      employee: string
      note: string
      returnDate?: string
    },
  ) => void
}

const AssetContext = createContext<AssetContextValue | null>(null)

function mapAssignmentHistory(data: MockData, assetId: string, getUserById: (userId: string | null) => User | null): AssetHistory[] {
  return data.assignments
    .filter((assignment) => assignment.assetId === assetId)
    .map((assignment) => ({
      id: assignment.id,
      action: assignment.action === 'CREATED' ? 'created' : 'assigned',
      date: assignment.effectiveDate ?? assignment.createdAt.slice(0, 10),
      actor:
        getUserById(assignment.toUserId)?.fullName ??
        getUserById(assignment.fromUserId)?.fullName ??
        'System',
      note: assignment.note,
      departmentId: assignment.departmentId,
      departmentName: assignment.departmentName,
      returnDate: assignment.returnDate,
    }))
}

function toAssetRecord(data: MockData, asset: Asset, getUserById: (userId: string | null) => User | null): AssetRecord {
  const categoryType = readLegacyCategoryType(asset)

  return {
    id: asset.id,
    assetCode: asset.assetTag,
    name: asset.name,
    categoryType,
    categoryId: readLegacyCategoryId(asset),
    categoryName: readLegacyCategoryName(asset),
    assetTypeId: readLegacyAssetTypeId(asset),
    assetTypeName: asset.type,
    status: readLegacyStatus(asset),
    purchasePrice: readLegacyPurchasePrice(asset),
    purchaseDate: asset.procurementDate,
    warrantyDate: readLegacyWarrantyDate(asset),
    departmentId: data.assignments.find((assignment) => assignment.assetId === asset.id)?.departmentId,
    departmentName:
      data.assignments.find((assignment) => assignment.assetId === asset.id)?.departmentName ??
      (asset.currentStage === 'WAREHOUSE' ? undefined : getUserById(asset.currentAssigneeId)?.team),
    returnDate: data.assignments.find((assignment) => assignment.assetId === asset.id)?.returnDate,
    attributes: asset.metadata,
    securityStatuses: getAssetAgentStatuses(asset.id, data.agentStatuses, data.assetTypes, asset),
    history: mapAssignmentHistory(data, asset.id, getUserById),
  }
}

export function AssetProvider({ children }: PropsWithChildren) {
  const {
    data,
    getUserById,
    getUsersByRole,
    createLegacyAssets,
    updateLegacyAsset,
    assignAssetsFromWarehouse,
  } = useAppStore()

  const assets = useMemo(
    () => (data ? data.assets.map((asset) => toAssetRecord(data, asset, getUserById)) : []),
    [data, getUserById],
  )

  const value = useMemo<AssetContextValue>(
    () => ({
      assets,
      getAssetById: (assetId) => assets.find((asset) => asset.id === assetId),
      listAssets: (filters) =>
        filterAssetsByCategoryType(assets, filters?.categoryType ?? 'all'),
      createAsset: (payload) => {
        createLegacyAssets(payload)
        return []
      },
      updateAsset: (assetId, payload) => {
        updateLegacyAsset(assetId, payload)
        const updated = assets.find((asset) => asset.id === assetId)

        if (!updated) {
          throw new Error('Asset topilmadi.')
        }

        return updated
      },
      assignAssets: (assetIds, payload) => {
        const custodian = getUsersByRole('ASSET_CUSTODIAN').find((user) => user.id === payload.employee)

        if (!custodian) {
          throw new Error('Custodian topilmadi.')
        }

        assignAssetsFromWarehouse(assetIds, custodian.id, {
          departmentId: payload.departmentId,
          effectiveDate: payload.date,
          note: payload.note,
          returnDate: payload.returnDate,
        })
      },
    }),
    [assets, assignAssetsFromWarehouse, createLegacyAssets, getUsersByRole, updateLegacyAsset],
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
