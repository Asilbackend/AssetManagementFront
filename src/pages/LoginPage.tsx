import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'

const demoAccounts = [
  ['warehouse', 'WAREHOUSE_MANAGER'],
  ['it.ops', 'IT_SPECIALIST'],
  ['custodian', 'ASSET_CUSTODIAN'],
  ['jdoe', 'EMPLOYEE'],
]

export function LoginPage() {
  const { currentUser, isBootstrapping, login } = useAppStore()
  const [username, setUsername] = useState('warehouse')
  const [password, setPassword] = useState('Password123!')

  if (currentUser) {
    return <Navigate to="/" replace />
  }

  if (isBootstrapping) {
    return null
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_18%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/45 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">AssetOps Control</p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            Frontend-only asset workflow with strict readiness gates.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Every asset type defines its allowed security agents in `mockdata.json`, and every
            handoff obeys the warehouse-to-IT-to-custodian-to-employee flow.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {demoAccounts.map(([user, role]) => (
              <div key={user} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{user}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{role}</p>
                <p className="mt-3 text-sm text-slate-300">Password: `Password123!`</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/55 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use one of the seeded mock enterprise accounts.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              login(username, password)
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Username
              </label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Enter workspace
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
