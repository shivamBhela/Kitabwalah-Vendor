import { currency } from '../data'
import { Metric, PageHeader } from '../components/ui'
import type { ProductView, VendorEarningsView, VendorOrder } from '../types'

type AnalyticsProps = {
  earnings: VendorEarningsView | null
  orders: VendorOrder[]
  products: ProductView[]
}

export function Analytics({
  earnings,
  orders,
  products,
}: AnalyticsProps) {
  return (
    <>
      <PageHeader crumb="Insights" title="Analytics" desc="Store performance metrics." />
      <div className="metric-grid four">
        <Metric label="Gross Sales" value={currency(earnings?.live?.grossSales)} />
        <Metric label="Orders Count" value={String(orders.length)} />
        <Metric label="Catalog Products" value={String(products.length)} />
        <Metric label="Items Sold" value={String(earnings?.live?.itemCount || 0)} />
      </div>
    </>
  )
}
