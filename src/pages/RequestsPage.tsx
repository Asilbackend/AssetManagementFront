import { requestStatusLabel } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function RequestsPage() {
  const { data, getUserById, currentUser } = useAppStore()

  if (!data || !currentUser) {
    return null
  }

  const requests = data.requests ?? []

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Arizalar bo‘limi</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Barcha arizalar</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Bu bo‘limni xodimdan tashqari barcha rollar ko‘ra oladi. Rahbar yaratadi, admin ko‘radi,
          direktor tasdiqlaydi, IT va ombor esa ownership oqimini kuzatadi.
        </p>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Jami arizalar" value={requests.length} />
          <StatCard label="Tasdiqlangan" value={requests.filter((item) => item.status === 'APPROVED').length} />
          <StatCard label="Sotib olingan" value={requests.filter((item) => item.status === 'PURCHASED').length} />
        </div>
        <div className="mt-5 space-y-3">
          {requests.map((request) => {
            const owner = getUserById(request.createdBy)
            const approver = request.approvedBy ? getUserById(request.approvedBy) : null

            return (
              <article key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{request.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {request.id} | Yaratgan: {owner?.fullName ?? 'Noma’lum'}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {requestStatusLabel(request.status)}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-2">
                    {request.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span>{item.quantity} ta</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.specs || 'Xarakteristika kiritilmagan'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Kutilgan narx: ${item.expectedPrice.toFixed(2)} | Bajarilgan: {item.fulfilledQuantity ?? 0}/{item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 px-4 py-4 text-sm text-slate-300">
                    <p>Rahbar: {owner?.fullName ?? 'Noma’lum'}</p>
                    <p className="mt-2">Direktor: {approver?.fullName ?? 'Tasdiqlanmagan'}</p>
                    <p className="mt-2">Fayl: {request.fileUrl ?? 'Biriktirilmagan'}</p>
                    <p className="mt-2">Izoh: {request.note ?? 'Yo‘q'}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
