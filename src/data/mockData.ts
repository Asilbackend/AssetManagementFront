import type {
  AssetAttribute,
  AssetRecord,
  AssetTypeDefinition,
  CategoryDefinition,
  Department,
  ReportPreset,
  SecurityAgentState,
  Status,
} from '../types'
import { buildAssetCode } from '../utils/asset'

export const departments: Department[] = [
  { id: 'dep-it', name: 'IT Operations' },
  { id: 'dep-sec', name: 'Security Operations' },
  { id: 'dep-fin', name: 'Finance' },
  { id: 'dep-hr', name: 'HR' },
  { id: 'dep-admin', name: 'Administration' },
]

export const categories: CategoryDefinition[] = [
  { id: 'network-security', name: 'Tarmoq va xavfsizlik', englishLabel: 'Network & Security', description: "Tarmoq qatlamidagi va perimetr xavfsizlik qurilmalari.", categoryType: 'HARDWARE' },
  { id: 'server-virtual', name: 'Server va virtualizatsiya', englishLabel: 'Server & Virtual', description: 'Hisoblash resurslari, hostlar va virtual platformalar.', categoryType: 'HARDWARE' },
  { id: 'storage-backup', name: 'Saqlash va zaxira', englishLabel: 'Storage & Backup', description: "Ma'lumot saqlash, backup va repository resurslari.", categoryType: 'HARDWARE' },
  { id: 'soc-security', name: 'Xavfsizlik tizimlari', englishLabel: 'SOC/Security Systems', description: 'SOC va IAM atrofidagi boshqaruv tizimlari.', categoryType: 'SOFTWARE' },
  { id: 'software-licenses', name: "Dasturiy ta'minot va litsenziyalar", englishLabel: 'Software/Licenses', description: 'Litsenziya, subscription va raqamli aktivlar.', categoryType: 'SOFTWARE' },
  { id: 'office-assets', name: 'Ofis jihozlari', englishLabel: 'Office Assets', description: 'Kundalik ofis ishlari uchun ishlatiladigan non-IT jihozlar.', categoryType: 'NON_IT' },
  { id: 'facility-assets', name: 'Infratuzilma va xojalik jihozlari', englishLabel: 'Facility Assets', description: 'Bino, maishiy va xojalik ehtiyojlari uchun aktivlar.', categoryType: 'NON_IT' },
]

export const reportPresets: ReportPreset[] = [
  { id: 'weekly', label: 'Haftalik', description: 'Oxirgi 7 kun ichida qabul qilingan assetlar va ularning qiymati.' },
  { id: 'monthly', label: 'Oylik', description: 'Oxirgi 1 oy bo‘yicha asset kirimlari va xarid summalari.' },
  { id: 'quarterly', label: 'Chorak yillik', description: 'Oxirgi 3 oy uchun jamlangan asset va narx hisobotlari.' },
  { id: 'yearly', label: 'Yillik', description: 'Oxirgi 12 oy bo‘yicha to‘liq hisobot.' },
]

export const securityAgents = ['AD', 'WAF', 'PAM', 'EDR', 'AV', 'SIEM', 'DLP', 'MDM', 'MFA', 'NAC', 'ZTNA', 'VPN'] as const

const selectField = (id: string, label: string, options: string[], required = true): AssetAttribute => ({
  id,
  name: id,
  label,
  type: 'select',
  required,
  options,
})

const textField = (id: string, label: string, required = true): AssetAttribute => ({
  id,
  name: id,
  label,
  type: 'text',
  required,
})

const numberField = (id: string, label: string, required = true): AssetAttribute => ({
  id,
  name: id,
  label,
  type: 'number',
  required,
})

const dateField = (id: string, label: string, required = true): AssetAttribute => ({
  id,
  name: id,
  label,
  type: 'date',
  required,
})

const networkBase = [textField('vendor', 'Vendor'), textField('model', 'Model'), textField('serialNumber', 'Serial number'), textField('location', 'Rack/Location'), selectField('criticality', 'Criticality', ['High', 'Medium', 'Low'])]
const serverBase = [textField('vendor', 'Vendor'), textField('model', 'Model'), textField('cpu', 'CPU'), textField('ram', 'RAM'), textField('serialNumber', 'Serial number')]
const storageBase = [textField('vendor', 'Vendor'), textField('model', 'Model'), textField('capacity', 'Capacity'), textField('serialNumber', 'Serial number'), selectField('tier', 'Storage tier', ['Tier-1', 'Tier-2', 'Archive'])]
const securityBase = [textField('vendor', 'Vendor'), textField('version', 'Version'), textField('hostname', 'Hostname'), selectField('environment', 'Environment', ['Production', 'DR', 'Test'])]
const licenseBase = [textField('vendor', 'Vendor'), textField('contractNumber', 'Contract number'), numberField('seatCount', 'Seat count'), dateField('expiryDate', 'Expiry date'), selectField('billingCycle', 'Billing cycle', ['Monthly', 'Quarterly', 'Yearly'])]
const officeBase = [textField('vendor', 'Vendor'), textField('model', 'Model'), textField('room', 'Room'), textField('serialNumber', 'Inventory/Serial number')]
const facilityBase = [textField('vendor', 'Vendor'), textField('model', 'Model'), textField('location', 'Location'), textField('serialNumber', 'Inventory/Serial number')]

