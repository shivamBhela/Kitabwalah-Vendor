import { Card, Metric, PageHeader, Empty } from '../components/ui'
import { OrderTable } from '../components/shared'
import { RevenueChart } from '../components/charts'
import { Book } from '../components/ui'
import { currency } from '../lib/data'
import { ORDER_STATUSES } from '../lib/constants'
import type { AppData, Order, Page } from '../types'

type DashboardProps = {
  data: AppData
  go: (p: Page) => void
  openOrder: (o: Order) => void
}

export function Dashboard({ data, go, openOrder }: DashboardProps) {
  const lowStock = data.products.filter((p) => p.stock <= p.threshold)
  const newOrders = data.orders.filter((o) => o.status === 'New').length
  const totalSalesAmount = data.orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.amount, 0)
  const todaysOrdersCount = data.orders.filter(
    (o) => o.date.includes('Today') || o.date.includes('Sep 06')
  ).length

  return (
    <>
      <PageHeader
        crumb="Overview"
        title="Dashboard Overview"
        desc="Here's how your store is performing."
        action={
          <button className="button" onClick={() => go('Products')}>
            + Add product
          </button>
        }
      />

      {/* ── KPI Metrics ── */}
      <div className="metric-grid">
        <Metric label="Total sales" value={currency(totalSalesAmount)} trend="Delivered orders revenue" />
        <Metric label="Today's orders" value={String(todaysOrdersCount)} trend="Placed today" />
        <Metric label="Pending orders" value={String(newOrders)} alert="Needs your attention" />
        <Metric label="Total products" value={String(data.products.length)} trend="All catalog items" />
        <Metric label="Low stock" value={String(lowStock.length)} alert="Restock soon" />
        <Metric label="Available balance" value={currency(data.availableBalance)} trend="Ready to withdraw" />
      </div>

      {/* ── Sales Chart + Order Overview ── */}
      <div className="dashboard-grid">
        <Card className="chart-card" title="Sales performance" subtitle="Revenue over time">
          <div className="chart-controls">
            <button className="selected">30 Days</button>
            <button>7 Days</button>
            <button>3 Months</button>
            <button>Custom</button>
          </div>
          <RevenueChart />
          <div className="chart-legend">
            <span>
              <i className="green-dot" />
              Revenue <b>{currency(totalSalesAmount)}</b>
            </span>
            <span>Orders <b>{data.orders.length}</b></span>
          </div>
        </Card>

        <Card title="Order overview" subtitle="Across all orders">
          <div className="order-overview">
            {ORDER_STATUSES.map((s, i) => (
              <button key={s} onClick={() => go('Orders')}>
                <strong>
                  {data.orders.filter((o) => o.status === s).length}
                </strong>
                <span className={`status-dot d${i}`} />
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Top Products + Pending Actions ── */}
      <div className="split-grid">
        <Card
          title="Top products"
          subtitle="By revenue this month"
          action={
            <button className="text-button" onClick={() => go('Products')}>
              View all
            </button>
          }
        >
          <div className="product-rank">
            {data.products.length ? (
              data.products.slice(0, 4).map((p) => (
                <div key={p.id}>
                  <Book product={p} />
                  <span className="rank-name">
                    <b>{p.name}</b>
                    <small>0 units sold</small>
                  </span>
                  <strong>{currency(p.price)}</strong>
                </div>
              ))
            ) : (
              <Empty title="No products in catalog" text="Add products to start tracking top items." />
            )}
          </div>
        </Card>

        <Card title="Pending actions" subtitle="Keep your store moving">
          <div className="action-list">
            <button onClick={() => go('Orders')}>
              <span className="action-icon orange">▤</span>
              <span>
                <b>{newOrders} new orders</b>
                <small>Requires action</small>
              </span>
              <i>›</i>
            </button>
            <button onClick={() => go('Inventory')}>
              <span className="action-icon red">!</span>
              <span>
                <b>{lowStock.length} products need restocking</b>
                <small>Prevent missed sales</small>
              </span>
              <i>›</i>
            </button>
            <button onClick={() => go('Returns')}>
              <span className="action-icon blue">↶</span>
              <span>
                <b>0 return requests</b>
                <small>Review customer requests</small>
              </span>
              <i>›</i>
            </button>
          </div>
        </Card>
      </div>

      {/* ── Recent Orders + Reviews ── */}
      <div className="split-grid">
        <Card
          title="Recent orders"
          subtitle="Latest activity"
          action={
            <button className="text-button" onClick={() => go('Orders')}>
              View all orders
            </button>
          }
        >
          {data.orders.length ? (
            <OrderTable orders={data.orders.slice(0, 4)} onOpen={openOrder} />
          ) : (
            <Empty title="No recent orders" text="Orders will appear here when placed." />
          )}
        </Card>

        <Card
          title="Recent reviews"
          subtitle="What customers are saying"
          action={
            <button className="text-button" onClick={() => go('Reviews')}>
              Manage reviews
            </button>
          }
        >
          <div className="review-list">
            {data.reviews.length ? (
              data.reviews.slice(0, 3).map((r) => (
                <div key={r.id}>
                  <p>"{r.text}"</p>
                  <small>
                    <b>{r.customer}</b> · {r.product}
                  </small>
                </div>
              ))
            ) : (
              <Empty title="No reviews yet" text="Customer reviews will be shown here." />
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
