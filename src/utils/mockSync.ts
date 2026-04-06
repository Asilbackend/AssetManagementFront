import { assetTypes as legacyAssetTypes, categories as legacyCategories, departments as legacyDepartments, initialAssets } from '../data/mockData'
import type { AssetRecord, AssetTypeDefinition, CategoryType as LegacyCategoryType } from '../types'
import type {
  AgentStatusRecord,
  Asset,
  AssetType,
  AssignmentRecord,
  Department,
  MockData,
  User,
} from '../domain/types'

const META_KEYS = {
  categoryType: '__legacyCategoryType',
  categoryId: '__legacyCategoryId',
  categoryName: '__legacyCategoryName',
  assetTypeId: '__legacyAssetTypeId',
  purchasePrice: '__legacyPurchasePrice',
  warrantyDate: '__legacyWarrantyDate',
  status: '__legacyStatus',
}

function mapLegacyCategoryTypeToDomain(categoryType: LegacyCategoryType) {
  switch (categoryType) {
    case 'SOFTWARE':
      return 'Application'
    case 'NON_IT':
      return 'Facility'
    case 'HARDWARE':
    default:
      return 'Endpoint'
  }
}

function mapLegacyFieldType(fieldType: AssetTypeDefinition['attributes'][number]['type']) {
  if (fieldType === 'select' || fieldType === 'date') {
    return fieldType
  }

  return 'text'
}

export function getLegacyDepartments(): Department[] {
  return legacyDepartments.map((department) => ({ ...department }))
}

export function convertLegacyAssetTypes(): AssetType[] {
  return legacyAssetTypes.map((assetType) => ({
    id: `legacy-${assetType.id}`,
    name: assetType.name,
    category: mapLegacyCategoryTypeToDomain(assetType.categoryType),
    description: assetType.description,
    allowedAgents: assetType.allowedAgents.filter(Boolean) as AssetType['allowedAgents'],
    fields: assetType.attributes.map((field) => ({
      id: field.name,
      label: field.label,
      type: mapLegacyFieldType(field.type),
      required: field.required,
      options: field.options,
    })),
  }))
}

function buildLegacyMetadata(asset: AssetRecord) {
  return {
    ...asset.attributes,
    [META_KEYS.categoryType]: asset.categoryType,
    [META_KEYS.categoryId]: asset.categoryId,
    [META_KEYS.categoryName]: asset.categoryName,
    [META_KEYS.assetTypeId]: asset.assetTypeId,
    [META_KEYS.purchasePrice]: String(asset.purchasePrice),
    [META_KEYS.warrantyDate]: asset.warrantyDate,
    [META_KEYS.status]: asset.status,
  }
}

function pickAssignedUser(users: User[], seed: number) {
  const employees = users.filter((user) => user.role === 'EMPLOYEE')
  return employees[seed % Math.max(employees.length, 1)] ?? null
}

export function convertLegacyAssets(users: User[]): Asset[] {
  const warehouseUser = users.find((user) => user.role === 'WAREHOUSE_MANAGER')

  return initialAssets.map((asset, index) => {
    const assignedUser = pickAssignedUser(users, index)
    const currentStage = asset.status === 'assigned' && assignedUser ? 'EMPLOYEE' : 'WAREHOUSE'
    const currentAssigneeId =
      currentStage === 'EMPLOYEE' ? assignedUser?.id ?? warehouseUser?.id ?? null : warehouseUser?.id ?? null

    return {
      id: `legacy-${asset.id}`,
      assetTag: asset.assetCode,
      name: asset.name,
      type: asset.assetTypeName,
      serialNumber: asset.attributes.serialNumber ?? `${asset.assetTypeId}-${index + 1}`,
      vendor: asset.attributes.vendor ?? 'Legacy Vendor',
      location: asset.attributes.location ?? asset.departmentName ?? 'Warehouse',
      procurementDate: asset.purchaseDate,
      currentStage,
      currentAssigneeId,
      createdBy: warehouseUser?.id ?? 'user-wh-1',
      metadata: buildLegacyMetadata(asset),
    }
  })
}

export function convertLegacyAgentStatuses(): AgentStatusRecord[] {
  return initialAssets.flatMap((asset) =>
    asset.securityStatuses.map((status) => ({
      assetId: `legacy-${asset.id}`,
      agent: status.agent as AgentStatusRecord['agent'],
      status: status.status,
      updatedAt: `${asset.purchaseDate}T09:00:00.000Z`,
      updatedBy: 'user-wh-1',
    })),
  )
}

export function convertLegacyAssignments(users: User[]): AssignmentRecord[] {
  const warehouseUser = users.find((user) => user.role === 'WAREHOUSE_MANAGER')

  return initialAssets.flatMap((asset, index) => {
    const assignedUser = pickAssignedUser(users, index)
    const records: AssignmentRecord[] = [
      {
        id: `legacy-${asset.id}-created`,
        assetId: `legacy-${asset.id}`,
        action: 'CREATED',
        fromUserId: null,
        toUserId: warehouseUser?.id ?? null,
        fromRole: null,
        toRole: 'WAREHOUSE_MANAGER',
        note: 'Legacy warehouse asset imported into synchronized mock data.',
        createdAt: `${asset.purchaseDate}T08:00:00.000Z`,
        effectiveDate: asset.purchaseDate,
      },
    ]

    if (asset.status === 'assigned' && assignedUser) {
      records.unshift({
        id: `legacy-${asset.id}-assigned`,
        assetId: `legacy-${asset.id}`,
        action: 'ASSIGNED_TO_EMPLOYEE',
        fromUserId: warehouseUser?.id ?? null,
        toUserId: assignedUser.id,
        fromRole: 'WAREHOUSE_MANAGER',
        toRole: 'EMPLOYEE',
        note: asset.history[0]?.note ?? `${assignedUser.fullName} ga biriktirilgan.`,
        createdAt: `${asset.purchaseDate}T11:00:00.000Z`,
        effectiveDate: asset.history[0]?.date ?? asset.purchaseDate,
        departmentId: asset.departmentId,
        departmentName: asset.departmentName,
        returnDate: asset.returnDate,
      })
    }

    return records
  })
}

