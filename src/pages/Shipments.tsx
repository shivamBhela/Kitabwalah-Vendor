import { Badge, Card, Empty, PageHeader } from '../components/ui'
import type { VendorOrder, VendorShipment } from '../types'

type ShipmentsProps = {
  shipments: VendorShipment[]
  orders: VendorOrder[]
  open: (o: VendorOrder) => void
}

export function Shipments({
  shipments,
}: ShipmentsProps) {
  return (
    <>
      <PageHeader crumb="Fulfilment" title="Shipments" desc="Track package deliveries and shipments." />
      <Card className="table-card">
        {shipments.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Order Number</th>
                  <th>Courier</th>
                  <th>Tracking Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id}>
                    <td><b>#{s.id}</b></td>
                    <td>{s.orderNumber}</td>
                    <td>{s.courierName || 'Courier'}</td>
                    <td>{s.trackingNumber || 'N/A'}</td>
                    <td><Badge value={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No active shipments" text="Shipments will be generated when orders are dispatched." />
        )}
      </Card>
    </>
  )
}
