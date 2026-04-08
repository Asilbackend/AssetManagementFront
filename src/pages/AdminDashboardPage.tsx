import { Link } from 'react-router-dom'
import { requestStatusLabel } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function AdminDashboardPage() {
  const { data, getUserById, reviewRequestAsAdmin } = useAppStore()

  if (!data) {
    return null
  }

  const requests = data.requests ?? []
  const createdRequests = requests.filter((request) => request.status === 'CREATED')
  const approvedRequests = requests.filter((request) => request.status === 'APPROVED')
  const purchasedRequests = requests.filter((request) => request.status === 'PURCHASED')

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Admin / Procurement</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Arizani qabul qilish va asset yaratish</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Admin procurement egasi hisoblanadi: arizani qabul qiladi, direktorga chiqaradi, vendor
          bilan ishlaydi va assetni tizimga yaratadi.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard label="Yaratilgan arizalar" value={createdRequests.length} />
          <MetricCard label="Tasdiqlangan arizalar" value={approvedRequests.length} />
          <MetricCard label="Sotib olingan arizalar" value={purchasedRequests.length} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Qabul navbati</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Rahbar arizalari</h3>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
              {createdRequests.length} ta kutilmoqda
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {createdRequests.map((request) => {
              const owner = getUserById(request.createdBy)

              return (
                <article key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{request.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {request.id} | {owner?.fullName ?? 'Noma’lum rahbar'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => reviewRequestAsAdmin(request.id)}
                      className="rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200"
                    >
                      Direktorga yuborish
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {request.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span>{item.quantity} ta</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.specs || 'Xarakteristika kiritilmagan'}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tasdiqlangan</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Xarid uchun tayyor</h3>
              </div>
              <Link
                to="/create"
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Asset yaratish
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {approvedRequests.map((request) => (
                <article key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{request.title}</p>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {requestStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{request.id}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Asset yaratishda kutilgan va amaldagi narx shu arizaga bog'lanadi.
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Ruxsatlar matritsasi</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 px-4 py-3">Admin: procurement egasi, vendor egasi, asset yaratuvchi</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">Rahbar: ariza egasi va xodimga tarqatuvchi</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">Ombor: faqat hardware saqlash va ariza egasiga topshirish</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">Direktor: faqat tasdiqlash</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">IT: texnik tayyorlash, o‘rnatish va aktivatsiya</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
