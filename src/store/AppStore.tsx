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
import type {
  CreateAssetInput as LegacyCreateAssetInput,
  UpdateAssetInput as LegacyUpdateAssetInput,
} from '../types'
import {
  assetSupportsIp,
  buildAssetTag,
  canInstallAgent,
  getAllowedAgents,
  getAssetReadiness,
  usersByRole,
} from '../domain/rules'
import {
  buildLegacyMetadataForCreate,
  enrichMockData,
  findLegacyAssetTypeById,
  findLegacyCategory,
  mergeLegacyMetadata,
} from '../utils/mockSync'
import type {
  AgentCode,
  AgentStatus,
  Asset,
  AssetType,
  AssignmentRecord,
  MockData,
  RequestItem,
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
  requestId?: string
  actualPrice?: number
  expectedPrice?: number
  metadata: Record<string, string>
}

type CreateRequestInput = {
  title: string
  fileUrl?: string
  note?: string
  items: Array<{
    name: string
    quantity: number
    specs: string
    expectedPrice: number
  }>
}

function compactMetadata(input: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
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
  createLegacyAssets: (payload: LegacyCreateAssetInput) => void
  updateLegacyAsset: (assetId: string, payload: LegacyUpdateAssetInput) => void
  createRequest: (payload: CreateRequestInput) => void
  reviewRequestAsAdmin: (requestId: string) => void
  approveRequest: (requestId: string) => void
  assignFromWarehouse: (assetId: string, targetUserId: string) => void
  assignAssetsFromWarehouse: (
    assetIds: string[],
    targetUserId: string,
    payload?: {
      departmentId?: string
      effectiveDate?: string
      note?: string
      returnDate?: string
    },
  ) => void
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
  action: AssignmentRecord['action'],
  fromUserId: string | null,
  toUserId: string | null,
  fromRole: Role | null,
  toRole: Role | null,
  note: string,
  extras?: Partial<
    Pick<
      AssignmentRecord,
      'createdAt' | 'effectiveDate' | 'departmentId' | 'departmentName' | 'returnDate' | 'ipAddress'
    >
  >,
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
    createdAt: extras?.createdAt ?? new Date().toISOString(),
    effectiveDate: extras?.effectiveDate,
    departmentId: extras?.departmentId,
    departmentName: extras?.departmentName,
    returnDate: extras?.returnDate,
    ipAddress: extras?.ipAddress,
  })
}

