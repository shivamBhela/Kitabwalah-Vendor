import { useState, useEffect } from 'react'
import { vendorApi, errMsg } from '../api'
import { currency } from '../data'
import { Badge, Card, Empty, PageHeader, Pagination } from '../components/ui'
import type { ProductView } from '../types'

type ProductsProps = {
  open: (p: ProductView) => void
  onRefresh: () => void
  notify: (m: string) => void
}

export function Products({ open, onRefresh, notify }: ProductsProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ items: ProductView[]; totalPages: number; total: number }>({
    items: [],
    totalPages: 1,
    total: 0,
  })

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await vendorApi.getProducts({
        search: query || undefined,
        status: filter !== 'All' ? filter.toLowerCase() : undefined,
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
    loadProducts()
  }, [query, filter, page])

  const add = () =>
    open({
      id: 0,
      title: '',
      sku: '',
      regularPrice: '0.00',
      stockQuantity: 0,
      inStock: true,
      status: 'pending_review',
    })

  const remove = async (id: number) => {
    if (confirm('Remove this product from your catalog?')) {
      try {
        await vendorApi.deleteProduct(id)
        notify('Product removed')
        loadProducts()
        onRefresh()
      } catch (err) {
        notify(errMsg(err))
      }
    }
  }

  return (
    <>
      <PageHeader
        crumb="Catalog"
        title="Products"
        desc="Manage the books you sell on Kitabwalah."
        action={
          <button className="button" onClick={add}>
            + Add product
          </button>
        }
      />
      <div className="toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search by title or SKU"
          />
        </label>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setPage(1)
          }}
        >
          <option>All</option>
          <option value="active">Active</option>
          <option value="pending_review">Pending Review</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card className="table-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }} className="muted">Loading products…</div>
        ) : data.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.title}</b>
                    </td>
                    <td>{p.sku}</td>
                    <td><b>{currency(p.regularPrice)}</b></td>
                    <td>{p.stockQuantity}</td>
                    <td><Badge value={p.status} /></td>
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
          <Empty title="No products found" text="Add a product to get started." action="Add product" onClick={add} />
        )}
        <Pagination label={`${data.total} products`} page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </Card>
    </>
  )
}
