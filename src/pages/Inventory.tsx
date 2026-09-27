import { useState, useEffect } from 'react'
import { vendorApi, errMsg } from '../api'
import { Badge, Card, Empty, PageHeader } from '../components/ui'
import type { ProductView } from '../types'

type InventoryProps = {
  onRefresh: () => void
  notify: (m: string) => void
}

export function Inventory({ onRefresh, notify }: InventoryProps) {
  const [items, setItems] = useState<ProductView[]>([])
  const [loading, setLoading] = useState(false)

  const loadInventory = async () => {
    setLoading(true)
    try {
      const res = await vendorApi.getProducts({ page: 1, limit: 100 })
      setItems(res.items || [])
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const adjustStock = async (p: ProductView) => {
    const input = prompt(`Adjust stock quantity for "${p.title}"`, String(p.stockQuantity))
    if (input !== null && !isNaN(Number(input))) {
      const newStock = Math.max(0, parseInt(input, 10))
      try {
        await vendorApi.updateProduct(p.id, { stockQuantity: newStock })
        notify(`Stock updated for ${p.title}`)
        loadInventory()
        onRefresh()
      } catch (err) {
        notify(errMsg(err))
      }
    }
  }

  return (
    <>
      <PageHeader crumb="Catalog" title="Inventory" desc="Monitor availability and manage stock counts." />
      <Card className="table-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }} className="muted">Loading inventory…</div>
        ) : items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.title}</b></td>
                    <td>{p.sku}</td>
                    <td><b>{p.stockQuantity}</b></td>
                    <td><Badge value={p.status} /></td>
                    <td>
                      <button className="table-button" onClick={() => adjustStock(p)}>
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No items in inventory" text="Add products to manage stock." />
        )}
      </Card>
    </>
  )
}
