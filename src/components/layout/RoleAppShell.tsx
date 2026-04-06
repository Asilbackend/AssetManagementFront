import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/AppStore'

const menuByRole = {
  IT_SPECIALIST: [{ label: 'Dashboard', to: '/it-specialist' }],
  ASSET_CUSTODIAN: [{ label: 'Dashboard', to: '/asset-custodian' }],
  EMPLOYEE: [{ label: 'My Assets', to: '/my-assets' }],
}

export function RoleAppShell({ children }: PropsWithChildren) {
  const { currentUser, logout } = useAppStore()

  if (!currentUser || currentUser.role === 'WAREHOUSE_MANAGER') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.95),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.18),transparent_22%),linear-gradient(135deg,#020617_0%,#0f172a_40%,#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-slate-950/65 p-6 backdrop-blur xl:flex xl:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">AssetOps</p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-white">
              Security Workflow Console
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              IT specialist, custodian, and employee workspaces stay separate from the warehouse
              dashboard.
            </p>
          </div>
          <nav className="mt-10 space-y-2">
            {menuByRole[currentUser.role as keyof typeof menuByRole]?.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-200'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pt-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
              <p className="mt-2 text-base font-semibold text-white">{currentUser.fullName}</p>
              <p className="mt-1 text-sm text-slate-400">{currentUser.role.replaceAll('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
