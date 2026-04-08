export type Status = 'available' | 'assigned' | 'maintenance' | 'broken'

export type AttributeType = 'text' | 'number' | 'date' | 'select' | 'textarea'

export type CategoryType = 'HARDWARE' | 'SOFTWARE' | 'NON_IT'

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
  englishLabel: string
  description: string
  categoryType: CategoryType
}

export type AssetTypeDefinition = {
  id: string
  code: string
  name: string
  categoryId: string
  categoryName: string
  categoryType: CategoryType
  description: string
  seedCount: number
  defaultPrice: number
  allowedAgents: string[]
  attributes: AssetAttribute[]
}

export type SecurityInstallStatus = 'PENDING' | 'INSTALLED' | 'FAILED'

export type SecurityAgentState = {
  agent: string
  status: SecurityInstallStatus
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
  returnDate?: string
}

export type AssetRecord = {
  id: string
  assetCode: string
  name: string
  categoryType: CategoryType
  categoryId: string
  categoryName: string
  assetTypeId: string
  assetTypeName: string
  status: Status
  purchasePrice: number
  expectedPrice?: number
  actualPrice?: number
  requestId?: string
  purchaseDate: string
  warrantyDate: string
  departmentId?: string
  departmentName?: string
  returnDate?: string
  attributes: Record<string, string>
  securityStatuses: SecurityAgentState[]
  history: AssetHistory[]
}

export type CreateAssetInput = {
  name: string
  categoryType: CategoryType
  categoryId: string
  assetTypeId: string
  requestId?: string
  requestItemId?: string
  quantity: number
  expectedPrice?: number
  actualPrice?: number
  purchasePrice: number
  purchaseDate: string
  warrantyDate: string
  status: Status
  attributes: Record<string, string>
}

export type UpdateAssetInput = Omit<CreateAssetInput, 'quantity'>

export type AssignPayload = {
  departmentId: string
  date: string
  employee: string
  note: string
  returnDate?: string
}

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type ReportPreset = {
  id: ReportPeriod
  label: string
  description: string
}
