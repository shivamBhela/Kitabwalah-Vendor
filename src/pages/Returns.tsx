import { Badge, Card, Empty, PageHeader } from '../components/ui'
import type { VendorOrder } from '../types'

type ReturnsProps = {
  orders: VendorOrder[]
}

export function Returns({ orders }: ReturnsProps) {
  const returned = orders.filter((o) => (o.vendorStatus || o.orderStatus || '').toLowerCase() === 'returned')
  return (
    <>
      <PageHeader crumb="Fulfilment" title="Returns" desc="Review return requests." />
      <Card className="table-card">
        {returned.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {returned.map((o) => (
                  <tr key={o.orderId}>
                    <td><b>{o.orderNumber}</b></td>
                    <td>{o.shipTo?.name || 'Customer'}</td>
                    <td>{o.items?.[0]?.productName || 'Item'}</td>
                    <td><Badge value="Returned" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No return requests" text="Customer returns will appear here." />
        )}
      </Card>
    </>
  )
}