const makeType = (
  id: string,
  code: string,
  name: string,
  categoryId: string,
  seedCount: number,
  defaultPrice: number,
  description: string,
  allowedAgents: string[],
  attributes: AssetAttribute[],
): AssetTypeDefinition => {
  const category = categories.find((item) => item.id === categoryId)

  if (!category) {
    throw new Error(`Unknown category ${categoryId}`)
  }

  return {
    id,
    code,
    name,
    categoryId,
    categoryName: category.name,
    categoryType: category.categoryType,
    seedCount,
    defaultPrice,
    description,
    allowedAgents,
    attributes,
  }
}

export const assetTypes: AssetTypeDefinition[] = [
  makeType('sd-wan', 'SDW', 'SD-WAN qurilmasi', 'network-security', 3, 4200, 'Branch va HQ orasidagi SD-WAN edge device.', ['PAM', 'WAF', 'NAC', 'VPN'], [...networkBase, textField('wanLinks', 'WAN links')]),
  makeType('wifi-controller', 'WFC', 'Wi-Fi Controller', 'network-security', 3, 3800, 'Wireless access pointlarni markaziy boshqarish.', ['NAC', 'AD', 'MFA'], [...networkBase, numberField('managedApCount', 'Managed AP count')]),
  makeType('firewall', 'FWL', 'Firewall', 'network-security', 3, 5700, 'Perimetr va segment xavfsizligi uchun firewall.', ['WAF', 'PAM', 'SIEM', 'VPN'], [...networkBase, numberField('throughputGbps', 'Throughput (Gbps)')]),
  makeType('router', 'RTR', 'Router', 'network-security', 3, 2100, 'Routing va branch uplink qurilmasi.', ['VPN', 'PAM', 'NAC'], [...networkBase, textField('routingProtocol', 'Routing protocol')]),
  makeType('physical-server', 'SRV', 'Fizik server', 'server-virtual', 4, 7400, 'Raqamli platforma uchun fizik server.', ['EDR', 'WAF', 'PAM', 'AD', 'SIEM'], [...serverBase, textField('rackUnit', 'Rack unit')]),
  makeType('k8s-node', 'K8S', 'Kubernetes node', 'server-virtual', 3, 3600, 'Kubernetes klaster node.', ['EDR', 'PAM', 'SIEM', 'ZTNA'], [...serverBase, selectField('nodeRole', 'Node role', ['Master', 'Worker'])]),
  makeType('backup-server', 'BKS', 'Backup server', 'storage-backup', 3, 3100, 'Backup orchestrator server.', ['EDR', 'DLP', 'PAM'], [...storageBase, textField('backupSoftware', 'Backup software')]),
  makeType('nas', 'NAS', 'NAS (Network Storage)', 'storage-backup', 3, 3500, 'File-level storage appliance.', ['DLP', 'AD', 'PAM'], [...storageBase, numberField('bayCount', 'Bay count')]),
  makeType('siem-server', 'SEM', 'SIEM server/collector', 'soc-security', 3, 4300, 'Log yigish va korrelyatsiya serveri.', ['SIEM', 'PAM', 'MFA'], [...securityBase, numberField('eps', 'EPS')]),
  makeType('pam-server', 'PAM', 'PAM server', 'soc-security', 3, 3400, 'Privileged access management server.', ['PAM', 'MFA', 'SIEM'], [...securityBase, textField('vaultMode', 'Vault mode')]),
  makeType('m365', 'M36', 'Microsoft 365/Google Workspace obunasi', 'software-licenses', 3, 120, 'Xodimlar uchun productivity suite obunasi.', ['DLP', 'MFA', 'MDM'], [...licenseBase, selectField('suite', 'Suite', ['Microsoft 365', 'Google Workspace'])]),
  makeType('edr-license', 'EDL', 'Antivirus/EDR litsenziyasi', 'software-licenses', 3, 55, 'Endpoint security litsenziyasi.', ['EDR', 'AV', 'MDM'], [...licenseBase, numberField('endpointCount', 'Endpoint count')]),
  makeType('office-chair', 'CHR', 'Ofis stuli', 'office-assets', 3, 95, 'Xodimlar uchun ergonomik stullar.', [], [...officeBase, selectField('material', 'Material', ['Mesh', 'Leather', 'Fabric'])]),
  makeType('office-desk', 'DSK', 'Ofis stoli', 'office-assets', 3, 180, 'Ish joylari uchun ofis stollari.', [], [...officeBase, numberField('widthCm', 'Width (cm)')]),
  makeType('generator', 'GEN', 'Generator', 'facility-assets', 2, 5400, 'Elektr uzilishida zaxira quvvat manbai.', [], [...facilityBase, numberField('powerKw', 'Power (kW)')]),
  makeType('ups-facility', 'UPS', 'UPS (Facility)', 'facility-assets', 2, 2200, 'Bino infratuzilmasi uchun UPS.', [], [...facilityBase, numberField('capacityKva', 'Capacity (kVA)')]),
]

const statusFlow: Status[] = ['available', 'assigned', 'maintenance', 'available', 'broken', 'assigned']
const securityStatusFlow: SecurityAgentState['status'][] = ['INSTALLED', 'PENDING', 'INSTALLED', 'FAILED', 'PENDING']
const seedPurchaseOffsets = [0, 2, 5, 10, 18, 32, 47, 74, 103, 138, 176, 245]

const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
const addYears = (date: Date, years: number) => {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

const buildSeedPurchaseDate = (index: number) => {
  const offset = seedPurchaseOffsets[index % seedPurchaseOffsets.length]
  return formatIsoDate(addDays(new Date(), -offset))
}

const buildAttributeValue = (field: AssetAttribute, assetType: AssetTypeDefinition, index: number) => {
  if (field.options?.length) {
    return field.options[index % field.options.length]
  }

  switch (field.name) {
    case 'serialNumber':
      return `${assetType.code}-${String(index + 1).padStart(5, '0')}`
    case 'vendor':
      return ['Cisco', 'Fortinet', 'Dell', 'HPE', 'Microsoft', 'Palo Alto'][index % 6]
    case 'model':
      return `${assetType.code} Model ${index + 1}`
    case 'location':
      return `DC-${(index % 3) + 1} / Rack-${(index % 12) + 1}`
    case 'hostname':
      return `${assetType.code.toLowerCase()}-${String(index + 1).padStart(2, '0')}`
    case 'contractNumber':
      return `CTR-${assetType.code}-${String(index + 1).padStart(4, '0')}`
    case 'expiryDate':
      return `2027-${String((index % 9) + 1).padStart(2, '0')}-15`
    default:
      break
  }

  if (field.type === 'number') {
    return String((index + 2) * 2)
  }

  if (field.type === 'date') {
    return `2027-${String((index % 9) + 1).padStart(2, '0')}-15`
  }

  return `${field.label} ${index + 1}`
}

export const initialAssets: AssetRecord[] = assetTypes.flatMap((assetType) =>
  Array.from({ length: assetType.seedCount }, (_, index) => {
    const status = statusFlow[index % statusFlow.length]
    const department = status === 'assigned' ? departments[index % departments.length] : undefined
    const purchaseDate = buildSeedPurchaseDate(index)
    const warrantyDate = formatIsoDate(addYears(new Date(purchaseDate), 3))
    const attributes = Object.fromEntries(assetType.attributes.map((field) => [field.name, buildAttributeValue(field, assetType, index)]))

    return {
      id: `${assetType.id}-${index + 1}`,
      assetCode: buildAssetCode(assetType, purchaseDate, index + 1),
      name: `${assetType.name} ${index + 1}`,
      categoryType: assetType.categoryType,
      categoryId: assetType.categoryId,
      categoryName: assetType.categoryName,
      assetTypeId: assetType.id,
      assetTypeName: assetType.name,
      status,
      purchasePrice: assetType.defaultPrice,
      purchaseDate,
      warrantyDate,
      departmentId: department?.id,
      departmentName: department?.name,
      returnDate: undefined,
      attributes,
      securityStatuses: assetType.allowedAgents.map((agent, agentIndex) => ({
        agent,
        status: securityStatusFlow[(index + agentIndex) % securityStatusFlow.length],
      })),
      history: [
        {
          id: `${assetType.id}-${index + 1}-created`,
          action: 'created',
          date: purchaseDate,
          actor: 'Omborchi',
          note: 'Asset omborga qabul qilindi.',
        },
        ...(department
          ? [
              {
                id: `${assetType.id}-${index + 1}-assigned`,
                action: 'assigned' as const,
                date: formatIsoDate(addDays(new Date(purchaseDate), 12)),
                actor: 'Omborchi',
                note: `${department.name} bo'limiga biriktirildi.`,
                departmentId: department.id,
                departmentName: department.name,
                returnDate: undefined,
              },
            ]
          : []),
      ],
    }
  }),
)
