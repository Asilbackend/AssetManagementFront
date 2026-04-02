import type {
  AssetAttribute,
  AssetRecord,
  ReportPreset,
  AssetTypeDefinition,
  CategoryDefinition,
  Department,
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
  {
    id: 'network-security',
    name: 'Tarmoq va xavfsizlik',
    englishLabel: 'Network & Security',
    description: "Tarmoq qatlamidagi va perimetr xavfsizlik qurilmalari.",
    categoryType: 'HARDWARE',
  },
  {
    id: 'server-virtual',
    name: 'Server va virtualizatsiya',
    englishLabel: 'Server & Virtual',
    description: 'Hisoblash resurslari, hostlar va virtual platformalar.',
    categoryType: 'HARDWARE',
  },
  {
    id: 'storage-backup',
    name: 'Saqlash va zaxira',
    englishLabel: 'Storage & Backup',
    description: "Ma'lumot saqlash, backup va repository resurslari.",
    categoryType: 'HARDWARE',
  },
  {
    id: 'soc-security',
    name: 'Xavfsizlik tizimlari',
    englishLabel: 'SOC/Security Systems',
    description: 'SOC va IAM atrofidagi boshqaruv tizimlari.',
    categoryType: 'SOFTWARE',
  },
  {
    id: 'software-licenses',
    name: "Dasturiy ta'minot va litsenziyalar",
    englishLabel: 'Software/Licenses',
    description: 'Litsenziya, subscription va raqamli aktivlar.',
    categoryType: 'SOFTWARE',
  },
  {
    id: 'office-assets',
    name: 'Ofis jihozlari',
    englishLabel: 'Office Assets',
    description: 'Kundalik ofis ishlari uchun ishlatiladigan non-IT jihozlar.',
    categoryType: 'NON_IT',
  },
  {
    id: 'facility-assets',
    name: 'Infratuzilma va xo‘jalik jihozlari',
    englishLabel: 'Facility Assets',
    description: 'Bino, maishiy va xo‘jalik ehtiyojlari uchun aktivlar.',
    categoryType: 'NON_IT',
  },
]

export const reportPresets: ReportPreset[] = [
  {
    id: 'weekly',
    label: 'Haftalik',
    description: 'Oxirgi 7 kun ichida qabul qilingan assetlar va ularning qiymati.',
  },
  {
    id: 'monthly',
    label: 'Oylik',
    description: 'Oxirgi 1 oy bo‘yicha asset kirimlari va xarid summalari.',
  },
  {
    id: 'quarterly',
    label: 'Chorak yillik',
    description: 'Oxirgi 3 oy uchun jamlangan asset va narx hisobotlari.',
  },
  {
    id: 'yearly',
    label: 'Yillik',
    description: 'Oxirgi 12 oy bo‘yicha to‘liq hisobot.',
  },
]

