import { AssetTable } from '../components/assets/AssetTable'
import { useAppStore } from '../store/AppStore'

export function EmployeeAssetsPage() {
  const { data, currentUser, getUserById } = useAppStore()

  if (!data || !currentUser) {
    return null
  }

  const assets = data.assets.filter(
    (asset) => asset.currentStage === 'EMPLOYEE' && asset.currentAssigneeId === currentUser.id,
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Employee View</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Assigned assets</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Employees only receive a lightweight assigned-assets page. No lifecycle actions are
          exposed here.
        </p>
      </section>
      <AssetTable assets={assets} data={data} getUserById={getUserById} />
    </div>
  )
}
