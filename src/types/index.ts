// ─── Domain Types ─────────────────────────────────────────────────────────────

export type Status =
  | 'New'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'Returned'

export type ProductStatus = 'Active' | 'Inactive'

export type TicketStatus =
  | 'Open'
  | 'In Progress'
  | 'Waiting for Vendor'
  | 'Resolved'
  | 'Closed'

export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processed'

export type PaymentMethod = 'Paid' | 'COD'

export type MessageAuthor = 'You' | 'Kitabwalah Support'

// ─── Entities ─────────────────────────────────────────────────────────────────

export type CityPrice = {
  city: string
  price: number
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  threshold: number
  sku: string
  status: ProductStatus
  updated: string
  color: string
  cityPrices: CityPrice[]
  image?: string
}

export type Order = {
  id: string
  customer: string
  phone: string
  product: string
  productId: string
  quantity: number
  amount: number
  status: Status
  date: string
  payment: PaymentMethod
  address: string
  courier: string
  shipment: string
  pickupCode: string
  handover: boolean
}

export type Review = {
  id: string
  customer: string
  product: string
  rating: number
  text: string
  date: string
  response?: string
}

export type Notice = {
  id: string
  type: string
  title: string
  body: string
  time: string
  read: boolean
}

export type TicketMessage = {
  from: MessageAuthor
  text: string
  time: string
}

export type Ticket = {
  id: string
  category: string
  subject: string
  status: TicketStatus
  date: string
  messages: TicketMessage[]
}

export type Withdrawal = {
  id: string
  amount: number
  date: string
  method: string
  status: WithdrawalStatus
}

export type Store = {
  name: string
  description: string
  vacation: boolean
  commission: number
  rating: number
  reviews: number
  followers: number
}

// ─── App State ────────────────────────────────────────────────────────────────

export type AppData = {
  products: Product[]
  orders: Order[]
  reviews: Review[]
  notices: Notice[]
  tickets: Ticket[]
  withdrawals: Withdrawal[]
  store: Store
  availableBalance: number
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export type Page =
  | 'Dashboard'
  | 'Orders'
  | 'Products'
  | 'Inventory'
  | 'Store Management'
  | 'Shipments'
  | 'Returns'
  | 'Reviews'
  | 'Earnings & Payouts'
  | 'Analytics'
  | 'Notifications'
  | 'Support'
  | 'Settings'
  | 'Vendor Profile'
  | 'Bank Details'

export type NavItem = {
  page: Page
  icon: string
}
