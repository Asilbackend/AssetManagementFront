import type { AssetAttribute } from '../../types'

type DynamicFieldProps = {
  field: AssetAttribute
  value: string
  onChange: (value: string) => void
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const sharedClassName =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100'

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">
        {field.label}
        {field.required ? ' *' : ''}
      </span>

      {field.type === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={sharedClassName}
          required={field.required}
        >
          <option value="">Tanlang</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={sharedClassName}
          required={field.required}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={sharedClassName}
          required={field.required}
        />
      )}
    </label>
  )
}
