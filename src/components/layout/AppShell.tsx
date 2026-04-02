import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/create', label: 'Asset create' },
  { to: '/assign', label: 'Asset assign' },
  { to: '/reports', label: 'Hisobotlar' },
]

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="h-screen lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(18,34,54,0.98),rgba(21,40,61,0.98))] px-6 py-8 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
            Role: Omborchi
          </div>
          <div className="space-y-3">
            <h1 className="max-w-xs text-3xl font-semibold leading-tight">
              Dynamic Asset Management Frontend
            </h1>
            <p className="max-w-sm text-sm leading-6 text-slate-300">
              Xodim ortiqcha ma'lumot kiritmasligi uchun dashboard, create va assign
              oqimlari alohida va yengil qilindi.
            </p>
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-2xl border px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'border-amber-300/40 bg-amber-400/15 text-amber-50'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Omborchi vazifalari
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Category va type bo'yicha assetlarni ko'rish</li>
              <li>Dynamic form orqali asset create qilish</li>
              <li>Assetni departmentga tez biriktirish</li>
              <li>Haftalik, oylik va yillik hisobotlarni export qilish</li>
            </ul>
          </div>
        </div>
      </aside>

      <main className="px-4 py-5 overflow-y-auto sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
