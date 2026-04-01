export type Status = 'available' | 'assigned' | 'maintenance' | 'broken'

export type AttributeType = 'text' | 'number' | 'date' | 'select' | 'textarea'

export type AssetAttribute = {
  id: string
  name: string
  label: string
  type: AttributeType
  required: boolean
  options?: string[]
}

export type CategoryDefinition = {
  id: string
  name: string
  description: string
}

export type AssetTypeDefinition = {
  id: string
  code: string
  name: string
  categoryId: string
  categoryName: string
  description: string
  count: number
  attributes: AssetAttribute[]
}

export type Department = {
  id: string
  name: string
}

export type AssetHistory = {
  id: string
  action: 'created' | 'assigned'
  date: string
  actor: string
  note: string
  departmentId?: string
  departmentName?: string
}

export type AssetRecord = {
  id: string
  assetCode: string
  name: string
  categoryId: string
  categoryName: string
  assetTypeId: string
  assetTypeName: string
  status: Status
  purchaseDate: string
  warrantyDate: string
  departmentId?: string
  departmentName?: string
  attributes: Record<string, string>
  history: AssetHistory[]
}

export type CreateAssetInput = {
  name: string
  categoryId: string
  assetTypeId: string
  purchaseDate: string
  warrantyDate: string
  status: Status
  attributes: Record<string, string>
}

export type AssignPayload = {
  departmentId: string
  date: string
  employee: string
  note: string
}
