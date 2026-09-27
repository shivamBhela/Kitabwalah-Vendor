import { useState, useEffect } from 'react'
import { vendorApi } from './api'
import type {
  User,
  VendorProfileView,
  VendorEarningsView,
  VendorOrder,
  WithdrawalBalance,
  WithdrawalItem,
  ProductView,
  VendorShipment,
  Page,
} from './data'
import {
  Dashboard,
  Auth,
  PendingApproval,
  Products,
  ProductEditor,
  Inventory,
  Orders,
  OrderDetail,
  Shipments,
  Returns,
  Reviews,
  Earnings,
  Analytics,
  Notifications,
  Support,
  StoreProfile,
  Settings,
  BankDetails,
} from './pages'

const nav: { page: Page; icon: string }[] = [
  { page: 'Dashboard', icon: '▦' },
  { page: 'Orders', icon: '▤' },
  { page: 'Products', icon: '▣' },
  { page: 'Inventory', icon: '◫' },
  { page: 'Store Management', icon: '⌂' },
  { page: 'Shipments', icon: '▱' },
  { page: 'Returns', icon: '↶' },
  { page: 'Reviews', icon: '☆' },
  { page: 'Earnings & Payouts', icon: '₹' },
  { page: 'Analytics', icon: '⌁' },
  { page: 'Notifications', icon: '♧' },
  { page: 'Support', icon: '?' },
]

export function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductView | null>(null)
  const [toast, setToast] = useState('')

  // Auth State
  const [authLoading, setAuthLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<VendorProfileView | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)

  // Domain Data State
  const [earnings, setEarnings] = useState<VendorEarningsView | null>(null)
  const [withdrawalBalance, setWithdrawalBalance] = useState<WithdrawalBalance | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [products, setProducts] = useState<ProductView[]>([])
  const [shipments, setShipments] = useState<VendorShipment[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  // Check auth & profile on initial mount
  const checkAuth = async () => {
    setAuthLoading(true)
    const token = localStorage.getItem('kb-auth-token')
    if (!token) {
      setSignedIn(false)
      setUser(null)
      setProfile(null)
      setIsPendingApproval(false)
      setAuthLoading(false)
      return
    }

    try {
      const me = await vendorApi.getMe()
      setUser(me)

      try {
        const prof = await vendorApi.getProfile()
        setProfile(prof)
        if (me.role === 'vendor' && prof.isActive) {
          setSignedIn(true)
          setIsPendingApproval(false)
          loadDashboardData()
        } else {
          setSignedIn(true)
          setIsPendingApproval(true)
        }
      } catch (profErr: any) {
        if (profErr.response?.status === 404 && me.role === 'customer') {
          setSignedIn(false)
          setIsPendingApproval(false)
        } else {
          setSignedIn(true)
          setIsPendingApproval(true)
        }
      }
    } catch (e) {
      localStorage.removeItem('kb-auth-token')
      setSignedIn(false)
      setUser(null)
      setProfile(null)
      setIsPendingApproval(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const loadDashboardData = async () => {
    setDataLoading(true)
    try {
      const [earnRes, balRes, ordRes, prodRes, shipRes] = await Promise.allSettled([
        vendorApi.getEarnings(),
        vendorApi.getWithdrawalBalance(),
        vendorApi.getOrders({ page: 1, limit: 50 }),
        vendorApi.getProducts({ page: 1, limit: 50 }),
        vendorApi.getShipments(),
      ])

      if (earnRes.status === 'fulfilled') setEarnings(earnRes.value)
      if (balRes.status === 'fulfilled') setWithdrawalBalance(balRes.value)
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.items || [])
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.items || [])
      if (shipRes.status === 'fulfilled') {
        const s = shipRes.value
        setShipments(Array.isArray(s) ? s : (s as any).items || [])
      }
    } catch (e) {
      console.error('Failed loading vendor data:', e)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const go = (target: Page) => {
    setSelectedOrder(null)
    setSelectedProduct(null)
    setPage(target)
  }

  const logout = async () => {
    try {
      await vendorApi.logout()
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('kb-auth-token')
    setSignedIn(false)
    setUser(null)
    setProfile(null)
    setIsPendingApproval(false)
    notify('Logged out successfully')
  }

  if (authLoading) {
    return (
      <div className="auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="muted">Connecting to Kitabwalah backend…</p>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <Auth
        onSuccess={() => {
          checkAuth()
        }}
        notify={notify}
      />
    )
  }

  if (isPendingApproval) {
    return (
      <PendingApproval
        user={user}
        profile={profile}
        onCheckStatus={checkAuth}
        onLogout={logout}
      />
    )
  }

  const storeInitials = profile?.storeName ? profile.storeName.slice(0, 2).toUpperCase() : 'V'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go('Dashboard')}>
          <span className="brand-mark">K</span>
          <span>
            KITAB<span>WALAH</span>
            <small>VENDOR CENTRAL</small>
          </span>
        </button>
        <nav>
          {nav.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? 'nav-item active' : 'nav-item'}
              onClick={() => go(item.page)}
            >
              <i>{item.icon}</i>
              {item.page}
            </button>
          ))}
        </nav>
        <div className="nav-bottom">
          <button
            className={page === 'Settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => go('Settings')}
          >
            <i>⚙</i>Settings
          </button>
          <button
            className={page === 'Vendor Profile' ? 'nav-item active' : 'nav-item'}
            onClick={() => go('Vendor Profile')}
          >
            <i>◉</i>Vendor Profile
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <label className="global-search">
            <span>⌕</span>
            <input
              placeholder="Search orders, products…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') go('Orders')
              }}
            />
          </label>
          <div className="top-actions">
            <button className="help" onClick={() => go('Support')}>
              ? Help
            </button>
            <button className="profile-menu" onClick={() => go('Vendor Profile')}>
              <span className="avatar">{storeInitials}</span>
              <span className="desktop-only">
                <strong>{profile?.storeName || 'Vendor Store'}</strong>
                <small>{user?.phone || 'Vendor Account'}</small>
              </span>
              <span>⌄</span>
            </button>
          </div>
        </header>

        <main>
          {selectedOrder ? (
            <OrderDetail
              order={selectedOrder}
              onBack={() => setSelectedOrder(null)}
              onRefresh={loadDashboardData}
              notify={notify}
            />
          ) : selectedProduct ? (
            <ProductEditor
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onSaved={() => {
                setSelectedProduct(null)
                loadDashboardData()
              }}
              notify={notify}
            />
          ) : (
            <PageView
              page={page}
              profile={profile}
              earnings={earnings}
              withdrawalBalance={withdrawalBalance}
              withdrawals={withdrawals}
              orders={orders}
              products={products}
              shipments={shipments}
              dataLoading={dataLoading}
              go={go}
              openOrder={setSelectedOrder}
              openProduct={setSelectedProduct}
              refreshData={loadDashboardData}
              notify={notify}
              logout={logout}
            />
          )}
        </main>

        <nav className="mobile-nav">
          {nav.slice(0, 5).map((item) => (
            <button
              key={item.page}
              className={page === item.page ? 'active' : ''}
              onClick={() => go(item.page)}
            >
              <i>{item.icon}</i>
              {item.page.split(' ')[0]}
            </button>
          ))}
        </nav>
      </div>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  )
}

function PageView({
  page,
  profile,
  earnings,
  withdrawalBalance,
  withdrawals,
  orders,
  products,
  shipments,
  dataLoading,
  go,
  openOrder,
  openProduct,
  refreshData,
  notify,
  logout,
}: {
  page: Page
  profile: VendorProfileView | null
  earnings: VendorEarningsView | null
  withdrawalBalance: WithdrawalBalance | null
  withdrawals: WithdrawalItem[]
  orders: VendorOrder[]
  products: ProductView[]
  shipments: VendorShipment[]
  dataLoading: boolean
  go: (p: Page) => void
  openOrder: (o: VendorOrder) => void
  openProduct: (p: ProductView) => void
  refreshData: () => void
  notify: (m: string) => void
  logout: () => void
}) {
  switch (page) {
    case 'Dashboard':
      return (
        <Dashboard
          profile={profile}
          earnings={earnings}
          withdrawalBalance={withdrawalBalance}
          orders={orders}
          products={products}
          go={go}
          openOrder={openOrder}
        />
      )
    case 'Products':
      return <Products open={openProduct} onRefresh={refreshData} notify={notify} />
    case 'Inventory':
      return <Inventory onRefresh={refreshData} notify={notify} />
    case 'Orders':
      return <Orders open={openOrder} notify={notify} />
    case 'Shipments':
      return <Shipments shipments={shipments} orders={orders} open={openOrder} />
    case 'Returns':
      return <Returns orders={orders} />
    case 'Reviews':
      return <Reviews profile={profile} />
    case 'Earnings & Payouts':
      return (
        <Earnings
          earnings={earnings}
          withdrawalBalance={withdrawalBalance}
          onRefresh={refreshData}
          notify={notify}
        />
      )
    case 'Analytics':
      return <Analytics earnings={earnings} orders={orders} products={products} />
    case 'Notifications':
      return <Notifications />
    case 'Support':
      return <Support notify={notify} />
    case 'Store Management':
      return <StoreProfile profile={profile} onRefresh={refreshData} notify={notify} />
    case 'Settings':
      return <Settings logout={logout} />
    case 'Vendor Profile':
      return <StoreProfile profile={profile} onRefresh={refreshData} notify={notify} />
    case 'Bank Details':
      return <BankDetails withdrawalBalance={withdrawalBalance} notify={notify} />
  }
}

export default App
