import { Brand } from '../components/ui'
import type { User, VendorProfileView } from '../types'

type PendingApprovalProps = {
  user: User | null
  profile: VendorProfileView | null
  onCheckStatus: () => void
  onLogout: () => void
}

export function PendingApproval({
  profile,
  onCheckStatus,
  onLogout,
}: PendingApprovalProps) {
  return (
    <div className="auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
        <Brand />
        <div style={{ fontSize: 48, margin: '16px 0' }}>⏳</div>
        <h1>Application Pending Approval</h1>
        <p style={{ color: '#666', lineHeight: 1.5, margin: '16px 0' }}>
          Your vendor application for <b>{profile?.storeName || 'your bookstore'}</b> is submitted and currently pending administrator review.
          <br /><br />
          Once an admin approves your store and promotes your role to vendor, you will be able to access the vendor dashboard.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button className="button full" onClick={onCheckStatus}>
            ↻ Check Approval Status
          </button>
          <button className="button secondary full" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
