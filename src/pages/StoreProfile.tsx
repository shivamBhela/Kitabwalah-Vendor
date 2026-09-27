import { useState } from 'react'
import type { FormEvent } from 'react'
import { vendorApi, errMsg } from '../api'
import { Card, Field, PageHeader } from '../components/ui'
import type { VendorProfileView } from '../types'

type StoreProfileProps = {
  profile: VendorProfileView | null
  onRefresh: () => void
  notify: (m: string) => void
}

export function StoreProfile({
  profile,
  onRefresh,
  notify,
}: StoreProfileProps) {
  const [form, setForm] = useState({
    storeName: profile?.storeName || '',
    storeDescription: profile?.storeDescription || '',
    vacationMode: profile?.vacationMode || false,
    vacationMessage: profile?.vacationMessage || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await vendorApi.updateProfile(form)
      notify('Store profile updated successfully')
      onRefresh()
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader crumb="Account" title="Vendor Profile & Store Settings" desc="Manage store details and vacation mode." />
      <form onSubmit={handleSave} className="detail-layout">
        <section>
          <Card title="Store Profile Information">
            <div className="form-grid">
              <Field
                label="Store Name"
                required
                value={form.storeName}
                onChange={(v: string) => setForm({ ...form, storeName: v })}
              />
              <Field
                label="Store Description"
                textarea
                value={form.storeDescription}
                onChange={(v: string) => setForm({ ...form, storeDescription: v })}
                full
              />
            </div>
          </Card>
          <Card title="Vacation Mode" style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.vacationMode}
                onChange={(e) => setForm({ ...form, vacationMode: e.target.checked })}
              />
              <b>Enable Vacation Mode</b>
            </label>
            {form.vacationMode && (
              <Field
                label="Vacation Message"
                textarea
                placeholder="Message shown to customers"
                value={form.vacationMessage}
                onChange={(v: string) => setForm({ ...form, vacationMessage: v })}
                full
              />
            )}
          </Card>
          <div style={{ marginTop: 16 }}>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Store Profile'}
            </button>
          </div>
        </section>
        <aside>
          <Card title="Verification Details">
            <p><b>Status:</b> {profile?.isVerified ? 'Verified Vendor' : 'Pending Verification'}</p>
            <p><b>Commission Rate:</b> {profile?.commissionRate || '12.00'}%</p>
            <p><b>GSTIN:</b> {profile?.gstin || 'Not provided'}</p>
          </Card>
        </aside>
      </form>
    </>
  )
}
