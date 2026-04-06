import type {
  AgentCode,
  AgentStatusRecord,
  Asset,
  AssetReadiness,
  AssetType,
  MockData,
  Role,
  User,
} from './types'

export function getAssetType(asset: Asset, assetTypes: AssetType[]) {
  return assetTypes.find((item) => item.name === asset.type)
}

export function getAllowedAgents(asset: Asset, assetTypes: AssetType[]) {
  return getAssetType(asset, assetTypes)?.allowedAgents ?? []
}

export function getAssetAgentStatuses(
  assetId: string,
  agentStatuses: AgentStatusRecord[],
  assetTypes: AssetType[],
  asset?: Asset,
) {
  if (!asset) {
    return []
  }

  return getAllowedAgents(asset, assetTypes).map((agent) => ({
    agent,
    status:
      agentStatuses.find((record) => record.assetId === assetId && record.agent === agent)?.status ??
      'PENDING',
  }))
}

export function getAssetReadiness(
  asset: Asset,
  assetTypes: AssetType[],
  agentStatuses: AgentStatusRecord[],
): AssetReadiness {
  const allowed = getAllowedAgents(asset, assetTypes)

  if (allowed.length === 0) {
    return 'READY'
  }

  const installed = new Set(
    agentStatuses
      .filter((record) => record.assetId === asset.id && record.status === 'INSTALLED')
      .map((record) => record.agent),
  )

  return allowed.every((agent) => installed.has(agent)) ? 'READY' : 'NOT_READY'
}

export function canInstallAgent(
  asset: Asset,
  agent: AgentCode,
  assetTypes: AssetType[],
  actor: User | null,
) {
  if (!actor || actor.role !== 'IT_SPECIALIST') {
    return false
  }

  if (asset.currentAssigneeId !== actor.id || asset.currentStage !== 'IT_SPECIALIST') {
    return false
  }

  return getAllowedAgents(asset, assetTypes).includes(agent)
}

export function usersByRole(users: User[], role: Role) {
  return users.filter((user) => user.role === role)
}

export function buildAssetTag(assetTypeName: string, count: number) {
  const prefix = assetTypeName
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, 4)

  return `${prefix}-${String(count).padStart(4, '0')}`
}

export function assetSearchText(asset: Asset, data: MockData, assignee?: User | null) {
  const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

  return [
    asset.assetTag,
    asset.name,
    asset.type,
    asset.serialNumber,
    asset.vendor,
    asset.location,
    readiness,
    assignee?.fullName ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

export function assetSupportsIp(asset: Asset, assetTypes: AssetType[]) {
  return getAssetType(asset, assetTypes)?.fields.some((field) => field.id === 'ipAddress') ?? false
}
