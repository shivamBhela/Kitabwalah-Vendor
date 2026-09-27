import { useState } from 'react'
import { vendorApi, errMsg } from '../api'
import { currency, toDate } from '../data'
import { Card, PageHeader } from '../components/ui'
import type { VendorOrder } from '../types'

type OrderDetailProps = {
  order: VendorOrder
  onBack: () => void
  onRefresh: () => void
  notify: (m: string) => void
}

export function OrderDetail({
  order,
  onBack,
  onRefresh,
  notify,
}: OrderDetailProps) {
  const [updating, setUpdating] = useState(false)

  const handleUpdateStatus = async (newStatus: 'confirmed' | 'processing') => {
    const firstItem = order.items?.[0]
    if (!firstItem) return
    setUpdating(true)
    try {
      await vendorApi.updateOrderItemStatus(order.orderId, firstItem.orderItemId, newStatus)
      notify(`Order item status updated to ${newStatus}`)
      onRefresh()
      onBack()
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setUpdating(false)
    }
  }

  const currentStatus = order.vendorStatus || order.orderStatus || 'pending'

  return (
    <>
      <button className="back-link page-back" onClick={onBack}>
        ← Back to orders
      </button>
      <PageHeader
        crumb="Sales / Orders"
        title={order.orderNumber || `Order #${order.orderId}`}
        desc={`Placed ${toDate(order.placedAt)} · Payment: ${order.isCod ? 'COD' : order.paymentMethod}`}
        action={
          <div className="header-actions">
            {currentStatus === 'pending' && (
              <button className="button" disabled={updating} onClick={() => handleUpdateStatus('confirmed')}>
                Confirm Order Item
              </button>
            )}
            {currentStatus === 'confirmed' && (
              <button className="button" disabled={updating} onClick={() => handleUpdateStatus('processing')}>
                Mark as Processing
              </button>
            )}
          </div>
        }
      />
      <div className="detail-layout">
        <section>
          <Card title="Order Items">
            {order.items?.map((item) => (
              <div key={item.orderItemId} className="order-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <b>{item.productName}</b>
                  <p>{item.quantity} × {currency(item.price)}</p>
                </div>
                <strong>{currency(item.price)}</strong>
              </div>
            ))}
          </Card>
        </section>
        <aside>
          <Card title="Customer & Delivery">
            <b>{order.shipTo?.name || 'Customer'}</b>
            <p>{order.shipTo?.city}, {order.shipTo?.state} - {order.shipTo?.pincode}</p>
          </Card>
          <Card title="Vendor Financial Breakdown" style={{ marginTop: 16 }}>
            <p>Subtotal: {currency(order.vendorSubtotal)}</p>
            <p>Commission: {currency(order.vendorCommission)}</p>
            <strong style={{ display: 'block', marginTop: 8 }}>Net Earning: {currency(order.vendorEarning)}</strong>
          </Card>
        </aside>
      </div>
    </>
  )
}
