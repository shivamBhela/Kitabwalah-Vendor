export type Status = 'New' | 'Processing' | 'Ready for Dispatch' | 'Dispatched' | 'Delivered' | 'Returned'
export type Product = { id: string; name: string; category: string; price: number; stock: number; threshold: number; sku: string; status: 'Active'|'Inactive'; updated: string; color: string; cityPrices: { city: string; price: number }[]; image?: string }
export type Order = { id: string; customer: string; phone: string; product: string; productId: string; quantity: number; amount: number; status: Status; date: string; payment: 'Paid'|'COD'; address: string; courier: string; shipment: string; pickupCode: string; handover: boolean }
export type Review = { id: string; customer: string; product: string; rating: number; text: string; date: string; response?: string }
export type Notice = { id: string; type: string; title: string; body: string; time: string; read: boolean }
export type Ticket = { id: string; category: string; subject: string; status: 'Open'|'In Progress'|'Waiting for Vendor'|'Resolved'|'Closed'; date: string; messages: { from: 'You'|'Kitabwalah Support'; text: string; time: string }[] }
export type Withdrawal = { id: string; amount: number; date: string; method: string; status: 'Pending'|'Approved'|'Rejected'|'Processed' }
export type Store = { name: string; description: string; vacation: boolean; commission: number; rating: number; reviews: number; followers: number }
export type AppData = { products: Product[]; orders: Order[]; reviews: Review[]; notices: Notice[]; tickets: Ticket[]; withdrawals: Withdrawal[]; store: Store; availableBalance: number }

export const seed: AppData = {
  products: [],
  orders: [],
  reviews: [],
  notices: [],
  tickets: [],
  withdrawals: [],
  store: { name: '', description: '', vacation: false, commission: 12, rating: 0, reviews: 0, followers: 0 },
  availableBalance: 0
}

const KEY = 'kitabwalah-vendor-v1'

export function loadData(): AppData {
  try {
    const value = localStorage.getItem(KEY)
    return value ? (JSON.parse(value) as AppData) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export const toDate = () =>
  new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })

