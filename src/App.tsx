import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { currency, loadData, saveData, toDate } from './data'
import type { AppData, Order, Product, Status, Ticket } from './data'
import { Dashboard } from './pages/Dashboard'

type Page =
  | 'Dashboard'
  | 'Orders'
  | 'Products'
  | 'Inventory'
  | 'Store Management'
  | 'Shipments'
  | 'Returns'
  | 'Reviews'
  | 'Earnings & Payouts'
  | 'Analytics'
  | 'Notifications'
  | 'Support'
  | 'Settings'
  | 'Vendor Profile'
  | 'Bank Details'

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

const statuses: Status[] = [
  'New',
  'Processing',
  'Ready for Dispatch',
  'Dispatched',
  'Delivered',
  'Returned',
]

const nextStatus: Record<Status, Status | null> = {
  New: 'Processing',
  Processing: 'Ready for Dispatch',
  'Ready for Dispatch': 'Dispatched',
  Dispatched: 'Delivered',
  Delivered: null,
  Returned: null,
}

function App() {
  const [data, setData] = useState<AppData>(loadData)
  const [page, setPage] = useState<Page>('Dashboard')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState('')
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem('kb-auth') !== 'signed-out')

  const save = (next: AppData) => {
    setData(next)
    saveData(next)
  }

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const unread = data.notices.filter((n) => !n.read).length
  const go = (target: Page) => {
    setSelectedOrder(null)
    setSelectedProduct(null)
    setPage(target)
  }

  if (!signedIn)
    return (
      <Auth
        onComplete={() => {
          localStorage.removeItem('kb-auth')
          setSignedIn(true)
        }}
      />
    )

  const logout = () => {
    localStorage.setItem('kb-auth', 'signed-out')
    setSignedIn(false)
  }

  const storeInitials = data.store.name ? data.store.name.slice(0, 2).toUpperCase() : 'V'

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
              {item.page === 'Notifications' && unread > 0 && <b>{unread}</b>}
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
              placeholder="Search orders, products, tickets…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') go('Orders')
              }}
            />
          </label>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => go('Notifications')}
              aria-label="Notifications"
            >
              ♧{unread > 0 && <em>{unread}</em>}
            </button>
            <button className="help" onClick={() => go('Support')}>
              ? Help
            </button>
            <button className="profile-menu" onClick={() => go('Vendor Profile')}>
              <span className="avatar">{storeInitials}</span>
              <span className="desktop-only">
                <strong>Vendor</strong>
                <small>{data.store.name || 'Vendor Store'}</small>
              </span>
              <span>⌄</span>
            </button>
          </div>
        </header>
        <main>
          {selectedOrder ? (
            <OrderDetail
              order={selectedOrder}
              data={data}
              save={save}
              back={() => setSelectedOrder(null)}
              notify={notify}
            />
          ) : selectedProduct ? (
            <ProductEditor
              product={selectedProduct}
              data={data}
              save={save}
              close={() => setSelectedProduct(null)}
              notify={notify}
            />
          ) : (
            <PageView
              page={page}
              data={data}
              save={save}
              go={go}
              openOrder={setSelectedOrder}
              openProduct={setSelectedProduct}
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

function Auth({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<'login' | 'otp' | 'onboard'>('login')
  const [method] = useState('Phone')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  if (mode === 'onboard')
    return (
      <div className="auth">
        <div className="onboard-card">
          <Brand />
          <div className="stepper">
            {[1, 2, 3, 4, 5, 6].map((x) => (
              <span className={x <= step ? 'done' : ''} key={x}>
                {x}
              </span>
            ))}
          </div>
          <h1>Become a Kitabwalah vendor</h1>
          <p>
            Step {step} of 6 —{' '}
            {
              [
                'Basic information',
                'Store information',
                'KYC verification',
                'Payout information',
                'Review your details',
                'Submit application',
              ][step - 1]
            }
          </p>
          {step === 1 ? (
            <>
              <Field label="Full name" required placeholder="Full Name" />
              <Field label="Phone number" required placeholder="+91 00000 00000" />
              <Field label="Email address" required placeholder="vendor@example.com" />
            </>
          ) : step === 2 ? (
            <>
              <Field label="Store name" required placeholder="Your store name" />
              <Field
                label="Store description"
                placeholder="Tell readers what makes your store special"
                textarea
              />
            </>
          ) : step === 3 ? (
            <>
              <Field label="PAN / identity number" required placeholder="Enter identity number" />
              <FileBox label="Upload identity document" />
              <FileBox label="Upload address proof" />
            </>
          ) : step === 4 ? (
            <>
              <Field label="Account holder name" required placeholder="As per bank account" />
              <Field label="Bank account number" required placeholder="Enter account number" />
              <Field label="IFSC or UPI ID" required placeholder="IFSC / UPI ID" />
            </>
          ) : step === 5 ? (
            <div className="review-box">
              <strong>Ready to review</strong>
              <p>
                Your KYC and payout information will be encrypted and shared with the verification
                team.
              </p>
            </div>
          ) : (
            <div className="success-state">
              <span>✓</span>
              <h2>Application ready</h2>
              <p>Submit your application for review.</p>
            </div>
          )}
          <div className="form-actions">
            {step > 1 && (
              <button className="button secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            <button
              className="button"
              onClick={() => (step === 6 ? onComplete() : setStep(step + 1))}
            >
              {step === 6 ? 'Submit application' : 'Continue'}
            </button>
          </div>
          <button className="text-button" onClick={() => setMode('login')}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    )

  if (mode === 'otp')
    return (
      <div className="auth">
        <div className="auth-card">
          <Brand />
          <button className="back-link" onClick={() => setMode('login')}>
            ← Back
          </button>
          <h1>Verify your {method.toLowerCase()}</h1>
          <p>We sent a six-digit code to your registered {method.toLowerCase()}.</p>
          <input
            className="otp-input"
            value={otp}
            maxLength={6}
            onChange={(e) => {
              setOtp(e.target.value)
              setError('')
            }}
            placeholder="• • • • • •"
            inputMode="numeric"
          />
          {error && <p className="error">{error}</p>}
          <button
            className="button full"
            onClick={() =>
              otp.length === 6 && otp !== '000000'
                ? onComplete()
                : setError('Enter a valid six-digit code.')
            }
          >
            Verify & continue
          </button>
          <p className="muted center">
            Resend code in <b>00:24</b>
          </p>
          <button className="text-button">Resend OTP</button>
        </div>
      </div>
    )

  return (
    <div className="auth">
      <div className="auth-splash">
        <Brand />
        <div>
          <span className="eyebrow">SELL WITH CONFIDENCE</span>
          <h2>
            Your books. <br />
            More readers.
          </h2>
          <p>Run your bookstore, fulfil orders and grow your business from one place.</p>
        </div>
        <div className="trust">
          <span>✓ Easy catalog management</span>
          <span>✓ Secure & timely payouts</span>
          <span>✓ Support when you need it</span>
        </div>
      </div>
      <div className="auth-card login">
        <Brand />
        <h1>Welcome back</h1>
        <p>Sign in to your Kitabwalah Vendor account.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onComplete()
          }}
        >
          <Field label="Email / Username" required placeholder="Enter email" />
          <div style={{ height: 16 }}></div>
          <Field label="Password" required type="password" placeholder="Enter password" />
          <div style={{ height: 16 }}></div>
          <button type="submit" className="button full">
            Login
          </button>
        </form>
        <div className="auth-divider">or</div>
        <button className="button secondary full" onClick={() => setMode('onboard')}>
          Become a Vendor
        </button>
        <p className="legal">
          By continuing, you agree to Kitabwalah’s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

function PageView({
  page,
  data,
  save,
  go,
  openOrder,
  openProduct,
  notify,
  logout,
}: {
  page: Page
  data: AppData
  save: (d: AppData) => void
  go: (p: Page) => void
  openOrder: (o: Order) => void
  openProduct: (p: Product) => void
  notify: (m: string) => void
  logout: () => void
}) {
  switch (page) {
    case 'Dashboard':
      return <Dashboard data={data} go={go} openOrder={openOrder} />
    case 'Products':
      return <Products data={data} save={save} open={openProduct} notify={notify} />
    case 'Inventory':
      return <Inventory data={data} save={save} notify={notify} />
    case 'Orders':
      return <Orders data={data} open={openOrder} notify={notify} />
    case 'Shipments':
      return <Shipments data={data} save={save} open={openOrder} notify={notify} />
    case 'Returns':
      return <Returns data={data} />
    case 'Reviews':
      return <Reviews data={data} save={save} notify={notify} />
    case 'Earnings & Payouts':
      return <Earnings data={data} save={save} notify={notify} go={go} />
    case 'Analytics':
      return <Analytics data={data} />
    case 'Notifications':
      return <Notifications data={data} save={save} />
    case 'Support':
      return <Support data={data} save={save} notify={notify} />
    case 'Store Management':
      return <Store data={data} save={save} notify={notify} go={go} />
    case 'Settings':
      return <Settings save={save} notify={notify} logout={logout} go={go} />
    case 'Vendor Profile':
      return <Profile data={data} notify={notify} />
    case 'Bank Details':
      return <BankDetails notify={notify} />
  }
}

function Products({
  data,
  save,
  open,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  open: (p: Product) => void
  notify: (m: string) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [bulk, setBulk] = useState(false)
  const [csv, setCsv] = useState('')

  const items = data.products.filter(
    (p) =>
      (filter === 'All' ||
        (filter === 'Low Stock' && p.stock <= p.threshold) ||
        (filter === 'Out of Stock' && p.stock === 0) ||
        filter === p.status) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()))
  )

  const add = () =>
    open({
      id: 'p' + Date.now(),
      name: '',
      category: 'Books',
      price: 0,
      stock: 0,
      threshold: 10,
      sku: '',
      status: 'Active',
      updated: 'Just now',
      color: '#467364',
      cityPrices: [],
    })

  const remove = (id: string) => {
    if (confirm('Remove this product from your catalog?')) {
      save({ ...data, products: data.products.filter((p) => p.id !== id) })
      notify('Product removed from catalog')
    }
  }

  const validate = () => {
    const rows = csv.trim().split('\n').filter(Boolean)
    const invalid = rows.filter((x) => x.split(',').length < 5)
    if (!rows.length) return notify('Paste CSV rows to validate')
    notify(`${rows.length - invalid.length} valid rows · ${invalid.length} rows need attention`)
  }

  return (
    <>
      <PageHeader
        crumb="Catalog"
        title="Products"
        desc="Manage the books and products you sell on Kitabwalah."
        action={
          <div className="header-actions">
            <button className="button secondary" onClick={() => setBulk(true)}>
              ⇧ Bulk upload
            </button>
            <button className="button" onClick={add}>
              + Add product
            </button>
          </div>
        }
      />
      <div className="toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name or SKU"
          />
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>
      <Card className="table-card">
        {items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>City pricing</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <Book product={p} />
                        <span>
                          <b>{p.name}</b>
                          <small>{p.sku}</small>
                        </span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <b>{currency(p.price)}</b>
                    </td>
                    <td>{p.cityPrices.length ? `${p.cityPrices.length} cities` : 'Default only'}</td>
                    <td>
                      <Stock stock={p.stock} threshold={p.threshold} />
                    </td>
                    <td>
                      <Badge value={p.status} />
                    </td>
                    <td>{p.updated}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => open(p)}>Edit</button>
                        <button onClick={() => remove(p.id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No products found"
            text="Add a product to get started."
            action="Add product"
            onClick={add}
          />
        )}
        <Pagination label={`${items.length} products`} />
      </Card>
      {bulk && (
        <Modal title="Bulk upload products" close={() => setBulk(false)}>
          <p className="muted">
            Paste CSV rows in the format: product name, category, price, stock, SKU.
          </p>
          <textarea
            className="csv"
            placeholder={'Product Name,Category,Price,Stock,SKU'}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setBulk(false)}>
              Cancel
            </button>
            <button className="button" onClick={validate}>
              Validate file
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function ProductEditor({
  product,
  data,
  save,
  close,
  notify,
}: {
  product: Product
  data: AppData
  save: (d: AppData) => void
  close: () => void
  notify: (m: string) => void
}) {
  const [form, setForm] = useState(product)
  const [dirty, setDirty] = useState(false)
  const field = (key: keyof Product, value: any) => {
    setDirty(true)
    setForm({ ...form, [key]: value })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim() || form.price <= 0) {
      notify('Complete product name, SKU and price')
      return
    }
    const exists = data.products.some((p) => p.id === form.id)
    save({
      ...data,
      products: exists
        ? data.products.map((p) => (p.id === form.id ? { ...form, updated: 'Just now' } : p))
        : [{ ...form, updated: 'Just now' }, ...data.products],
    })
    notify(exists ? 'Product updated' : 'Product added to catalog')
    close()
  }

  const addCity = () =>
    setForm({ ...form, cityPrices: [...form.cityPrices, { city: '', price: form.price }] })

  return (
    <>
      <PageHeader
        crumb="Catalog / Products"
        title={product.name || 'Add product'}
        desc={
          product.name
            ? 'Edit product details and location pricing.'
            : 'Create a product that customers can discover.'
        }
        action={
          <button
            className="button secondary"
            onClick={() => {
              if (!dirty || confirm('Discard unsaved changes?')) close()
            }}
          >
            Cancel
          </button>
        }
      />
      <form onSubmit={submit} className="editor-layout">
        <section>
          <Card title="Product details" subtitle="Information shown to customers">
            <div className="form-grid">
              <Field
                label="Product name"
                required
                value={form.name}
                onChange={(v) => field('name', v)}
                placeholder="e.g. Book Title"
              />
              <Field
                label="SKU"
                required
                value={form.sku}
                onChange={(v) => field('sku', v)}
                placeholder="Your unique SKU"
              />
              <Field
                label="Category"
                required
                value={form.category}
                onChange={(v) => field('category', v)}
                select
                options={['Books', 'Self Help', 'Finance', 'Lifestyle', 'Productivity']}
              />
              <Field
                label="Description"
                value={form.name ? `Description for ${form.name}` : ''}
                onChange={() => setDirty(true)}
                textarea
                placeholder="Describe condition and edition"
                full
              />
            </div>
          </Card>
          <Card
            title="Pricing & inventory"
            subtitle="Set default customer price and available stock"
          >
            <div className="form-grid">
              <Field
                label="Default price"
                required
                type="number"
                value={form.price}
                onChange={(v) => field('price', Number(v))}
                prefix="₹"
              />
              <Field
                label="Available stock"
                required
                type="number"
                value={form.stock}
                onChange={(v) => field('stock', Number(v))}
              />
              <Field
                label="Low stock threshold"
                type="number"
                value={form.threshold}
                onChange={(v) => field('threshold', Number(v))}
              />
              <Field
                label="Status"
                value={form.status}
                onChange={(v) => field('status', v as 'Active' | 'Inactive')}
                select
                options={['Active', 'Inactive']}
              />
            </div>
          </Card>
          <Card
            title="City-wise pricing"
            subtitle="Override the default price in specific cities"
            action={
              <button type="button" className="text-button" onClick={addCity}>
                + Add city price
              </button>
            }
          >
            {form.cityPrices.length ? (
              <div className="city-prices">
                {form.cityPrices.map((row, i) => (
                  <div key={i}>
                    <input
                      value={row.city}
                      placeholder="City"
                      onChange={(e) => {
                        const cp = [...form.cityPrices]
                        cp[i] = { ...row, city: e.target.value }
                        setForm({ ...form, cityPrices: cp })
                        setDirty(true)
                      }}
                    />
                    <label>
                      ₹{' '}
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => {
                          const cp = [...form.cityPrices]
                          cp[i] = { ...row, price: Number(e.target.value) }
                          setForm({ ...form, cityPrices: cp })
                          setDirty(true)
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          cityPrices: form.cityPrices.filter((_, n) => n !== i),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Default price applies everywhere"
                text="Add city price if location pricing applies."
                action="Add city price"
                onClick={addCity}
              />
            )}
          </Card>
        </section>
        <aside>
          <Card title="Publishing">
            <p className="muted">
              Active products can be discovered and purchased by customers.
            </p>
            <button className="button full" type="submit">
              {product.name ? 'Save changes' : 'Create product'}
            </button>
          </Card>
        </aside>
      </form>
    </>
  )
}

function Inventory({
  data,
  save,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  notify: (m: string) => void
}) {
  const [query, setQuery] = useState('')
  const rows = data.products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  const change = (id: string, stock: number) => {
    save({
      ...data,
      products: data.products.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, stock), updated: 'Just now' } : p
      ),
    })
    notify('Inventory updated')
  }

  return (
    <>
      <PageHeader
        crumb="Catalog"
        title="Inventory"
        desc="Monitor availability and act before stock runs out."
      />
      <div className="metric-grid four">
        <Metric label="Total products" value={String(data.products.length)} />
        <Metric
          label="In stock"
          value={String(data.products.filter((p) => p.stock > p.threshold).length)}
          trend="Healthy inventory"
        />
        <Metric
          label="Low stock"
          value={String(data.products.filter((p) => p.stock > 0 && p.stock <= p.threshold).length)}
          alert="Needs attention"
        />
        <Metric
          label="Out of stock"
          value={String(data.products.filter((p) => p.stock === 0).length)}
          alert="Unavailable"
        />
      </div>
      <Card className="table-card">
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Available stock</th>
                  <th>Low stock threshold</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <Book product={p} />
                        <b>{p.name}</b>
                      </div>
                    </td>
                    <td>{p.sku}</td>
                    <td>
                      <b>{p.stock}</b>
                    </td>
                    <td>{p.threshold}</td>
                    <td>
                      <Stock stock={p.stock} threshold={p.threshold} />
                    </td>
                    <td>{p.updated}</td>
                    <td>
                      <button
                        className="table-button"
                        onClick={() => {
                          const v = prompt(`Set stock for ${p.name}`, String(p.stock))
                          if (v !== null && !isNaN(Number(v))) change(p.id, Number(v))
                        }}
                      >
                        Adjust stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No items in inventory" text="Add products to manage inventory." />
        )}
      </Card>
    </>
  )
}

function Orders({
  data,
  open,
}: {
  data: AppData
  open: (o: Order) => void
  notify: (m: string) => void
}) {
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const rows = data.orders.filter(
    (o) =>
      (status === 'All' || o.status === status) &&
      (o.id.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.toLowerCase().includes(query.toLowerCase()) ||
        o.product.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <>
      <PageHeader crumb="Sales" title="Orders" desc="Process orders on time." />
      <div className="tabs">
        {['All', ...statuses].map((s) => (
          <button
            key={s}
            className={status === s ? 'selected' : ''}
            onClick={() => setStatus(s)}
          >
            {s}
            {s === 'All' && <small>{data.orders.length}</small>}
          </button>
        ))}
      </div>
      <Card className="table-card">
        {rows.length ? (
          <OrderTable orders={rows} onOpen={open} full />
        ) : (
          <Empty title="No orders found" text="Orders will be listed here when received." />
        )}
        <Pagination label={`${rows.length} orders`} />
      </Card>
    </>
  )
}

function OrderDetail({
  order,
  data,
  save,
  back,
  notify,
}: {
  order: Order
  data: AppData
  save: (d: AppData) => void
  back: () => void
  notify: (m: string) => void
}) {
  const live = data.orders.find((o) => o.id === order.id) ?? order
  const advance = () => {
    const next = nextStatus[live.status]
    if (!next) return
    save({
      ...data,
      orders: data.orders.map((o) =>
        o.id === live.id
          ? { ...o, status: next, handover: next === 'Dispatched' ? true : o.handover }
          : o
      ),
    })
    notify(`Order moved to ${next}`)
  }

  return (
    <>
      <button className="back-link page-back" onClick={back}>
        ← Back to orders
      </button>
      <PageHeader
        crumb="Sales / Orders"
        title={live.id}
        desc={`Placed ${live.date} · ${live.payment} payment`}
        action={
          <div className="header-actions">
            {nextStatus[live.status] && (
              <button className="button" onClick={advance}>
                Mark as {nextStatus[live.status]}
              </button>
            )}
          </div>
        }
      />
      <div className="detail-layout">
        <section>
          <Card title="Order items">
            <div className="order-item">
              <div>
                <b>{live.product}</b>
                <p>
                  {live.quantity} × {currency(live.amount / live.quantity)}
                </p>
              </div>
              <strong>{currency(live.amount)}</strong>
            </div>
          </Card>
        </section>
        <aside>
          <Card title="Customer details">
            <b>{live.customer}</b>
            <p>{live.phone}</p>
          </Card>
        </aside>
      </div>
    </>
  )
}

function Shipments({
  data,
  save,
  open,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  open: (o: Order) => void
  notify: (m: string) => void
}) {
  const rows = data.orders.filter((o) =>
    ['Ready for Dispatch', 'Dispatched', 'Delivered'].includes(o.status)
  )
  const handover = (o: Order) => {
    save({
      ...data,
      orders: data.orders.map((x) =>
        x.id === o.id ? { ...x, handover: true, status: 'Dispatched' } : x
      ),
    })
    notify(`${o.id} handed over`)
  }

  return (
    <>
      <PageHeader
        crumb="Fulfilment"
        title="Shipments"
        desc="Prepare parcels and track delivery."
      />
      <Card className="table-card">
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Shipment ID</th>
                  <th>Courier</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <button className="link" onClick={() => open(o)}>
                        {o.id}
                      </button>
                    </td>
                    <td>{o.shipment}</td>
                    <td>{o.courier}</td>
                    <td>
                      <Badge value={o.status} />
                    </td>
                    <td>{o.date}</td>
                    <td>
                      {!o.handover && (
                        <button className="table-button" onClick={() => handover(o)}>
                          Handover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No active shipments" text="Shipments will appear when orders are ready." />
        )}
      </Card>
    </>
  )
}

function Returns({ data }: { data: AppData }) {
  const returnedOrders = data.orders.filter((o) => o.status === 'Returned')

  return (
    <>
      <PageHeader crumb="Fulfilment" title="Returns" desc="Review return requests." />
      <div className="metric-grid four">
        <Metric label="Requested" value="0" />
        <Metric label="Pickup scheduled" value="0" />
        <Metric label="In transit" value="0" />
        <Metric label="Completed" value={String(returnedOrders.length)} />
      </div>
      <Card className="table-card">
        {returnedOrders.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {returnedOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b>{o.id}</b>
                    </td>
                    <td>{o.product}</td>
                    <td>{o.customer}</td>
                    <td>
                      <Badge value={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No return requests"
            text="Customer return requests will appear here when submitted."
          />
        )}
      </Card>
    </>
  )
}

function Reviews({
  data,
  save,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  notify: (m: string) => void
}) {
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const respond = () => {
    if (!reply.trim() || !replyTo) return
    save({
      ...data,
      reviews: data.reviews.map((r) => (r.id === replyTo ? { ...r, response: reply } : r)),
    })
    setReplyTo(null)
    setReply('')
    notify('Response posted')
  }

  return (
    <>
      <PageHeader crumb="Engagement" title="Reviews" desc="Respond to customer feedback." />
      <div className="metric-grid four">
        <Metric label="Store rating" value={`${data.store.rating || 0} / 5`} />
        <Metric label="Total reviews" value={String(data.reviews.length)} />
        <Metric
          label="Awaiting response"
          value={String(data.reviews.filter((r) => !r.response).length)}
        />
        <Metric label="Response rate" value="0%" />
      </div>
      {data.reviews.length ? (
        <div className="review-cards">
          {data.reviews.map((r) => (
            <Card key={r.id} className="review-card">
              <div className="review-heading">
                <b>{r.customer}</b> · <small>{r.product}</small>
                <Stars rating={r.rating} />
              </div>
              <p>“{r.text}”</p>
              {r.response ? (
                <div className="vendor-response">
                  <b>Response:</b>
                  <p>{r.response}</p>
                </div>
              ) : replyTo === r.id ? (
                <div className="reply-box">
                  <textarea
                    autoFocus
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a response…"
                  />
                  <div>
                    <button className="text-button" onClick={() => setReplyTo(null)}>
                      Cancel
                    </button>
                    <button className="button" onClick={respond}>
                      Post
                    </button>
                  </div>
                </div>
              ) : (
                <button className="text-button" onClick={() => setReplyTo(r.id)}>
                  Respond
                </button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="No reviews yet" text="Customer reviews will appear here." />
      )}
    </>
  )
}

function Earnings({
  data,
  save,
  notify,
  go,
}: {
  data: AppData
  save: (d: AppData) => void
  notify: (m: string) => void
  go: (p: Page) => void
}) {
  const [withdraw, setWithdraw] = useState(false)
  const [amount, setAmount] = useState('')

  const deliveredTotal = data.orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.amount, 0)
  const commission = deliveredTotal * 0.12
  const netEarnings = deliveredTotal - commission

  const request = () => {
    const a = Number(amount)
    if (!a || a <= 0) return notify('Enter a valid amount')
    if (a > data.availableBalance) return notify('Amount exceeds available balance')
    save({
      ...data,
      availableBalance: data.availableBalance - a,
      withdrawals: [
        {
          id: `WD-${Date.now().toString().slice(-4)}`,
          amount: a,
          date: toDate(),
          method: 'Bank Transfer',
          status: 'Pending',
        },
        ...data.withdrawals,
      ],
    })
    setWithdraw(false)
    setAmount('')
    notify('Withdrawal requested')
  }

  return (
    <>
      <PageHeader
        crumb="Finance"
        title="Earnings & payouts"
        desc="Track sales and request withdrawals."
        action={
          <button className="button" onClick={() => setWithdraw(true)}>
            Request withdrawal
          </button>
        }
      />
      <div className="metric-grid">
        <Metric label="Gross sales" value={currency(deliveredTotal)} />
        <Metric label="Commission (12%)" value={currency(commission)} />
        <Metric label="Net earnings" value={currency(netEarnings)} />
        <Metric label="Available balance" value={currency(data.availableBalance)} />
      </div>
      <Card title="Withdrawal history" className="table-card">
        {data.withdrawals.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <b>{w.id}</b>
                    </td>
                    <td>{currency(w.amount)}</td>
                    <td>{w.date}</td>
                    <td>{w.method}</td>
                    <td>
                      <Badge value={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No withdrawal history" text="Past withdrawal requests will appear here." />
        )}
      </Card>
      {withdraw && (
        <Modal title="Request withdrawal" close={() => setWithdraw(false)}>
          <Field
            label="Amount to withdraw"
            required
            type="number"
            value={amount}
            onChange={setAmount}
            prefix="₹"
          />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setWithdraw(false)}>
              Cancel
            </button>
            <button className="button" onClick={request}>
              Submit request
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Analytics({ data }: { data: AppData }) {
  const totalSales = data.orders
    .filter((o) => o.status === 'Delivered')
    .reduce((n, o) => n + o.amount, 0)
  const unitsSold = data.orders.reduce((n, o) => n + o.quantity, 0)

  return (
    <>
      <PageHeader crumb="Insights" title="Analytics" desc="Store performance statistics." />
      <div className="metric-grid four">
        <Metric label="Revenue" value={currency(totalSales)} />
        <Metric label="Orders" value={String(data.orders.length)} />
        <Metric
          label="Average order value"
          value={currency(data.orders.length ? Math.round(totalSales / data.orders.length) : 0)}
        />
        <Metric label="Units sold" value={String(unitsSold)} />
      </div>
      <Card title="Catalog performance">
        {data.products.length ? (
          <p className="muted">Analytics for {data.products.length} catalog items.</p>
        ) : (
          <Empty title="No data available" text="Analytics will update as orders are placed." />
        )}
      </Card>
    </>
  )
}

function Notifications({ data, save }: { data: AppData; save: (d: AppData) => void }) {
  const mark = (id?: string) =>
    save({
      ...data,
      notices: data.notices.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
    })

  return (
    <>
      <PageHeader
        crumb="Engagement"
        title="Notifications"
        desc="Store notifications."
        action={
          <button className="button secondary" onClick={() => mark()}>
            Mark all read
          </button>
        }
      />
      <Card className="notifications-card">
        {data.notices.length ? (
          data.notices.map((n) => (
            <button
              className={n.read ? 'notice' : 'notice unread'}
              key={n.id}
              onClick={() => mark(n.id)}
            >
              <span>
                <b>{n.title}</b>
                <p>{n.body}</p>
              </span>
            </button>
          ))
        ) : (
          <Empty title="No notifications" text="Store alerts and updates will appear here." />
        )}
      </Card>
    </>
  )
}

function Support({
  data,
  save,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  notify: (m: string) => void
}) {
  const [newTicket, setNewTicket] = useState(false)
  const [active, setActive] = useState<Ticket | null>(null)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Shipping')

  const create = () => {
    if (!subject.trim()) return notify('Add a subject for your ticket')
    const t: Ticket = {
      id: `SUP-${Date.now().toString().slice(-5)}`,
      category,
      subject,
      status: 'Open',
      date: toDate(),
      messages: [{ from: 'You', text: 'Ticket submitted.', time: 'Just now' }],
    }
    save({ ...data, tickets: [t, ...data.tickets] })
    setNewTicket(false)
    setActive(t)
    notify('Support ticket created')
  }

  if (active)
    return (
      <>
        <button className="back-link page-back" onClick={() => setActive(null)}>
          ← Back to tickets
        </button>
        <PageHeader crumb="Support" title={active.subject} desc={`${active.id} · ${active.category}`} />
        <Card className="conversation">
          {active.messages.map((m, i) => (
            <div key={i} className="message">
              <b>{m.from}</b>
              <p>{m.text}</p>
            </div>
          ))}
        </Card>
      </>
    )

  return (
    <>
      <PageHeader
        crumb="Help"
        title="Support tickets"
        desc="Contact support."
        action={
          <button className="button" onClick={() => setNewTicket(true)}>
            + Create ticket
          </button>
        }
      />
      <Card className="table-card">
        {data.tickets.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.id}</b>
                    </td>
                    <td>{t.subject}</td>
                    <td>{t.category}</td>
                    <td>
                      <Badge value={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No support tickets" text="Create a ticket if you need assistance." />
        )}
      </Card>
      {newTicket && (
        <Modal title="Create support ticket" close={() => setNewTicket(false)}>
          <Field
            label="Category"
            value={category}
            onChange={setCategory}
            select
            options={['Shipping', 'Payout', 'Orders', 'Products', 'Account & KYC', 'Other']}
          />
          <Field
            label="Subject"
            required
            value={subject}
            onChange={setSubject}
            placeholder="Subject"
          />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setNewTicket(false)}>
              Cancel
            </button>
            <button className="button" onClick={create}>
              Submit ticket
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Store({
  data,
  save,
  notify,
}: {
  data: AppData
  save: (d: AppData) => void
  notify: (m: string) => void
  go: (p: Page) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(data.store.name)
  const [desc, setDesc] = useState(data.store.description)

  const update = () => {
    save({ ...data, store: { ...data.store, name, description: desc } })
    setEditing(false)
    notify('Store profile updated')
  }

  return (
    <>
      <PageHeader
        crumb="Store"
        title="Store management"
        desc="Manage your storefront."
        action={
          <button className="button" onClick={() => setEditing(true)}>
            Edit store
          </button>
        }
      />
      <div className="detail-layout">
        <section>
          <Card title="Store profile">
            <div className="store-profile">
              <h2>{data.store.name || 'Store Name'}</h2>
              <p>{data.store.description || 'No description provided.'}</p>
            </div>
          </Card>
        </section>
      </div>
      {editing && (
        <Modal title="Edit store profile" close={() => setEditing(false)}>
          <Field label="Store name" required value={name} onChange={setName} />
          <Field label="Store description" textarea value={desc} onChange={setDesc} />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="button" onClick={update}>
              Save profile
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Profile({ data, notify }: { data: AppData; notify: (m: string) => void }) {
  return (
    <>
      <PageHeader crumb="Account" title="Vendor profile" desc="Manage account settings." />
      <Card title="Personal details">
        <div className="form-grid">
          <Field label="Store" value={data.store.name || 'Vendor Store'} onChange={() => {}} />
          <Field label="Phone number" placeholder="+91 00000 00000" onChange={() => {}} />
          <Field label="Email address" placeholder="vendor@example.com" onChange={() => {}} />
        </div>
        <button className="button" style={{ marginTop: 16 }} onClick={() => notify('Profile updated')}>
          Save changes
        </button>
      </Card>
    </>
  )
}

function Settings({
  save,
  notify,
  logout,
}: {
  save: (d: AppData) => void
  notify: (m: string) => void
  logout: () => void
  go: (p: Page) => void
}) {
  return (
    <>
      <PageHeader crumb="Account" title="Settings" desc="Account preferences." />
      <Card title="Account actions">
        <button className="button danger" onClick={logout}>
          Log out of account
        </button>
      </Card>
    </>
  )
}

function Brand() {
  return (
    <div className="brand auth-brand">
      <span className="brand-mark">K</span>
      <span>
        KITAB<span>WALAH</span>
        <small>VENDOR CENTRAL</small>
      </span>
    </div>
  )
}

function PageHeader({
  crumb,
  title,
  desc,
  action,
}: {
  crumb: string
  title: string
  desc: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Metric({
  label,
  value,
  trend,
  alert,
}: {
  label: string
  value: string
  trend?: string
  alert?: string
}) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}</strong>
      {(trend || alert) && <span className={alert ? 'alert-text' : 'trend'}>{alert || trend}</span>}
    </div>
  )
}

function Badge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
}

function Book({ product }: { product: Product }) {
  return (
    <span
      className="book"
      style={{
        background: product.color,
        backgroundImage: product.image ? `url(${product.image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!product.image &&
        product.name
          .split(' ')
          .slice(0, 2)
          .map((x, i) => <span key={i}>{x}</span>)}
    </span>
  )
}

function Stock({ stock, threshold }: { stock: number; threshold: number }) {
  return (
    <span className={stock === 0 ? 'stock out' : stock <= threshold ? 'stock low' : 'stock'}>
      {stock === 0 ? 'Out of stock' : stock <= threshold ? 'Low stock' : 'In stock'}{' '}
      <b>{stock}</b>
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars">
      {'★'.repeat(rating)}
      <i>{'★'.repeat(5 - rating)}</i>
    </span>
  )
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea,
  select,
  options,
  prefix,
  full,
}: {
  label: string
  required?: boolean
  value?: string | number
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  textarea?: boolean
  select?: boolean
  options?: string[]
  prefix?: string
  full?: boolean
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
      ) : select ? (
        <select value={value} onChange={(e) => onChange?.(e.target.value)}>
          {options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <div className={prefix ? 'prefixed' : ''}>
          {prefix && <i>{prefix}</i>}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )}
    </label>
  )
}

function FileBox({ label }: { label: string }) {
  return (
    <div className="file-box">
      <span>⇧</span>
      <div>
        <b>{label}</b>
        <small>PDF, JPG or PNG · max 5 MB</small>
      </div>
      <button className="text-button" type="button">
        Browse
      </button>
    </div>
  )
}

function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string
  text: string
  action?: string
  onClick?: () => void
}) {
  return (
    <div className="empty">
      <span>⌁</span>
      <b>{title}</b>
      <p>{text}</p>
      {action && (
        <button className="button" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  )
}

function Pagination({ label }: { label: string }) {
  return (
    <div className="pagination">
      <span>{label}</span>
      <div>
        <button disabled>←</button>
        <button className="selected">1</button>
        <button disabled>→</button>
      </div>
    </div>
  )
}

function Modal({
  title,
  close,
  children,
}: {
  title: string
  close: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-backdrop" role="dialog">
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={close}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function OrderTable({
  orders,
  onOpen,
  full = false,
}: {
  orders: Order[]
  onOpen: (o: Order) => void
  full?: boolean
}) {
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

function BankDetails({ notify }: { notify: (m: string) => void }) {
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [ifsc, setIfsc] = useState('')

  return (
    <>
      <PageHeader
        crumb="Account"
        title="Bank & payout details"
        desc="Manage payout account details."
      />
      <div className="detail-layout">
        <Card title="Payout account">
          <div className="form-grid">
            <Field
              label="Account holder name"
              value={name}
              onChange={setName}
              placeholder="Full name as per bank"
            />
            <Field
              label="Bank account number"
              value={account}
              onChange={setAccount}
              placeholder="Account number"
            />
            <Field label="IFSC Code" value={ifsc} onChange={setIfsc} placeholder="IFSC Code" />
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="button" onClick={() => notify('Bank details saved')}>
              Save changes
            </button>
          </div>
        </Card>
      </div>
    </>
  )
}

export default App
