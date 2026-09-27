import { Card, Metric, PageHeader, Empty, Book } from '../components/ui'
import { OrderTable } from '../components/shared'
import { RevenueChart } from '../components/charts'
import { currency } from '../lib/data'
import type {
  VendorProfileView,
  VendorOrder,
  ProductView,
  VendorEarningsView,
  WithdrawalBalance,
  Page,
} from '../types'

type DashboardProps = {
  profile: VendorProfileView | null
  earnings: VendorEarningsView | null
  withdrawalBalance: WithdrawalBalance | null
  orders: VendorOrder[]
  products: ProductView[]
  go: (p: Page) => void
  openOrder: (o: VendorOrder) => void
}

const ORDER_STATUSES = [
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'dispatched',
  'delivered',
  'returned',
]

export function Dashboard({
  profile,
  earnings,
  withdrawalBalance,
  orders,
  products,
  go,
  openOrder,
}: DashboardProps) {
  const lowStock = products.filter((p) => p.stockQuantity <= 10)
  const pendingOrders = orders.filter((o) =>
    ['confirmed', 'processing', 'pending'].includes(
      (o.vendorStatus || o.orderStatus || '').toLowerCase()
    )
  ).length

  const grossSales = earnings?.live?.grossSales || '0.00'
  const availableBalance = withdrawalBalance?.availableToWithdraw || '0.00'
  const totalProducts = profile?.totalProducts ?? products.length

  const todayStr = new Date().toISOString().split('T')[0]
  const todaysOrdersCount = orders.filter((o) => o.placedAt && o.placedAt.startsWith(todayStr)).length

  return (
    <>
      <PageHeader
        crumb="Overview"
        title="Dashboard Overview"
        desc={profile?.storeName ? `Welcome back, ${profile.storeName}.` : "Here's how your store is performing."}
        action={
          <button className="button" onClick={() => go('Products')}>
            + Add product
          </button>
        }
      />

      {/* ── KPI Metrics ── */}
      <div className="metric-grid">
        <Metric label="Gross sales" value={currency(grossSales)} trend="Live revenue" />
        <Metric label="Today's orders" value={String(todaysOrdersCount)} trend="Placed today" />
        <Metric label="Pending orders" value={String(pendingOrders)} alert={pendingOrders > 0 ? "Needs action" : undefined} />
        <Metric label="Total products" value={String(totalProducts)} trend="In catalog" />
        <Metric label="Low stock" value={String(lowStock.length)} alert={lowStock.length > 0 ? "Restock soon" : undefined} />
        <Metric label="Available balance" value={currency(availableBalance)} trend="Ready to withdraw" />
      </div>

      {/* ── Sales Chart + Order Overview ── */}
      <div className="dashboard-grid">
        <Card className="chart-card" title="Sales performance" subtitle="Revenue over time">
          <div className="chart-controls">
            <button className="selected">30 Days</button>
            <button>7 Days</button>
            <button>3 Months</button>
          </div>
          <RevenueChart />
          <div className="chart-legend">
            <span>
              <i className="green-dot" />
              Revenue <b>{currency(grossSales)}</b>
            </span>
            <span>Orders <b>{orders.length}</b></span>
          </div>
        </Card>

        <Card title="Order overview" subtitle="Across all orders">
          <div className="order-overview">
            {ORDER_STATUSES.map((s, i) => {
              const count = orders.filter(
                (o) => (o.vendorStatus || o.orderStatus || '').toLowerCase() === s
              ).length
              return (
                <button key={s} onClick={() => go('Orders')}>
                  <strong>{count}</strong>
                  <span className={`status-dot d${i}`} />
                  {s.replaceAll('_', ' ')}
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Top Products + Pending Actions ── */}
      <div className="split-grid">
        <Card
          title="Top products"
          subtitle="Catalog items"
          action={
            <button className="text-button" onClick={() => go('Products')}>
              View all
            </button>
          }
        >
          <div className="product-rank">
            {products.length ? (
              products.slice(0, 4).map((p) => (
                <div key={p.id}>
                  <Book product={p} />
                  <span className="rank-name">
                    <b>{p.title}</b>
                    <small>SKU: {p.sku}</small>
                  </span>
                  <strong>{currency(p.regularPrice)}</strong>
                </div>
              ))
            ) : (
              <Empty title="No products in catalog" text="Add products to start selling." />
            )}
          </div>
        </Card>

        <Card title="Pending actions" subtitle="Keep your store moving">
          <div className="action-list">
            <button onClick={() => go('Orders')}>
              <span className="action-icon orange">▤</span>
              <span>
                <b>{pendingOrders} orders requiring action</b>
                <small>Confirm or process items</small>
              </span>
              <i>›</i>
            </button>
            <button onClick={() => go('Inventory')}>
              <span className="action-icon red">!</span>
              <span>
                <b>{lowStock.length} products low on stock</b>
                <small>Prevent missed sales</small>
              </span>
              <i>›</i>
            </button>
          </div>
        </Card>
      </div>

      {/* ── Recent Orders ── */}
      <Card
        title="Recent orders"
        subtitle="Latest activity"
        action={
          <button className="text-button" onClick={() => go('Orders')}>
            View all orders
          </button>
        }
      >
        {orders.length ? (
          <OrderTable orders={orders.slice(0, 4)} onOpen={openOrder} />
        ) : (
          <Empty title="No recent orders" text="Orders will appear here when customers purchase your books." />
        )}
      </Card>
    </>
  )
}
