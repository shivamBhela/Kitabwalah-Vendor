import { useState } from 'react'
import type { FormEvent } from 'react'
import { vendorApi, errMsg } from '../api'
import { Card, Field, PageHeader } from '../components/ui'
import type { ProductView } from '../types'

type ProductEditorProps = {
  product: ProductView
  onClose: () => void
  onSaved: () => void
  notify: (m: string) => void
}

export function ProductEditor({
  product,
  onClose,
  onSaved,
  notify,
}: ProductEditorProps) {
  const [form, setForm] = useState({
    title: product.title || '',
    sku: product.sku || '',
    regularPrice: product.regularPrice || '0.00',
    salePrice: product.salePrice || '',
    author: product.author || '',
    condition: product.condition || 'new_condition',
    stockQuantity: product.stockQuantity || 0,
    status: (product.status === 'draft' ? 'draft' : 'pending_review') as 'draft' | 'pending_review',
  })
  const [submitting, setSubmitting] = useState(false)

  const isLive = product.status === 'active'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.regularPrice) {
      notify('Please fill title and regular price.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        sku: form.sku || undefined,
        regularPrice: form.regularPrice,
        salePrice: form.salePrice ? form.salePrice : null,
        author: form.author || undefined,
        condition: form.condition || undefined,
        stockQuantity: Number(form.stockQuantity),
        status: form.status,
      }

      if (product.id && product.id > 0) {
        await vendorApi.updateProduct(product.id, payload)
        notify('Product updated successfully')
      } else {
        await vendorApi.createProduct(payload)
        notify('Product created successfully')
      }
      onSaved()
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        crumb="Catalog / Products"
        title={product.id ? product.title : 'Add Product'}
        desc={product.id ? 'Edit product details.' : 'Create a product for your catalog.'}
        action={
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
        }
      />

      {isLive && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '12px 16px', borderRadius: 6, marginBottom: 16 }}>
          <b>⚠️ Re-Review Rule:</b> Editing title or prices on a live product will send it back to <code>pending_review</code> status for admin approval.
        </div>
      )}

      <form onSubmit={submit} className="editor-layout">
        <section>
          <Card title="Product details">
            <div className="form-grid">
              <Field
                label="Product Title"
                required
                value={form.title}
                onChange={(v: string) => setForm({ ...form, title: v })}
                placeholder="Book title"
              />
              <Field
                label="SKU"
                value={form.sku}
                onChange={(v: string) => setForm({ ...form, sku: v })}
                placeholder="Unique SKU code"
              />
              <Field
                label="Author"
                value={form.author}
                onChange={(v: string) => setForm({ ...form, author: v })}
                placeholder="Author name"
              />
              <Field
                label="Condition"
                select
                options={['new_condition', 'like_new', 'good', 'acceptable', 'poor']}
                value={form.condition}
                onChange={(v: string) => setForm({ ...form, condition: v })}
              />
            </div>
          </Card>

          <Card title="Pricing & Stock">
            <div className="form-grid">
              <Field
                label="Regular Price (INR string)"
                required
                prefix="₹"
                value={form.regularPrice}
                onChange={(v: string) => setForm({ ...form, regularPrice: v })}
                placeholder="1250.00"
              />
              <Field
                label="Sale Price (Optional)"
                prefix="₹"
                value={form.salePrice}
                onChange={(v: string) => setForm({ ...form, salePrice: v })}
                placeholder="999.00"
              />
              <Field
                label="Stock Quantity"
                type="number"
                value={form.stockQuantity}
                onChange={(v: string) => setForm({ ...form, stockQuantity: Number(v) })}
              />
              <Field
                label="Submission Status"
                select
                options={['pending_review', 'draft']}
                value={form.status}
                onChange={(v: string) => setForm({ ...form, status: v as any })}
              />
            </div>
          </Card>
        </section>

        <aside>
          <Card title="Save Product">
            <p className="muted" style={{ marginBottom: 16 }}>
              Products submitted for review will be evaluated by Kitabwalah admins before going live.
            </p>
            <button className="button full" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : product.id ? 'Save Changes' : 'Create Product'}
            </button>
          </Card>
        </aside>
      </form>
    </>
  )
}
