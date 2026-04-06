/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useToast } from '../components/ui/ToastProvider'
import {
  assetSupportsIp,
  buildAssetTag,
  canInstallAgent,
  getAllowedAgents,
  getAssetReadiness,
  usersByRole,
} from '../domain/rules'
import type {
  AgentCode,
  AgentStatus,
  Asset,
  AssetType,
  MockData,
  Role,
  User,
  WorkflowStage,
} from '../domain/types'

type CreateAssetInput = {
  name: string
  type: string
  serialNumber: string
  vendor: string
  location: string
  procurementDate: string
  metadata: Record<string, string>
}

type AppStoreValue = {
  data: MockData | null
  currentUser: User | null
  isBootstrapping: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  getUserById: (userId: string | null) => User | null
  getUsersByRole: (role: Role) => User[]
  createAsset: (payload: CreateAssetInput) => void
  assignFromWarehouse: (assetId: string, targetUserId: string) => void
  updateAgentStatus: (assetId: string, agent: AgentCode, status: AgentStatus) => void
  forwardToCustodian: (assetId: string, targetUserId: string) => void
  takeAssetAsCustodian: (assetId: string) => void
  assignToEmployee: (assetId: string, targetUserId: string, ipAddress?: string) => void
  returnToWarehouse: (assetId: string) => void
}

const STORAGE_KEY = 'asset-management-system-state'
const SESSION_KEY = 'asset-management-system-session'

const AppStoreContext = createContext<AppStoreValue | null>(null)

function appendAssignment(
  data: MockData,
  assetId: string,
  action: MockData['assignments'][number]['action'],
  fromUserId: string | null,
  toUserId: string | null,
  fromRole: Role | null,
  toRole: Role | null,
  note: string,
) {
  data.assignments.unshift({
    id: crypto.randomUUID(),
    assetId,
    action,
    fromUserId,
    toUserId,
    fromRole,
    toRole,
    note,
    createdAt: new Date().toISOString(),
  })
}

