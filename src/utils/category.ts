import type { CategoryDefinition, CategoryType } from '../types'

export const categoryTypeTabs: Array<{
  id: 'all' | CategoryType
  label: string
  shortLabel: string
}> = [
  { id: 'all', label: 'All', shortLabel: 'All' },
  { id: 'HARDWARE', label: 'Hardware', shortLabel: 'Hardware' },
  { id: 'SOFTWARE', label: 'Software', shortLabel: 'Software' },
  { id: 'NON_IT', label: 'Non-IT Assets', shortLabel: 'Non-IT' },
]

export const categoryTypeLabels: Record<CategoryType, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  NON_IT: 'Non-IT Assets',
}

export const categoryTypeDescriptions: Record<CategoryType, string> = {
  HARDWARE: 'Physical infrastructure, devices, compute, and storage assets.',
  SOFTWARE: 'Platforms, licenses, subscriptions, and security systems.',
  NON_IT: 'Office, facility, and other non-IT asset groups.',
}

export const categoryTypeTone: Record<CategoryType, string> = {
  HARDWARE: 'bg-sky-100 text-sky-700',
  SOFTWARE: 'bg-violet-100 text-violet-700',
  NON_IT: 'bg-emerald-100 text-emerald-700',
}

export const isCategoryType = (value: string): value is CategoryType =>
  value === 'HARDWARE' || value === 'SOFTWARE' || value === 'NON_IT'

export const filterCategoriesByType = (
  categories: CategoryDefinition[],
  categoryType: CategoryType | 'all',
) =>
  categoryType === 'all'
    ? categories
    : categories.filter((category) => category.categoryType === categoryType)