const selectField = (
  id: string,
  label: string,
  options: string[],
  required = true,
): AssetAttribute => ({
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

const networkBase = [
  textField('vendor', 'Vendor'),
  textField('model', 'Model'),
  textField('serialNumber', 'Serial number'),
  textField('location', 'Rack/Location'),
  selectField('criticality', 'Criticality', ['High', 'Medium', 'Low']),
]

const serverBase = [
  textField('vendor', 'Vendor'),
  textField('model', 'Model'),
  textField('cpu', 'CPU'),
  textField('ram', 'RAM'),
  textField('serialNumber', 'Serial number'),
]

const storageBase = [
  textField('vendor', 'Vendor'),
  textField('model', 'Model'),
  textField('capacity', 'Capacity'),
  textField('serialNumber', 'Serial number'),
  selectField('tier', 'Storage tier', ['Tier-1', 'Tier-2', 'Archive']),
]

const securityBase = [
  textField('vendor', 'Vendor'),
  textField('version', 'Version'),
  textField('hostname', 'Hostname'),
  selectField('environment', 'Environment', ['Production', 'DR', 'Test']),
]

const licenseBase = [
  textField('vendor', 'Vendor'),
  textField('contractNumber', 'Contract number'),
  numberField('seatCount', 'Seat count'),
  dateField('expiryDate', 'Expiry date'),
  selectField('billingCycle', 'Billing cycle', ['Monthly', 'Quarterly', 'Yearly']),
]

const officeBase = [
  textField('vendor', 'Vendor'),
  textField('model', 'Model'),
  textField('room', 'Room'),
  textField('serialNumber', 'Inventory/Serial number'),
]

const facilityBase = [
  textField('vendor', 'Vendor'),
  textField('model', 'Model'),
  textField('location', 'Location'),
  textField('serialNumber', 'Inventory/Serial number'),
]

const makeType = (
  id: string,
  code: string,
  name: string,
  categoryId: string,
  seedCount: number,
  defaultPrice: number,
  description: string,
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
    attributes,
  }
}

export const assetTypes: AssetTypeDefinition[] = [
  makeType('sd-wan', 'SDW', 'SD-WAN qurilmasi', 'network-security', 2, 4200, 'Branch va HQ orasidagi SD-WAN edge device.', [...networkBase, textField('wanLinks', 'WAN links')]),
  makeType('wifi-controller', 'WFC', 'Wi-Fi Controller', 'network-security', 2, 3800, 'Wireless access pointlarni markaziy boshqarish.', [...networkBase, numberField('managedApCount', 'Managed AP count')]),
  makeType('wifi-ap', 'WAP', 'Wi-Fi Access Point (AP)', 'network-security', 1, 650, 'Ofis yoki branch AP qurilmalari.', [...networkBase, selectField('band', 'Band', ['2.4 GHz', '5 GHz', 'Dual'])]),
  makeType('nac', 'NAC', 'NAC (Network Access Control)', 'network-security', 1, 3100, 'Tarmoqga kirishni boshqarish tizimi.', [...networkBase, textField('policySet', 'Policy set')]),
  makeType('firewall', 'FWL', 'Firewall', 'network-security', 1, 5700, 'Perimetr va segment xavfsizligi uchun firewall.', [...networkBase, numberField('throughputGbps', 'Throughput (Gbps)')]),
  makeType('switch-core', 'SWC', 'Switch (Core)', 'network-security', 1, 4900, 'Core switching layer.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('ids-ips', 'IPS', 'IDS/IPS', 'network-security', 1, 4500, 'Tarmoq anomaliya va hujumlarni aniqlash.', [...networkBase, textField('signaturePack', 'Signature pack')]),
  makeType('load-balancer', 'LDB', 'Load Balancer', 'network-security', 1, 5300, 'Application traffic balancing layer.', [...networkBase, numberField('virtualServers', 'Virtual servers')]),
  makeType('proxy-swg', 'PSG', 'Proxy server / Secure Web Gateway', 'network-security', 1, 2900, 'Web traffic filtering qurilmasi.', [...networkBase, textField('policyMode', 'Policy mode')]),
  makeType('switch-access', 'SWA', 'Switch (Access)', 'network-security', 1, 1400, 'User access switching layer.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('router', 'RTR', 'Router', 'network-security', 1, 2100, 'Routing va branch uplink qurilmasi.', [...networkBase, textField('routingProtocol', 'Routing protocol')]),
  makeType('waf', 'WAF', 'WAF (Web Application Firewall)', 'network-security', 1, 6100, 'Web application security layer.', [...networkBase, textField('protectedApps', 'Protected apps')]),
  makeType('vpn-gateway', 'VPN', 'VPN Gateway', 'network-security', 1, 2600, 'Remote access va site-to-site gateway.', [...networkBase, numberField('maxTunnels', 'Max tunnels')]),
  makeType('modem-ont', 'ONT', 'Modem/ONT (ISP qurilmasi)', 'network-security', 1, 240, 'ISP tomonidan berilgan modem yoki ONT.', [...networkBase, textField('provider', 'Provider')]),
  makeType('switch-distribution', 'SWD', 'Switch (Distribution)', 'network-security', 1, 3200, 'Distribution qatlamidagi switch.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('vm', 'VMS', 'Virtual server (VM)', 'server-virtual', 1, 1800, 'Business application uchun virtual machine.', [...serverBase, selectField('hypervisor', 'Hypervisor', ['VMware', 'Hyper-V', 'Proxmox'])]),
  makeType('physical-server', 'SRV', 'Fizik server', 'server-virtual', 1, 7400, 'Raqamli platforma uchun fizik server.', [...serverBase, textField('rackUnit', 'Rack unit')]),
  makeType('k8s-node', 'K8S', 'Kubernetes node (Master/Worker)', 'server-virtual', 1, 3600, 'Kubernetes klaster node.', [...serverBase, selectField('nodeRole', 'Node role', ['Master', 'Worker'])]),
  makeType('docker-host', 'DCK', 'Container host (Docker)', 'server-virtual', 1, 2800, 'Container workload hosti.', [...serverBase, textField('engineVersion', 'Engine version')]),
  makeType('virtualization-host', 'HVH', 'Virtualizatsiya host (VMware/Hyper-V/Proxmox)', 'server-virtual', 1, 6900, 'Virtualizatsiya layer host serveri.', [...serverBase, textField('clusterName', 'Cluster name')]),
  makeType('san', 'SAN', 'SAN (Storage Area Network)', 'storage-backup', 2, 8200, 'Block-level storage network.', [...storageBase, textField('fabric', 'Fabric')]),
  makeType('storage-array', 'ARY', 'Disk massiv (Storage Array)', 'storage-backup', 2, 9100, 'Korxona storage array qurilmasi.', [...storageBase, numberField('controllerCount', 'Controller count')]),
  makeType('tape-library', 'TPL', 'Tape Library', 'storage-backup', 1, 4600, 'Tape-based archive va backup tizimi.', [...storageBase, numberField('slotCount', 'Slot count')]),
  makeType('backup-repo', 'BKR', 'Backup storage (repo)', 'storage-backup', 1, 2600, 'Backup repository server yoki appliance.', [...storageBase, textField('retentionPolicy', 'Retention policy')]),
  makeType('backup-server', 'BKS', 'Backup server', 'storage-backup', 1, 3100, 'Backup orchestrator server.', [...storageBase, textField('backupSoftware', 'Backup software')]),
  makeType('nas', 'NAS', 'NAS (Network Storage)', 'storage-backup', 1, 3500, 'File-level storage appliance.', [...storageBase, numberField('bayCount', 'Bay count')]),
  makeType('iam-sso', 'IAM', 'IAM/SSO server', 'soc-security', 1, 1200, 'Identity and access management server.', [...securityBase, textField('authMethod', 'Auth method')]),
  makeType('hsm', 'HSM', 'HSM (kalitlarni saqlash qurilmasi)', 'soc-security', 1, 5200, 'Kriptografik kalitlarni himoyalash qurilmasi.', [...securityBase, selectField('compliance', 'Compliance', ['PCI', 'FIPS', 'Internal'])]),
  makeType('av-server', 'AVS', 'Antivirus management server', 'soc-security', 1, 980, 'Endpoint antivirus boshqaruv serveri.', [...securityBase, numberField('managedEndpoints', 'Managed endpoints')]),
  makeType('siem-server', 'SEM', 'SIEM server/collector', 'soc-security', 1, 4300, 'Log yig‘ish va korrelyatsiya serveri.', [...securityBase, numberField('eps', 'EPS')]),
  makeType('dlp-server', 'DLP', 'DLP server', 'soc-security', 1, 2700, "Ma'lumot chiqib ketishini nazorat qilish serveri.", [...securityBase, textField('policyPack', 'Policy pack')]),
  makeType('edr-server', 'EDR', 'EDR management server', 'soc-security', 1, 1600, 'EDR console yoki controller serveri.', [...securityBase, numberField('managedEndpoints', 'Managed endpoints')]),
  makeType('vuln-scanner', 'VSC', 'Vulnerability scanner server', 'soc-security', 1, 1900, 'Zaifliklarni skanerlash serveri.', [...securityBase, textField('scanWindow', 'Scan window')]),
  makeType('mfa-radius', 'MFA', 'MFA/RADIUS server', 'soc-security', 1, 1100, 'MFA va radius autentifikatsiya serveri.', [...securityBase, textField('provider', 'Provider')]),
  makeType('pam-server', 'PAM', 'PAM server', 'soc-security', 1, 3400, 'Privileged access management server.', [...securityBase, textField('vaultMode', 'Vault mode')]),
  makeType('soar', 'SOR', 'SOAR server', 'soc-security', 1, 3900, 'Security orchestration server.', [...securityBase, textField('playbookSet', 'Playbook set')]),
  makeType('os-license', 'OSL', 'Operatsion tizim litsenziyasi (OS License)', 'software-licenses', 2, 280, 'Server va workstation OS license.', [...licenseBase, selectField('licenseKind', 'License kind', ['Per device', 'Per core', 'Subscription'])]),
  makeType('m365', 'M36', 'Microsoft 365/Google Workspace obunasi', 'software-licenses', 2, 120, 'Xodimlar uchun productivity suite obunasi.', [...licenseBase, selectField('suite', 'Suite', ['Microsoft 365', 'Google Workspace'])]),
  makeType('ssl', 'SSL', 'SSL sertifikat', 'software-licenses', 2, 85, 'Public-facing TLS/SSL certificate.', [...licenseBase, textField('domainName', 'Domain name')]),
  makeType('siem-license', 'SIL', 'SIEM litsenziyasi', 'software-licenses', 2, 740, 'SIEM platforma license yoki node license.', [...licenseBase, numberField('logSources', 'Log source count')]),
  makeType('utm-subscription', 'UTM', 'Firewall/UTM obunasi (Subscription)', 'software-licenses', 2, 420, 'Firewall security services subscription.', [...licenseBase, textField('serviceBundle', 'Service bundle')]),
  makeType('edr-license', 'EDL', 'Antivirus/EDR litsenziyasi', 'software-licenses', 1, 55, 'Endpoint security litsenziyasi.', [...licenseBase, numberField('endpointCount', 'Endpoint count')]),
  makeType('db-license', 'DBL', "Ma'lovotlar bazasi litsenziyasi (DB License)", 'software-licenses', 1, 1300, 'Database engine license.', [...licenseBase, selectField('dbType', 'DB type', ['MS SQL', 'Oracle', 'PostgreSQL Enterprise'])]),
  makeType('domain-name', 'DOM', 'Domen nomi', 'software-licenses', 1, 35, 'Korporativ domen nomi va renewallari.', [...licenseBase, textField('registrar', 'Registrar')]),
  makeType('office-chair', 'CHR', 'Ofis stuli', 'office-assets', 3, 95, 'Xodimlar uchun ergonomik stullar.', [...officeBase, selectField('material', 'Material', ['Mesh', 'Leather', 'Fabric'])]),
  makeType('office-desk', 'DSK', 'Ofis stoli', 'office-assets', 2, 180, 'Ish joylari uchun ofis stollari.', [...officeBase, numberField('widthCm', 'Width (cm)')]),
  makeType('meeting-table', 'MTB', 'Majlis stoli', 'office-assets', 1, 420, 'Majlis xonalari uchun katta stol.', [...officeBase, numberField('seatCapacity', 'Seat capacity')]),
  makeType('air-conditioner', 'ACU', 'Konditsioner', 'facility-assets', 2, 850, 'Xona haroratini boshqarish uskunasi.', [...facilityBase, numberField('btu', 'BTU')]),
  makeType('generator', 'GEN', 'Generator', 'facility-assets', 1, 5400, 'Elektr uzilishida zaxira quvvat manbai.', [...facilityBase, numberField('powerKw', 'Power (kW)')]),
  makeType('ups-facility', 'UPS', 'UPS (Facility)', 'facility-assets', 1, 2200, 'Xo‘jalik va bino infratuzilmasi uchun UPS.', [...facilityBase, numberField('capacityKva', 'Capacity (kVA)')]),
]

const statusFlow: Status[] = ['available', 'assigned', 'maintenance', 'available', 'broken', 'assigned']
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

const buildAttributeValue = (
  field: AssetAttribute,
  assetType: AssetTypeDefinition,
  index: number,
) => {
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
    case 'domainName':
      return `service-${index + 1}.company.uz`
    case 'expiryDate':
      return `2027-${String((index % 9) + 1).padStart(2, '0')}-15`
    case 'purchaseDate':
      return `2025-${String((index % 9) + 1).padStart(2, '0')}-10`
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
    const attributes = Object.fromEntries(
      assetType.attributes.map((field) => [
        field.name,
        buildAttributeValue(field, assetType, index),
      ]),
    )

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
