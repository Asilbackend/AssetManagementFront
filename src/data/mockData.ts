import type {
  AssetAttribute,
  AssetRecord,
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
    name: 'Tarmoq va xavfsizlik (Network & Security)',
    description: "Tarmoq qatlamidagi va perimetr xavfsizlik qurilmalari.",
  },
  {
    id: 'server-virtual',
    name: 'Server va virtualizatsiya (Server & Virtual)',
    description: 'Hisoblash resurslari, hostlar va virtual platformalar.',
  },
  {
    id: 'storage-backup',
    name: 'Saqlash va zaxira (Storage & Backup)',
    description: "Ma'lumot saqlash, backup va repository resurslari.",
  },
  {
    id: 'soc-security',
    name: 'Xavfsizlik tizimlari (SOC/Security Systems)',
    description: 'SOC va IAM atrofidagi boshqaruv tizimlari.',
  },
  {
    id: 'software-licenses',
    name: "Dasturiy ta'minot va litsenziyalar (Software/Licenses)",
    description: 'Litsenziya, subscription va raqamli aktivlar.',
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

const makeType = (
  id: string,
  code: string,
  name: string,
  categoryId: string,
  count: number,
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
    count,
    description,
    attributes,
  }
}

export const assetTypes: AssetTypeDefinition[] = [
  makeType('sd-wan', 'SDW', 'SD-WAN qurilmasi', 'network-security', 5, 'Branch va HQ orasidagi SD-WAN edge device.', [...networkBase, textField('wanLinks', 'WAN links')]),
  makeType('wifi-controller', 'WFC', 'Wi-Fi Controller', 'network-security', 5, 'Wireless access pointlarni markaziy boshqarish.', [...networkBase, numberField('managedApCount', 'Managed AP count')]),
  makeType('wifi-ap', 'WAP', 'Wi-Fi Access Point (AP)', 'network-security', 3, 'Ofis yoki branch AP qurilmalari.', [...networkBase, selectField('band', 'Band', ['2.4 GHz', '5 GHz', 'Dual'])]),
  makeType('nac', 'NAC', 'NAC (Network Access Control)', 'network-security', 3, 'Tarmoqga kirishni boshqarish tizimi.', [...networkBase, textField('policySet', 'Policy set')]),
  makeType('firewall', 'FWL', 'Firewall', 'network-security', 3, 'Perimetr va segment xavfsizligi uchun firewall.', [...networkBase, numberField('throughputGbps', 'Throughput (Gbps)')]),
  makeType('switch-core', 'SWC', 'Switch (Core)', 'network-security', 3, 'Core switching layer.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('ids-ips', 'IPS', 'IDS/IPS', 'network-security', 3, 'Tarmoq anomaliya va hujumlarni aniqlash.', [...networkBase, textField('signaturePack', 'Signature pack')]),
  makeType('load-balancer', 'LDB', 'Load Balancer', 'network-security', 2, 'Application traffic balancing layer.', [...networkBase, numberField('virtualServers', 'Virtual servers')]),
  makeType('proxy-swg', 'PSG', 'Proxy server / Secure Web Gateway', 'network-security', 2, 'Web traffic filtering qurilmasi.', [...networkBase, textField('policyMode', 'Policy mode')]),
  makeType('switch-access', 'SWA', 'Switch (Access)', 'network-security', 2, 'User access switching layer.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('router', 'RTR', 'Router', 'network-security', 2, 'Routing va branch uplink qurilmasi.', [...networkBase, textField('routingProtocol', 'Routing protocol')]),
  makeType('waf', 'WAF', 'WAF (Web Application Firewall)', 'network-security', 2, 'Web application security layer.', [...networkBase, textField('protectedApps', 'Protected apps')]),
  makeType('vpn-gateway', 'VPN', 'VPN Gateway', 'network-security', 2, 'Remote access va site-to-site gateway.', [...networkBase, numberField('maxTunnels', 'Max tunnels')]),
  makeType('modem-ont', 'ONT', 'Modem/ONT (ISP qurilmasi)', 'network-security', 1, 'ISP tomonidan berilgan modem yoki ONT.', [...networkBase, textField('provider', 'Provider')]),
  makeType('switch-distribution', 'SWD', 'Switch (Distribution)', 'network-security', 1, 'Distribution qatlamidagi switch.', [...networkBase, numberField('ports', 'Ports count')]),
  makeType('vm', 'VMS', 'Virtual server (VM)', 'server-virtual', 3, 'Business application uchun virtual machine.', [...serverBase, selectField('hypervisor', 'Hypervisor', ['VMware', 'Hyper-V', 'Proxmox'])]),
  makeType('physical-server', 'SRV', 'Fizik server', 'server-virtual', 3, 'Raqamli platforma uchun fizik server.', [...serverBase, textField('rackUnit', 'Rack unit')]),
  makeType('k8s-node', 'K8S', 'Kubernetes node (Master/Worker)', 'server-virtual', 3, 'Kubernetes klaster node.', [...serverBase, selectField('nodeRole', 'Node role', ['Master', 'Worker'])]),
  makeType('docker-host', 'DCK', 'Container host (Docker)', 'server-virtual', 3, 'Container workload hosti.', [...serverBase, textField('engineVersion', 'Engine version')]),
  makeType('virtualization-host', 'HVH', 'Virtualizatsiya host (VMware/Hyper-V/Proxmox)', 'server-virtual', 3, 'Virtualizatsiya layer host serveri.', [...serverBase, textField('clusterName', 'Cluster name')]),
  makeType('san', 'SAN', 'SAN (Storage Area Network)', 'storage-backup', 4, 'Block-level storage network.', [...storageBase, textField('fabric', 'Fabric')]),
  makeType('storage-array', 'ARY', 'Disk massiv (Storage Array)', 'storage-backup', 4, 'Korxona storage array qurilmasi.', [...storageBase, numberField('controllerCount', 'Controller count')]),
  makeType('tape-library', 'TPL', 'Tape Library', 'storage-backup', 3, 'Tape-based archive va backup tizimi.', [...storageBase, numberField('slotCount', 'Slot count')]),
  makeType('backup-repo', 'BKR', 'Backup storage (repo)', 'storage-backup', 2, 'Backup repository server yoki appliance.', [...storageBase, textField('retentionPolicy', 'Retention policy')]),
  makeType('backup-server', 'BKS', 'Backup server', 'storage-backup', 1, 'Backup orchestrator server.', [...storageBase, textField('backupSoftware', 'Backup software')]),
  makeType('nas', 'NAS', 'NAS (Network Storage)', 'storage-backup', 1, 'File-level storage appliance.', [...storageBase, numberField('bayCount', 'Bay count')]),
  makeType('iam-sso', 'IAM', 'IAM/SSO server', 'soc-security', 3, 'Identity and access management server.', [...securityBase, textField('authMethod', 'Auth method')]),
  makeType('hsm', 'HSM', 'HSM (kalitlarni saqlash qurilmasi)', 'soc-security', 3, 'Kriptografik kalitlarni himoyalash qurilmasi.', [...securityBase, selectField('compliance', 'Compliance', ['PCI', 'FIPS', 'Internal'])]),
  makeType('av-server', 'AVS', 'Antivirus management server', 'soc-security', 3, 'Endpoint antivirus boshqaruv serveri.', [...securityBase, numberField('managedEndpoints', 'Managed endpoints')]),
  makeType('siem-server', 'SEM', 'SIEM server/collector', 'soc-security', 3, 'Log yig‘ish va korrelyatsiya serveri.', [...securityBase, numberField('eps', 'EPS')]),
  makeType('dlp-server', 'DLP', 'DLP server', 'soc-security', 3, "Ma'lumot chiqib ketishini nazorat qilish serveri.", [...securityBase, textField('policyPack', 'Policy pack')]),
  makeType('edr-server', 'EDR', 'EDR management server', 'soc-security', 3, 'EDR console yoki controller serveri.', [...securityBase, numberField('managedEndpoints', 'Managed endpoints')]),
  makeType('vuln-scanner', 'VSC', 'Vulnerability scanner server', 'soc-security', 3, 'Zaifliklarni skanerlash serveri.', [...securityBase, textField('scanWindow', 'Scan window')]),
  makeType('mfa-radius', 'MFA', 'MFA/RADIUS server', 'soc-security', 3, 'MFA va radius autentifikatsiya serveri.', [...securityBase, textField('provider', 'Provider')]),
  makeType('pam-server', 'PAM', 'PAM server', 'soc-security', 2, 'Privileged access management server.', [...securityBase, textField('vaultMode', 'Vault mode')]),
  makeType('soar', 'SOR', 'SOAR server', 'soc-security', 1, 'Security orchestration server.', [...securityBase, textField('playbookSet', 'Playbook set')]),
  makeType('os-license', 'OSL', 'Operatsion tizim litsenziyasi (OS License)', 'software-licenses', 8, 'Server va workstation OS license.', [...licenseBase, selectField('licenseKind', 'License kind', ['Per device', 'Per core', 'Subscription'])]),
  makeType('m365', 'M36', 'Microsoft 365/Google Workspace obunasi', 'software-licenses', 8, 'Xodimlar uchun productivity suite obunasi.', [...licenseBase, selectField('suite', 'Suite', ['Microsoft 365', 'Google Workspace'])]),
  makeType('ssl', 'SSL', 'SSL sertifikat', 'software-licenses', 4, 'Public-facing TLS/SSL certificate.', [...licenseBase, textField('domainName', 'Domain name')]),
  makeType('siem-license', 'SIL', 'SIEM litsenziyasi', 'software-licenses', 3, 'SIEM platforma license yoki node license.', [...licenseBase, numberField('logSources', 'Log source count')]),
  makeType('utm-subscription', 'UTM', 'Firewall/UTM obunasi (Subscription)', 'software-licenses', 3, 'Firewall security services subscription.', [...licenseBase, textField('serviceBundle', 'Service bundle')]),
  makeType('edr-license', 'EDL', 'Antivirus/EDR litsenziyasi', 'software-licenses', 3, 'Endpoint security litsenziyasi.', [...licenseBase, numberField('endpointCount', 'Endpoint count')]),
  makeType('db-license', 'DBL', "Ma'lovotlar bazasi litsenziyasi (DB License)", 'software-licenses', 3, 'Database engine license.', [...licenseBase, selectField('dbType', 'DB type', ['MS SQL', 'Oracle', 'PostgreSQL Enterprise'])]),
  makeType('domain-name', 'DOM', 'Domen nomi', 'software-licenses', 2, 'Korporativ domen nomi va renewallari.', [...licenseBase, textField('registrar', 'Registrar')]),
]

const statusFlow: Status[] = ['available', 'assigned', 'maintenance', 'available', 'broken', 'assigned']

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
  Array.from({ length: assetType.count }, (_, index) => {
    const status = statusFlow[index % statusFlow.length]
    const department = status === 'assigned' ? departments[index % departments.length] : undefined
    const purchaseDate = `2025-${String((index % 9) + 1).padStart(2, '0')}-10`
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
      categoryId: assetType.categoryId,
      categoryName: assetType.categoryName,
      assetTypeId: assetType.id,
      assetTypeName: assetType.name,
      status,
      purchaseDate,
      warrantyDate: `2028-${String((index % 9) + 1).padStart(2, '0')}-10`,
      departmentId: department?.id,
      departmentName: department?.name,
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
                date: `2025-${String((index % 9) + 1).padStart(2, '0')}-22`,
                actor: 'Omborchi',
                note: `${department.name} bo'limiga biriktirildi.`,
                departmentId: department.id,
                departmentName: department.name,
              },
            ]
          : []),
      ],
    }
  }),
)
