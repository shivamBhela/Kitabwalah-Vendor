import { currency, toDate } from '../../lib/data'
import { Badge, Book } from '../ui'
import type { VendorOrder, ProductView } from '../../types'

// ─── Order Table ──────────────────────────────────────────────────────────────

type OrderTableProps = {
  orders: VendorOrder[]
  onOpen: (o: VendorOrder) => void
  full?: boolean
}

export function OrderTable({ orders, onOpen, full = false }: OrderTableProps) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product</th>
            {full && (
              <>
                <th>Quantity</th>
                <th>Payment</th>
              </>
            )}
            <th>Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const customerName = o.shipTo?.name || 'Customer'
            const firstItem = o.items?.[0]
            const productName = firstItem?.productName || 'Order Items'
            const quantity = firstItem?.quantity || 1
            const paymentType = o.isCod ? 'COD' : o.paymentMethod || 'Paid'
            const status = o.vendorStatus || o.orderStatus || 'pending'
            const amount = o.vendorEarning || o.vendorSubtotal || '0.00'

            return (
              <tr key={o.orderId}>
                <td>
                  <button className="link" onClick={() => onOpen(o)}>
                    {o.orderNumber || `#${o.orderId}`}
                  </button>
                  <small>{toDate(o.placedAt)}</small>
                </td>
                <td>{customerName}</td>
                <td>{productName}</td>
                {full && (
                  <>
                    <td>{quantity}</td>
                    <td>{paymentType}</td>
                  </>
                )}
                <td>
                  <b>{currency(amount)}</b>
                </td>
                <td>
                  <Badge value={status} />
                </td>
                <td>
                  <button className="table-button" onClick={() => onOpen(o)}>
                    View
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Order Timeline ───────────────────────────────────────────────────────────

const STAGES = ['confirmed', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered']

export function Timeline({ status }: { status: string }) {
  const normalizedStatus = status ? status.toLowerCase() : ''
  const at = STAGES.indexOf(normalizedStatus)
  return (
    <div className="timeline">
      {STAGES.map((s, i) => (
        <div key={s} className={i <= at ? 'complete' : ''}>
          <i>{i < at ? '✓' : i === at ? '●' : '○'}</i>
          <span>
            <b>{s.replaceAll('_', ' ')}</b>
            <small>{i < at ? 'Completed' : i === at ? 'Current status' : 'Pending'}</small>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Book Rank Row ────────────────────────────────────────────────────────────

type BookRankRowProps = {
  product: ProductView
  unitsSold: number
  revenue: string | number
  rank: number
}

export function BookRankRow({ product, unitsSold, revenue }: BookRankRowProps) {
  return (
    <div>
      <Book product={product} />
      <span className="rank-name">
        <b>{product.title}</b>
        <small>{unitsSold} units sold</small>
      </span>
      <strong>{currency(revenue)}</strong>
    </div>
  )
}
