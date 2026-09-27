// ─── Domain Types (Kitabwalah Real Backend) ───────────────────────────────────

export type User = {
  id: number
  role: string
  displayName: string
  phone: string
  email: string | null
}

export type AuthResponse = {
  accessToken: string
  expiresInSeconds: number
  user: User
  isNewUser: boolean
}

export type VendorProfileView = {
  id: number
  storeName: string
  storeSlug: string
  storeDescription: string | null
  storeLogo: string | null
  storeBanner: string | null
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  gstin: string | null
  commissionRate: string
  averageRating: string
  totalReviews: number
  totalOrders: number
  totalProducts: number
  isVerified: boolean
  vacationMode: boolean
  vacationMessage: string | null
  isActive: boolean
  kycStatus?: string
  applicationStatus?: string
  createdAt: string
}

export type VendorEarningsView = {
  totals: {
    totalEarnings: string
    totalWithdrawn: string
    pendingBalance: string
  }
  live: {
    grossSales: string
    commissionDeducted: string
    netEarnings: string
    itemCount: number
  }
  settlement: {
    pending: string
    processing: string
    completed: string
    failed: string
    awaitingSettlement: string
  }
}

export type VendorOrderItem = {
  orderItemId: number
  productId: number
  productName: string
  quantity: number
  price: string
}

export type VendorOrderShipTo = {
  name: string
  city: string
  state: string
  pincode: string
} | null

export type VendorOrder = {
  orderId: number
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  isCod: boolean
  placedAt: string
  deliveredAt: string | null
  shipTo: VendorOrderShipTo
  vendorSubtotal: string
  vendorCommission: string
  vendorEarning: string
  settlementStatus: string
  vendorStatus: string
  items: VendorOrderItem[]
}

export type WithdrawalBalance = {
  availableToWithdraw: string
  reserved: string
  totalEarnings: string
  totalWithdrawn: string
  minimumRequest: string
  payoutDetailsOnFile: boolean
}

export type WithdrawalItem = {
  id: number
  amount: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'processing' | string
  requestedAt: string
  processedAt: string | null
  paymentReference: string | null
  adminNote: string | null
}

export type ProductCategory = {
  id: number
  name: string
  slug?: string
}

export type ProductImage = {
  id: number
  imageUrl: string
  isPrimary: boolean
  displayOrder: number
}

export type ProductCityPrice = {
  cityId: number
  price: string
}

export type ProductView = {
  id: number
  vendorId?: number
  title: string
  slug?: string
  regularPrice: string
  salePrice?: string | null
  basePrice?: string | null
  gstRate?: number
  hsnCode?: string | null
  sku: string
  isbn?: string | null
  author?: string | null
  publisher?: string | null
  edition?: string | null
  language?: string | null
  binding?: string | null
  genre?: string | null
  pages?: number | null
  bookFormat?: string | null
  condition?: string | null
  stockQuantity: number
  manageStock?: boolean
  inStock: boolean
  status: 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected' | string
  rejectionReason?: string | null
  returnable?: boolean
  returnWindow?: number
  categories?: ProductCategory[]
  images?: ProductImage[]
  cityPrices?: ProductCityPrice[]
  reReviewTriggered?: boolean
  createdAt?: string
  updatedAt?: string
}

export type VendorShipment = {
  id: number
  orderId: number
  orderNumber: string
  shipmentNumber?: string
  trackingNumber?: string
  courierName?: string
  status: string
  createdAt: string
}

export type PaginatedResponse<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Backward Compatible Aliases ─────────────────────────────────────────────

export type Product = ProductView
export type Order = VendorOrder
export type Withdrawal = WithdrawalItem
export type Store = VendorProfileView
export type Status = string
export type TicketStatus = string
export type WithdrawalStatus = string
export type PaymentMethod = string

export type Review = {
  id: number | string
  customer: string
  product: string
  rating: number
  text: string
  date: string
  response?: string
}

export type Notice = {
  id: number | string
  type: string
  title: string
  body: string
  time: string
  read: boolean
}

export type TicketMessage = {
  from: 'You' | 'Kitabwalah Support' | string
  text: string
  time: string
}

export type Ticket = {
  id: number | string
  category: string
  subject: string
  status: TicketStatus
  date: string
  messages: TicketMessage[]
}

// ─── UI Navigation Types ──────────────────────────────────────────────────────

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