function updateAssetStage(
  data: MockData,
  assetId: string,
  nextStage: WorkflowStage,
  nextAssigneeId: string | null,
) {
  data.assets = data.assets.map((asset) =>
    asset.id === assetId
      ? { ...asset, currentStage: nextStage, currentAssigneeId: nextAssigneeId }
      : asset,
  )
}

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<MockData | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const { pushToast } = useToast()

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const response = await fetch('/mockdata.json')
      const seedData = (await response.json()) as MockData
      const persistedRaw = localStorage.getItem(STORAGE_KEY)
      const persistedData = persistedRaw ? (JSON.parse(persistedRaw) as MockData) : null
      const nextData =
        persistedData && persistedData.seedVersion === seedData.seedVersion
          ? persistedData
          : seedData
      const sessionUserId = localStorage.getItem(SESSION_KEY)
      const nextUser = sessionUserId
        ? nextData.users.find((user) => user.id === sessionUserId) ?? null
        : null

      if (!isMounted) {
        return
      }

      setData(nextData)
      setCurrentUser(nextUser)
      setIsBootstrapping(false)
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, currentUser.id)
      return
    }

    localStorage.removeItem(SESSION_KEY)
  }, [currentUser])

  const value = useMemo<AppStoreValue>(
    () => ({
      data,
      currentUser,
      isBootstrapping,
      login: (username, password) => {
        if (!data) {
          return false
        }

        const matched = data.users.find(
          (user) => user.username === username.trim() && user.password === password,
        )

        if (!matched) {
          pushToast({ title: 'Login failed', description: 'Invalid username or password.', tone: 'danger' })
          return false
        }

        setCurrentUser(matched)
        pushToast({
          title: `Welcome back, ${matched.fullName.split(' ')[0]}`,
          description: `${matched.role.replaceAll('_', ' ')} workspace loaded.`,
          tone: 'success',
        })
        return true
      },
      logout: () => {
        setCurrentUser(null)
        pushToast({
          title: 'Signed out',
          description: 'Your mock enterprise session has been cleared.',
          tone: 'info',
        })
      },
      getUserById: (userId) => data?.users.find((user) => user.id === userId) ?? null,
      getUsersByRole: (role) => (data ? usersByRole(data.users, role) : []),
      createAsset: (payload) => {
        if (!data || !currentUser || currentUser.role !== 'WAREHOUSE_MANAGER') {
          return
        }

        const assetType = data.assetTypes.find((item) => item.name === payload.type)

        if (!assetType) {
          pushToast({ title: 'Unknown asset type', description: 'Select a valid asset type.', tone: 'danger' })
          return
        }

        const nextData = structuredClone(data)
        const createdAsset: Asset = {
          id: crypto.randomUUID(),
          assetTag: buildAssetTag(assetType.name, nextData.assets.length + 1),
          name: payload.name.trim(),
          type: payload.type,
          serialNumber: payload.serialNumber.trim(),
          vendor: payload.vendor.trim(),
          location: payload.location.trim(),
          procurementDate: payload.procurementDate,
          currentStage: 'WAREHOUSE',
          currentAssigneeId: currentUser.id,
          createdBy: currentUser.id,
          metadata: payload.metadata,
        }

        nextData.assets.unshift(createdAsset)
        assetType.allowedAgents.forEach((agent) => {
          nextData.agentStatuses.push({
            assetId: createdAsset.id,
            agent,
            status: 'PENDING',
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.id,
          })
        })

        appendAssignment(
          nextData,
          createdAsset.id,
          'CREATED',
          null,
          currentUser.id,
          null,
          currentUser.role,
          `Asset created in warehouse with ${assetType.allowedAgents.length} required agents.`,
        )

        setData(nextData)
        pushToast({
          title: 'Asset created',
          description: `${createdAsset.assetTag} is now waiting in the warehouse queue.`,
          tone: 'success',
        })
      },
      assignFromWarehouse: (assetId, targetUserId) => {
        if (!data || !currentUser || currentUser.role !== 'WAREHOUSE_MANAGER') {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)
        const target = data.users.find((item) => item.id === targetUserId)

        if (!asset || !target || asset.currentStage !== 'WAREHOUSE') {
          return
        }

        const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

        if (target.role === 'ASSET_CUSTODIAN' && readiness !== 'READY') {
          pushToast({
            title: 'Custodian handoff blocked',
            description: 'Warehouse can only send READY assets to custodians.',
            tone: 'danger',
          })
          return
        }

        if (!['IT_SPECIALIST', 'ASSET_CUSTODIAN'].includes(target.role)) {
          pushToast({
            title: 'Invalid handoff',
            description: 'Warehouse can only assign assets to IT or Asset Custodian.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        updateAssetStage(
          nextData,
          assetId,
          target.role === 'IT_SPECIALIST' ? 'IT_SPECIALIST' : 'ASSET_CUSTODIAN',
          target.id,
        )
        appendAssignment(
          nextData,
          assetId,
          target.role === 'IT_SPECIALIST' ? 'ASSIGNED_TO_IT' : 'ASSIGNED_TO_CUSTODIAN',
          currentUser.id,
          target.id,
          currentUser.role,
          target.role,
          `${asset.assetTag} sent from warehouse to ${target.fullName}.`,
        )
        setData(nextData)
        pushToast({
          title: 'Assignment saved',
          description: `${asset.assetTag} is now with ${target.fullName}.`,
          tone: 'success',
        })
      },
      updateAgentStatus: (assetId, agent, status) => {
        if (!data) {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)

        if (!asset || !canInstallAgent(asset, agent, data.assetTypes, currentUser)) {
          pushToast({
            title: 'Agent action blocked',
            description: 'Only the assigned IT specialist can update allowed agents.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        const allowedAgents = getAllowedAgents(asset, nextData.assetTypes)

        if (!allowedAgents.includes(agent)) {
          pushToast({
            title: 'Invalid agent',
            description: 'This asset type does not allow that security agent.',
            tone: 'danger',
          })
          return
        }

        const existing = nextData.agentStatuses.find(
          (record) => record.assetId === assetId && record.agent === agent,
        )

        if (existing) {
          existing.status = status
          existing.updatedAt = new Date().toISOString()
          existing.updatedBy = currentUser!.id
        } else {
          nextData.agentStatuses.push({
            assetId,
            agent,
            status,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser!.id,
          })
        }

        setData(nextData)
        pushToast({
          title: `${agent} updated`,
          description: `${asset.assetTag} is now marked ${status}.`,
          tone: status === 'FAILED' ? 'warning' : 'success',
        })
      },
      forwardToCustodian: (assetId, targetUserId) => {
        if (!data || !currentUser || currentUser.role !== 'IT_SPECIALIST') {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)
        const target = data.users.find((item) => item.id === targetUserId)

        if (
          !asset ||
          !target ||
          target.role !== 'ASSET_CUSTODIAN' ||
          asset.currentStage !== 'IT_SPECIALIST' ||
          asset.currentAssigneeId !== currentUser.id
        ) {
          return
        }

        const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

        if (readiness !== 'READY') {
          pushToast({
            title: 'Forward blocked',
            description: 'All allowed agents must be INSTALLED before handoff.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        updateAssetStage(nextData, assetId, 'ASSET_CUSTODIAN', target.id)
        appendAssignment(
          nextData,
          assetId,
          'FORWARDED_TO_CUSTODIAN',
          currentUser.id,
          target.id,
          currentUser.role,
          target.role,
          `${asset.assetTag} is ready and forwarded to the custodian queue.`,
        )
        setData(nextData)
        pushToast({
          title: 'Asset forwarded',
          description: `${asset.assetTag} is now awaiting custodian intake.`,
          tone: 'success',
        })
      },
      takeAssetAsCustodian: (assetId) => {
        if (!data || !currentUser || currentUser.role !== 'ASSET_CUSTODIAN') {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)

        if (
          !asset ||
          asset.currentStage !== 'ASSET_CUSTODIAN' ||
          asset.currentAssigneeId !== currentUser.id
        ) {
          return
        }

        const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

        if (readiness !== 'READY') {
          pushToast({
            title: 'Take blocked',
            description: 'Custodians can only take READY assets.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        appendAssignment(
          nextData,
          assetId,
          'TAKEN_BY_CUSTODIAN',
          currentUser.id,
          currentUser.id,
          currentUser.role,
          currentUser.role,
          `${asset.assetTag} taken into custodian control.`,
        )
        setData(nextData)
        pushToast({
          title: 'Asset accepted',
          description: `${asset.assetTag} is now ready for employee allocation.`,
          tone: 'success',
        })
      },
      assignToEmployee: (assetId, targetUserId, ipAddress) => {
        if (!data || !currentUser || currentUser.role !== 'ASSET_CUSTODIAN') {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)
        const target = data.users.find((item) => item.id === targetUserId)

        if (
          !asset ||
          !target ||
          target.role !== 'EMPLOYEE' ||
          asset.currentStage !== 'ASSET_CUSTODIAN' ||
          asset.currentAssigneeId !== currentUser.id
        ) {
          return
        }

        const readiness = getAssetReadiness(asset, data.assetTypes, data.agentStatuses)

        if (readiness !== 'READY') {
          pushToast({
            title: 'Employee assignment blocked',
            description: 'Only READY assets can be assigned to employees.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        const supportsIp = assetSupportsIp(asset, nextData.assetTypes)
        nextData.assets = nextData.assets.map((item) =>
          item.id === assetId
            ? {
                ...item,
                currentStage: 'EMPLOYEE',
                currentAssigneeId: target.id,
                metadata:
                  supportsIp && ipAddress
                    ? { ...item.metadata, ipAddress }
                    : item.metadata,
              }
            : item,
        )
        appendAssignment(
          nextData,
          assetId,
          'ASSIGNED_TO_EMPLOYEE',
          currentUser.id,
          target.id,
          currentUser.role,
          target.role,
          `${asset.assetTag} allocated to ${target.fullName}.`,
        )
        if (supportsIp && ipAddress) {
          nextData.assignments[0].ipAddress = ipAddress
        }
        setData(nextData)
        pushToast({
          title: 'Employee assigned',
          description: `${asset.assetTag} is now in employee custody.`,
          tone: 'success',
        })
      },
      returnToWarehouse: (assetId) => {
        if (!data || !currentUser || currentUser.role !== 'ASSET_CUSTODIAN') {
          return
        }

        const asset = data.assets.find((item) => item.id === assetId)
        const warehouseOwner = data.users.find((user) => user.role === 'WAREHOUSE_MANAGER')

        if (
          !asset ||
          !warehouseOwner ||
          asset.currentStage !== 'ASSET_CUSTODIAN' ||
          asset.currentAssigneeId !== currentUser.id
        ) {
          return
        }

        const nextData = structuredClone(data)
        updateAssetStage(nextData, assetId, 'WAREHOUSE', warehouseOwner.id)
        appendAssignment(
          nextData,
          assetId,
          'RETURNED_TO_WAREHOUSE',
          currentUser.id,
          warehouseOwner.id,
          currentUser.role,
          warehouseOwner.role,
          `${asset.assetTag} returned to warehouse inventory.`,
        )
        setData(nextData)
        pushToast({
          title: 'Returned to warehouse',
          description: `${asset.assetTag} is back in the warehouse queue.`,
          tone: 'warning',
        })
      },
    }),
    [currentUser, data, isBootstrapping, pushToast],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)

  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider')
  }

  return context
}

export function useAssetTypeOptions(assetTypes: AssetType[] | undefined) {
  return useMemo(
    () =>
      (assetTypes ?? []).map((type) => ({
        label: `${type.name} - ${type.category}`,
        value: type.name,
      })),
    [assetTypes],
  )
}
