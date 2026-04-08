export type Role =
  | 'ADMIN'
  | 'DIRECTOR'
  | 'WAREHOUSE_MANAGER'
  | 'ASSET_CUSTODIAN'
  | 'IT_SPECIALIST'
  | 'EMPLOYEE'

export type AgentCode =
  | 'AD'
  | 'WAF'
  | 'PAM'
  | 'EDR'
  | 'AV'
  | 'SIEM'
  | 'DLP'
  | 'MDM'
  | 'MFA'
  | 'NAC'
  | 'ZTNA'
  | 'VPN'

export type AgentStatus = 'PENDING' | 'INSTALLED' | 'FAILED'

export type WorkflowStage =
  | 'WAREHOUSE'
  | 'IT_SPECIALIST'
  | 'ASSET_CUSTODIAN'
  | 'EMPLOYEE'

export type RequestStatus = 'CREATED' | 'APPROVED' | 'PURCHASED'

export type AgentDefinition = {
  code: AgentCode
  name: string
  description: string
}

export type AssetTypeField = {
  id: string
  label: string
  type: 'text' | 'select' | 'date'
  required: boolean
  options?: string[]
}

export type AssetType = {
  id: string
  name: string
  category: string
  description: string
  allowedAgents: AgentCode[]
  fields: AssetTypeField[]
}

export type User = {
  id: string
  username: string
  password: string
  fullName: string
  role: Role
  team: string
}

export type Department = {
  id: string
  name: string
}

export type Asset = {
  id: string
  assetTag: string
  name: string
  type: string
  serialNumber: string
  vendor: string
  location: string
  procurementDate: string
  currentStage: WorkflowStage
  currentAssigneeId: string | null
  createdBy: string
  requestId?: string
  expectedPrice?: number
  actualPrice?: number
  metadata: Record<string, string>
}

export type RequestItem = {
  id: string
  name: string
  quantity: number
  specs: string
  expectedPrice: number
  fulfilledQuantity?: number
}

export type Request = {
  id: string
  title: string
  createdBy: string
  status: RequestStatus
  items: RequestItem[]
  approvedBy?: string
  fileUrl?: string
  note?: string
  reviewedByAdminAt?: string
  approvedAt?: string
  purchasedAt?: string
}

export type AgentStatusRecord = {
  assetId: string
  agent: AgentCode
  status: AgentStatus
  updatedAt: string
  updatedBy: string
}

export type AssignmentRecord = {
  id: string
  assetId: string
  action:
    | 'CREATED'
    | 'ASSIGNED_TO_IT'
    | 'ASSIGNED_TO_CUSTODIAN'
    | 'FORWARDED_TO_CUSTODIAN'
    | 'TAKEN_BY_CUSTODIAN'
    | 'ASSIGNED_TO_EMPLOYEE'
    | 'RETURNED_TO_WAREHOUSE'
  fromUserId: string | null
  toUserId: string | null
  fromRole: Role | null
  toRole: Role | null
  note: string
  createdAt: string
  effectiveDate?: string
  departmentId?: string
  departmentName?: string
  returnDate?: string
  ipAddress?: string
}

export type MockData = {
  seedVersion?: string
  roles: Role[]
  agents: AgentDefinition[]
  users: User[]
  departments?: Department[]
  assetTypes: AssetType[]
  assets: Asset[]
  requests?: Request[]
  agentStatuses: AgentStatusRecord[]
  assignments: AssignmentRecord[]
}

export type AssetReadiness = 'READY' | 'NOT_READY'
