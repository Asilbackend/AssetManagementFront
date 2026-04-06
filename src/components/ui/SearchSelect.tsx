import { useMemo, useState } from 'react'

type Option = {
  label: string
  value: string
}

export function SearchSelect({
  label,
  options,
  value,
  placeholder,
  onChange,
  variant = 'dark',
}: {
  label: string
  options: Option[]
  value: string
  placeholder: string
  onChange: (value: string) => void
  variant?: 'dark' | 'light'
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return options
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalized))
  }, [options, query])

  const inputClass =
    variant === 'light'
      ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-300'
      : 'border-white/10 bg-white/5 text-white focus:border-cyan-400/50'
  const panelClass =
    variant === 'light'
      ? 'border-slate-200 bg-white'
      : 'border-white/10 bg-slate-950/60'
  const inactiveButtonClass =
    variant === 'light'
      ? 'text-slate-700 hover:bg-amber-50 hover:text-slate-900'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  const activeButtonClass =
    variant === 'light'
      ? 'bg-amber-50 text-amber-800'
      : 'bg-cyan-500/15 text-cyan-200'

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${placeholder.toLowerCase()}...`}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${inputClass}`}
      />
      <div className={`max-h-56 overflow-auto rounded-2xl border ${panelClass}`}>
        {filtered.map((option) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                isActive ? activeButtonClass : inactiveButtonClass
              }`}
            >
              <span>{option.label}</span>
              {isActive ? <span className="text-[10px] uppercase tracking-[0.2em]">Selected</span> : null}
            </button>
          )
        })}
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">No matching users found.</div>
        ) : null}
      </div>
    </div>
  )
}
