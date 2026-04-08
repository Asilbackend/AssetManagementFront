import { requestStatusLabel } from '../domain/rules'
import { useAppStore } from '../store/AppStore'

export function DirectorDashboardPage() {
  const { data, getUserById, approveRequest } = useAppStore()

  if (!data) {
    return null
  }

  const requests = (data.requests ?? []).filter((request) => request.status === 'CREATED')

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Direktor paneli</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Tasdiqlash navbati</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Direktor faqat arizani tasdiqlaydi. Tasdiqlangan ariza procurement bosqichiga qaytadi.
        </p>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Arizalar</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Imzo kutayotgan arizalar</h3>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
            {requests.length} ta kutilmoqda
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {requests.map((request) => {
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
                    onClick={() => approveRequest(request.id)}
                    className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Tasdiqlash
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
                        Holati: {requestStatusLabel(request.status)} | Kutilgan narx: ${item.expectedPrice.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.specs || 'Xarakteristika yo‘q'}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
