import { currency } from '../../lib/data'
import { ORDER_STATUSES } from '../../lib/constants'
import { Badge, Book } from '../ui'
import type { Order, Product, Status } from '../../types'

// ─── Order Table ──────────────────────────────────────────────────────────────

type OrderTableProps = {
  orders: Order[]
  onOpen: (o: Order) => void
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
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <button className="link" onClick={() => onOpen(o)}>
                  {o.id}
                </button>
                <small>{o.date}</small>
              </td>
              <td>{o.customer}</td>
              <td>{o.product}</td>
              {full && (
                <>
                  <td>{o.quantity}</td>
                  <td>{o.payment}</td>
                </>
              )}
              <td>
                <b>{currency(o.amount)}</b>
              </td>
              <td>
                <Badge value={o.status} />
              </td>
              <td>
                <button className="table-button" onClick={() => onOpen(o)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Order Timeline ───────────────────────────────────────────────────────────

export function Timeline({ status }: { status: Status }) {
  const at = ORDER_STATUSES.indexOf(status)
  return (
    <div className="timeline">
      {ORDER_STATUSES.slice(0, 5).map((s, i) => (
        <div key={s} className={i <= at ? 'complete' : ''}>
          <i>{i < at ? '✓' : i === at ? '●' : '○'}</i>
          <span>
            <b>{s}</b>
            <small>{i < at ? 'Completed' : i === at ? 'Current status' : 'Pending'}</small>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Book Rank Row ────────────────────────────────────────────────────────────

type BookRankRowProps = {
  product: Product
  unitsSold: number
  revenue: number
  rank: number
}

export function BookRankRow({ product, unitsSold, revenue, rank }: BookRankRowProps) {
  return (
    <div>
      <Book product={product} />
      <span className="rank-name">
        <b>{product.name}</b>
        <small>{unitsSold} units sold</small>
      </span>
      <strong>{currency(revenue)}</strong>
    </div>
  )
}
