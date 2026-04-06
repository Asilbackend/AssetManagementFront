export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'dark',
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  variant?: 'dark' | 'light'
}) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  const textClass = variant === 'light' ? 'text-slate-500' : 'text-slate-400'
  const buttonClass =
    variant === 'light'
      ? 'rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50'
      : 'rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5'
  const inactivePageClass =
    variant === 'light'
      ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
      : 'border border-white/10 text-slate-300 hover:bg-white/5'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-inherit px-4 py-4">
      <p className={`text-sm ${textClass}`}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={buttonClass}
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              page === currentPage
                ? 'bg-cyan-400 text-slate-950'
                : inactivePageClass
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={buttonClass}
        >
          Next
        </button>
      </div>
    </div>
  )
}