function toAssignmentTimestamp(value?: string) {
  if (!value) {
    return new Date().toISOString()
  }

  return `${value}T00:00:00.000Z`
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

function getRequestList(data: MockData) {
  if (!data.requests) {
    data.requests = []
  }

  return data.requests
}

function getWarehouseOwner(data: MockData) {
  return data.users.find((user) => user.role === 'WAREHOUSE_MANAGER') ?? null
}

function getDefaultItSpecialist(data: MockData) {
  return data.users.find((user) => user.role === 'IT_SPECIALIST') ?? null
}

function isSoftwareCategory(categoryType?: LegacyCreateAssetInput['categoryType']) {
  return categoryType === 'SOFTWARE'
}

function canWarehouseAssignAssetToCustodian(
  data: MockData,
  asset: Asset,
  target: User,
) {
  if (target.role !== 'ASSET_CUSTODIAN') {
    return true
  }

  if (!asset.requestId) {
    return true
  }

  const request = getRequestList(data).find((item) => item.id === asset.requestId)

  if (!request) {
    return true
  }

  const owner = data.users.find((user) => user.id === request.createdBy)

  if (!owner) {
    return true
  }

  if (owner.role === 'ADMIN') {
    return true
  }

  return owner.id === target.id
}

function updateRequestPurchaseProgress(
  data: MockData,
  requestId: string | undefined,
  requestItemId: string | undefined,
  quantity: number,
) {
  if (!requestId || !requestItemId) {
    return
  }

  const requests = getRequestList(data)
  const request = requests.find((item) => item.id === requestId)

  if (!request) {
    return
  }

  request.items = request.items.map((item) =>
    item.id === requestItemId
      ? {
          ...item,
          fulfilledQuantity: Math.min(item.quantity, (item.fulfilledQuantity ?? 0) + quantity),
        }
      : item,
  )

  if (request.items.every((item) => (item.fulfilledQuantity ?? 0) >= item.quantity)) {
    request.status = 'PURCHASED'
    request.purchasedAt = new Date().toISOString()
  }
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
      const seedData = enrichMockData((await response.json()) as MockData)
      const persistedRaw = localStorage.getItem(STORAGE_KEY)
      const persistedData = persistedRaw ? (JSON.parse(persistedRaw) as MockData) : null
      const nextData =
        persistedData && persistedData.seedVersion === seedData.seedVersion
          ? enrichMockData({
              ...seedData,
              ...persistedData,
              departments: persistedData.departments ?? seedData.departments,
              requests: persistedData.requests ?? seedData.requests,
            })
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

  const assignAssetsFromWarehouseInternal = (
    assetIds: string[],
    targetUserId: string,
    payload?: {
      departmentId?: string
      effectiveDate?: string
      note?: string
      returnDate?: string
    },
  ) => {
    if (!data || !currentUser || currentUser.role !== 'WAREHOUSE_MANAGER') {
      return
    }

    const target = data.users.find((item) => item.id === targetUserId)
    const uniqueAssetIds = Array.from(new Set(assetIds.filter(Boolean)))
    const department = payload?.departmentId
      ? data.departments?.find((item) => item.id === payload.departmentId)
      : undefined

    if (!target || uniqueAssetIds.length === 0) {
      return
    }

    if (!['IT_SPECIALIST', 'ASSET_CUSTODIAN'].includes(target.role)) {
      pushToast({
        title: 'Invalid handoff',
        description: 'Warehouse can only assign assets to IT or manager custodians.',
        tone: 'danger',
      })
      return
    }

    const nextData = structuredClone(data)
    const assignedAssets: Asset[] = []
    const blockedByOwnership: string[] = []

    uniqueAssetIds.forEach((assetId) => {
      const asset = nextData.assets.find((item) => item.id === assetId)

      if (!asset || asset.currentStage !== 'WAREHOUSE') {
        return
      }

      const readiness = getAssetReadiness(asset, nextData.assetTypes, nextData.agentStatuses)

      if (target.role === 'ASSET_CUSTODIAN' && readiness !== 'READY') {
        return
      }

      if (!canWarehouseAssignAssetToCustodian(nextData, asset, target)) {
        blockedByOwnership.push(asset.assetTag)
        return
      }

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
        payload?.note?.trim() || `${asset.assetTag} sent from warehouse to ${target.fullName}.`,
        {
          createdAt: toAssignmentTimestamp(payload?.effectiveDate),
          effectiveDate: payload?.effectiveDate,
          departmentId: department?.id,
          departmentName: department?.name,
          returnDate: payload?.returnDate,
        },
      )
      assignedAssets.push(asset)
    })

    if (assignedAssets.length === 0) {
      pushToast({
        title: 'No assets assigned',
        description:
          blockedByOwnership.length > 0
            ? `These assets can only go to the request owner: ${blockedByOwnership.join(', ')}`
            : target.role === 'ASSET_CUSTODIAN'
              ? 'Select warehouse assets that are READY and belong to the target manager.'
              : 'Select valid warehouse assets before sending them to IT.',
        tone: 'danger',
      })
      return
    }

    setData(nextData)
    pushToast({
      title: 'Assignment saved',
      description:
        assignedAssets.length === 1
          ? `${assignedAssets[0].assetTag} is now with ${target.fullName}.`
          : `${assignedAssets.length} assets are now with ${target.fullName}.`,
      tone: 'success',
    })
  }

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
        if (!data || !currentUser || currentUser.role !== 'ADMIN') {
          return
        }

        const assetType = data.assetTypes.find((item) => item.name === payload.type)

        if (!assetType) {
          pushToast({ title: 'Unknown asset type', description: 'Select a valid asset type.', tone: 'danger' })
          return
        }

        const nextData = structuredClone(data)
        const warehouseOwner = getWarehouseOwner(nextData)
        const defaultIt = getDefaultItSpecialist(nextData)
        const category = assetType.category.toLowerCase()
        const stage: WorkflowStage =
          category.includes('application') ? 'IT_SPECIALIST' : 'WAREHOUSE'
        const assigneeId =
          stage === 'WAREHOUSE' ? warehouseOwner?.id ?? null : defaultIt?.id ?? null
        const createdAsset: Asset = {
          id: crypto.randomUUID(),
          assetTag: buildAssetTag(assetType.name, nextData.assets.length + 1),
          name: payload.name.trim(),
          type: payload.type,
          serialNumber: payload.serialNumber.trim(),
          vendor: payload.vendor.trim(),
          location: payload.location.trim(),
          procurementDate: payload.procurementDate,
          currentStage: stage,
          currentAssigneeId: assigneeId,
          createdBy: currentUser.id,
          requestId: payload.requestId,
          expectedPrice: payload.expectedPrice,
          actualPrice: payload.actualPrice,
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
          assigneeId,
          null,
          stage === 'WAREHOUSE' ? 'WAREHOUSE_MANAGER' : 'IT_SPECIALIST',
          `Asset created by procurement admin and routed to ${stage === 'WAREHOUSE' ? 'warehouse' : 'IT'}.`,
        )

        setData(nextData)
        pushToast({
          title: 'Asset created',
          description: `${createdAsset.assetTag} entered the procurement workflow.`,
          tone: 'success',
        })
      },
      createLegacyAssets: (payload) => {
        if (!data || !currentUser || currentUser.role !== 'ADMIN') {
          return
        }

        const assetType = findLegacyAssetTypeById(payload.assetTypeId)
        const category = findLegacyCategory(payload.categoryId)

        if (!assetType || !category) {
          pushToast({
            title: 'Create blocked',
            description: 'Legacy asset type or category could not be resolved.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        const request = payload.requestId
          ? getRequestList(nextData).find((item) => item.id === payload.requestId)
          : undefined
        const requestItem = request?.items.find((item) => item.id === payload.requestItemId)

        if (request && request.status !== 'APPROVED' && request.status !== 'PURCHASED') {
          pushToast({
            title: 'Request not approved',
            description: 'Only approved requests can be converted into assets.',
            tone: 'danger',
          })
          return
        }

        const quantity = Math.max(1, payload.quantity)
        const remainingQuantity = requestItem
          ? requestItem.quantity - (requestItem.fulfilledQuantity ?? 0)
          : undefined

        if (typeof remainingQuantity === 'number' && remainingQuantity >= 0 && quantity > remainingQuantity) {
          pushToast({
            title: 'Quantity exceeds request',
            description: `Only ${remainingQuantity} units remain in the selected request item.`,
            tone: 'danger',
          })
          return
        }

        const warehouseOwner = getWarehouseOwner(nextData)
        const defaultIt = getDefaultItSpecialist(nextData)
        const stage: WorkflowStage = isSoftwareCategory(payload.categoryType) ? 'IT_SPECIALIST' : 'WAREHOUSE'
        const assigneeId =
          stage === 'WAREHOUSE' ? warehouseOwner?.id ?? null : defaultIt?.id ?? null

        Array.from({ length: quantity }, (_, index) => {
          const serialNumber =
            payload.attributes.serialNumber && quantity === 1
              ? payload.attributes.serialNumber
              : `${assetType.code}-${String(nextData.assets.length + index + 1).padStart(5, '0')}`
          const metadata = buildLegacyMetadataForCreate({
            categoryType: payload.categoryType,
            categoryId: category.id,
            categoryName: category.name,
            assetTypeId: assetType.id,
            requestId: payload.requestId,
            expectedPrice: requestItem?.expectedPrice ?? payload.expectedPrice ?? payload.purchasePrice,
            purchasePrice: payload.actualPrice ?? payload.purchasePrice,
            warrantyDate: payload.warrantyDate,
            status: payload.status,
            attributes: payload.attributes,
          })

          const createdAsset: Asset = {
            id: crypto.randomUUID(),
            assetTag: buildAssetTag(assetType.name, nextData.assets.length + 1),
            name: quantity > 1 ? `${payload.name.trim()} ${index + 1}` : payload.name.trim(),
            type: assetType.name,
            serialNumber,
            vendor: payload.attributes.vendor ?? 'Legacy Vendor',
            location:
              payload.attributes.location ??
              (stage === 'WAREHOUSE' ? 'Warehouse' : 'IT Preparation Queue'),
            procurementDate: payload.purchaseDate,
            currentStage: stage,
            currentAssigneeId: assigneeId,
            createdBy: currentUser.id,
            requestId: payload.requestId,
            expectedPrice: requestItem?.expectedPrice ?? payload.expectedPrice ?? payload.purchasePrice,
            actualPrice: payload.actualPrice ?? payload.purchasePrice,
            metadata,
          }

          nextData.assets.unshift(createdAsset)
          assetType.allowedAgents.forEach((agent) => {
            nextData.agentStatuses.push({
              assetId: createdAsset.id,
              agent: agent as AgentCode,
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
            assigneeId,
            null,
            stage === 'WAREHOUSE' ? 'WAREHOUSE_MANAGER' : 'IT_SPECIALIST',
            `${createdAsset.assetTag} created by procurement admin from approved request.`,
            { createdAt: toAssignmentTimestamp(payload.purchaseDate), effectiveDate: payload.purchaseDate },
          )
        })

        updateRequestPurchaseProgress(nextData, payload.requestId, payload.requestItemId, quantity)

        setData(nextData)
        pushToast({
          title: 'Asset created',
          description: `${quantity} ta asset procurement flow bo'yicha yaratildi.`,
          tone: 'success',
        })
      },
      updateLegacyAsset: (assetId, payload) => {
        if (!data || !currentUser || currentUser.role !== 'ADMIN') {
          return
        }

        const assetType = findLegacyAssetTypeById(payload.assetTypeId)
        const category = findLegacyCategory(payload.categoryId)
        const existingAsset = data.assets.find((asset) => asset.id === assetId)

        if (!assetType || !category || !existingAsset) {
          pushToast({
            title: 'Update blocked',
            description: 'Asset, category, or asset type could not be resolved.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        nextData.assets = nextData.assets.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                name: payload.name.trim(),
                type: assetType.name,
                procurementDate: payload.purchaseDate,
                vendor: payload.attributes.vendor ?? asset.vendor,
                location: payload.attributes.location ?? asset.location,
                serialNumber: payload.attributes.serialNumber ?? asset.serialNumber,
                expectedPrice: payload.expectedPrice ?? asset.expectedPrice ?? payload.purchasePrice,
                actualPrice: payload.actualPrice ?? payload.purchasePrice,
                requestId: payload.requestId ?? asset.requestId,
                metadata: compactMetadata(
                  mergeLegacyMetadata(
                    asset.metadata,
                    buildLegacyMetadataForCreate({
                      categoryType: payload.categoryType,
                      categoryId: category.id,
                      categoryName: category.name,
                      assetTypeId: assetType.id,
                      requestId: payload.requestId ?? asset.requestId,
                      expectedPrice: payload.expectedPrice ?? asset.expectedPrice ?? payload.purchasePrice,
                      purchasePrice: payload.actualPrice ?? payload.purchasePrice,
                      warrantyDate: payload.warrantyDate,
                      status: payload.status,
                      attributes: payload.attributes,
                    }),
                  ),
                ),
              }
            : asset,
        )

        setData(nextData)
        pushToast({
          title: 'Asset updated',
          description: `${existingAsset.assetTag} procurement metadata bilan yangilandi.`,
          tone: 'success',
        })
      },
      createRequest: (payload) => {
        if (!data || !currentUser || currentUser.role !== 'ASSET_CUSTODIAN') {
          return
        }

        const cleanedItems: RequestItem[] = payload.items
          .filter((item) => item.name.trim() && item.quantity > 0)
          .map((item) => ({
            id: crypto.randomUUID(),
            name: item.name.trim(),
            quantity: Math.max(1, item.quantity),
            specs: item.specs.trim(),
            expectedPrice: Math.max(0, item.expectedPrice),
            fulfilledQuantity: 0,
          }))

        if (!payload.title.trim() || cleanedItems.length === 0) {
          pushToast({
            title: 'Request incomplete',
            description: 'Manager request uchun sarlavha va kamida bitta item kerak.',
            tone: 'danger',
          })
          return
        }

        const nextData = structuredClone(data)
        getRequestList(nextData).unshift({
          id: `REQ-${String(getRequestList(nextData).length + 1).padStart(4, '0')}`,
          title: payload.title.trim(),
          createdBy: currentUser.id,
          status: 'CREATED',
          items: cleanedItems,
          fileUrl: payload.fileUrl?.trim() || undefined,
          note: payload.note?.trim() || undefined,
        })
        setData(nextData)
        pushToast({
          title: 'Request created',
          description: 'Manager request admin procurement queue ga yuborildi.',
          tone: 'success',
        })
      },
      reviewRequestAsAdmin: (requestId) => {
        if (!data || !currentUser || currentUser.role !== 'ADMIN') {
          return
        }

        const nextData = structuredClone(data)
        const request = getRequestList(nextData).find((item) => item.id === requestId)

        if (!request || request.status !== 'CREATED') {
          return
        }

        request.reviewedByAdminAt = new Date().toISOString()
        setData(nextData)
        pushToast({
          title: 'Request prepared',
          description: `${request.id} director approval uchun tayyorlandi.`,
          tone: 'info',
        })
      },
      approveRequest: (requestId) => {
        if (!data || !currentUser || currentUser.role !== 'DIRECTOR') {
          return
        }

        const nextData = structuredClone(data)
        const request = getRequestList(nextData).find((item) => item.id === requestId)

        if (!request || request.status !== 'CREATED') {
          return
        }

        request.status = 'APPROVED'
        request.approvedBy = currentUser.id
        request.approvedAt = new Date().toISOString()
        setData(nextData)
        pushToast({
          title: 'Request approved',
          description: `${request.id} procurement uchun tasdiqlandi.`,
          tone: 'success',
        })
      },
      assignFromWarehouse: (assetId, targetUserId) => {
        if (!assetId) {
          return
        }

        assignAssetsFromWarehouseInternal([assetId], targetUserId)
      },
      assignAssetsFromWarehouse: assignAssetsFromWarehouseInternal,
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

        const request = asset.requestId ? getRequestList(data).find((item) => item.id === asset.requestId) : undefined
        if (request && request.createdBy !== target.id) {
          pushToast({
            title: 'Forward blocked',
            description: 'Software asset should return to the manager who created the request.',
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
          `${asset.assetTag} is ready and forwarded to the manager custodian queue.`,
        )
        setData(nextData)
        pushToast({
          title: 'Asset forwarded',
          description: `${asset.assetTag} is now awaiting manager intake.`,
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
            description: 'Managers can only take READY assets.',
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
          `${asset.assetTag} taken into manager custody.`,
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
    [assignAssetsFromWarehouseInternal, currentUser, data, isBootstrapping, pushToast],
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
