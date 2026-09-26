import type { NavItem, Status } from '../types'

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { page: 'Dashboard',         icon: '▦' },
  { page: 'Orders',            icon: '▤' },
  { page: 'Products',          icon: '▣' },
  { page: 'Inventory',         icon: '◫' },
  { page: 'Store Management',  icon: '⌂' },
  { page: 'Shipments',         icon: '▱' },
  { page: 'Returns',           icon: '↶' },
  { page: 'Reviews',           icon: '☆' },
  { page: 'Earnings & Payouts',icon: '₹' },
  { page: 'Analytics',         icon: '⌁' },
  { page: 'Notifications',     icon: '♧' },
  { page: 'Support',           icon: '?' },
]

// ─── Order Statuses ───────────────────────────────────────────────────────────

export const ORDER_STATUSES: Status[] = [
  'New',
  'Processing',
  'Ready for Dispatch',
  'Dispatched',
  'Delivered',
  'Returned',
]

export const NEXT_STATUS: Record<Status, Status | null> = {
  New:                'Processing',
  Processing:         'Ready for Dispatch',
  'Ready for Dispatch': 'Dispatched',
  Dispatched:         'Delivered',
  Delivered:          null,
  Returned:           null,
}

// ─── Product Fields ───────────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  'Books',
  'Self Help',
  'Finance',
  'Lifestyle',
  'Productivity',
]

// ─── Support Ticket Categories ────────────────────────────────────────────────

export const TICKET_CATEGORIES = [
  'Shipping',
  'Payout',
  'Orders',
  'Products',
  'Account & KYC',
  'Other',
]