export function enrichMockData(seedData: MockData): MockData {
  const departments = seedData.departments?.length ? seedData.departments : getLegacyDepartments()
  const legacyTypes = convertLegacyAssetTypes()
  const legacyAssets = convertLegacyAssets(seedData.users)
  const legacyAgentStatuses = convertLegacyAgentStatuses()
  const legacyAssignments = convertLegacyAssignments(seedData.users)

  return {
    ...seedData,
    departments,
    assetTypes: [
      ...seedData.assetTypes,
      ...legacyTypes.filter(
        (legacyType) => !seedData.assetTypes.some((assetType) => assetType.name === legacyType.name),
      ),
    ],
    assets: [
      ...seedData.assets,
      ...legacyAssets.filter((legacyAsset) => !seedData.assets.some((asset) => asset.id === legacyAsset.id)),
    ],
    agentStatuses: [
      ...seedData.agentStatuses,
      ...legacyAgentStatuses.filter(
        (legacyStatus) =>
          !seedData.agentStatuses.some(
            (status) => status.assetId === legacyStatus.assetId && status.agent === legacyStatus.agent,
          ),
      ),
    ],
    assignments: [
      ...seedData.assignments,
      ...legacyAssignments.filter(
        (legacyAssignment) =>
          !seedData.assignments.some((assignment) => assignment.id === legacyAssignment.id),
      ),
    ],
  }
}

export function readLegacyCategoryType(asset: Asset): LegacyCategoryType {
  const categoryType = asset.metadata[META_KEYS.categoryType]

  if (categoryType === 'HARDWARE' || categoryType === 'SOFTWARE' || categoryType === 'NON_IT') {
    return categoryType
  }

  return asset.type.toLowerCase().includes('app') ? 'SOFTWARE' : 'HARDWARE'
}

export function readLegacyCategoryId(asset: Asset, assetType?: AssetTypeDefinition) {
  return asset.metadata[META_KEYS.categoryId] ?? assetType?.categoryId ?? 'legacy-category'
}

export function readLegacyCategoryName(asset: Asset, assetType?: AssetTypeDefinition) {
  return asset.metadata[META_KEYS.categoryName] ?? assetType?.categoryName ?? 'Legacy'
}

export function readLegacyAssetTypeId(asset: Asset, assetType?: AssetTypeDefinition) {
  return asset.metadata[META_KEYS.assetTypeId] ?? assetType?.id ?? asset.type.toLowerCase()
}

export function readLegacyPurchasePrice(asset: Asset, assetType?: AssetTypeDefinition) {
  const value = Number(asset.metadata[META_KEYS.purchasePrice] ?? assetType?.defaultPrice ?? 0)
  return Number.isFinite(value) ? value : 0
}

export function readLegacyWarrantyDate(asset: Asset) {
  return asset.metadata[META_KEYS.warrantyDate] ?? asset.procurementDate
}

export function readLegacyStatus(asset: Asset) {
  const status = asset.metadata[META_KEYS.status]

  if (status === 'available' || status === 'assigned' || status === 'maintenance' || status === 'broken') {
    return status
  }

  return asset.currentStage === 'WAREHOUSE' ? 'available' : 'assigned'
}

export function findLegacyAssetTypeByName(typeName: string) {
  return legacyAssetTypes.find((assetType) => assetType.name === typeName)
}

export function findLegacyAssetTypeById(assetTypeId: string) {
  return legacyAssetTypes.find((assetType) => assetType.id === assetTypeId)
}

export function findLegacyCategory(categoryId: string) {
  return legacyCategories.find((category) => category.id === categoryId)
}

export function buildLegacyMetadataForCreate(payload: {
  categoryType: LegacyCategoryType
  categoryId: string
  categoryName: string
  assetTypeId: string
  purchasePrice: number
  warrantyDate: string
  status: string
  attributes: Record<string, string>
}) {
  return {
    ...payload.attributes,
    [META_KEYS.categoryType]: payload.categoryType,
    [META_KEYS.categoryId]: payload.categoryId,
    [META_KEYS.categoryName]: payload.categoryName,
    [META_KEYS.assetTypeId]: payload.assetTypeId,
    [META_KEYS.purchasePrice]: String(payload.purchasePrice),
    [META_KEYS.warrantyDate]: payload.warrantyDate,
    [META_KEYS.status]: payload.status,
  }
}

export function mergeLegacyMetadata(
  currentMetadata: Record<string, string>,
  nextValues: Partial<ReturnType<typeof buildLegacyMetadataForCreate>>,
) {
  return {
    ...currentMetadata,
    ...nextValues,
  }
}
