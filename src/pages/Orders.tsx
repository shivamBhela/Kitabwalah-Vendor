import { useState, useEffect } from 'react'
import { vendorApi, errMsg } from '../api'
import { currency, toDate } from '../data'
import { Badge, Card, Empty, PageHeader, Pagination } from '../components/ui'
import type { VendorOrder } from '../types'

type OrdersProps = {
  open: (o: VendorOrder) => void
  notify: (m: string) => void
}

export function Orders({ open, notify }: OrdersProps) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ items: VendorOrder[]; totalPages: number; total: number }>({
    items: [],
    totalPages: 1,
    total: 0,
  })

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await vendorApi.getOrders({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        page,
        limit: 20,
      })
      setData({
        items: res.items || [],
        totalPages: res.totalPages || 1,
        total: res.total || 0,
      })
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter, page])

  const statuses = ['All', 'confirmed', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered', 'returned']

  return (
    <>
      <PageHeader crumb="Sales" title="Orders" desc="View and process vendor orders." />
      <div className="tabs">
        {statuses.map((s) => (
          <button
            key={s}
            className={statusFilter === s ? 'selected' : ''}
            onClick={() => {
              setStatusFilter(s)
              setPage(1)
            }}
          >
            {s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      <Card className="table-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }} className="muted">Loading orders…</div>
        ) : data.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <button className="link" onClick={() => open(o)}>
                        {o.orderNumber || `#${o.orderId}`}
                      </button>
                      <br /><small>{toDate(o.placedAt)}</small>
                    </td>
                    <td>{o.shipTo?.name || 'Customer'}</td>
                    <td>{o.items?.[0]?.productName || 'Order Items'}</td>
                    <td><b>{currency(o.vendorEarning || o.vendorSubtotal)}</b></td>
                    <td><Badge value={o.vendorStatus || o.orderStatus} /></td>
                    <td>
                      <button className="table-button" onClick={() => open(o)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No orders found" text="Vendor orders will appear here when placed." />
        )}
        <Pagination label={`${data.total} orders`} page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </Card>
    </>
  )
}
