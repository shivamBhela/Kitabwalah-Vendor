export * from './types'

// ─── Formatters & Utilities ───────────────────────────────────────────────────

export const currency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '₹0.00'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export const toDate = (isoString?: string | null): string => {
  if (!isoString) return new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function getDeviceId(): string {
  let id = localStorage.getItem('kb-device-id')
  if (!id) {
    id = 'web-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
    localStorage.setItem('kb-device-id', id)
  }
  return id
}
