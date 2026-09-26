import type { AppData } from '../types'

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const seed: AppData = {
  products: [],
  orders: [],
  reviews: [],
  notices: [],
  tickets: [],
  withdrawals: [],
  store: {
    name: '',
    description: '',
    vacation: false,
    commission: 12,
    rating: 0,
    reviews: 0,
    followers: 0,
  },
  availableBalance: 0,
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kitabwalah-vendor-v1'

export function loadData(): AppData {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as AppData) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export const currency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

export const toDate = (): string =>
  new Date().toLocaleDateString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
