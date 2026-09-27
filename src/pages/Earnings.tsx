import { useState, useEffect } from 'react'
import { vendorApi, errMsg } from '../api'
import { currency, toDate } from '../data'
import { Badge, Card, Empty, Field, Metric, Modal, PageHeader } from '../components/ui'
import type { VendorEarningsView, WithdrawalBalance, WithdrawalItem } from '../types'

type EarningsProps = {
  earnings: VendorEarningsView | null
  withdrawalBalance: WithdrawalBalance | null
  onRefresh: () => void
  notify: (m: string) => void
}

export function Earnings({
  earnings,
  withdrawalBalance,
  onRefresh,
  notify,
}: EarningsProps) {
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [rupees, setRupees] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<WithdrawalItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadWithdrawalHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await vendorApi.getWithdrawals({ page: 1, limit: 20 })
      setHistory(res.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadWithdrawalHistory()
  }, [])

  const handleWithdrawRequest = async () => {
    const amt = parseFloat(rupees)
    if (!amt || amt <= 0) {
      notify('Please enter a valid amount in Rupees.')
      return
    }

    const paise = Math.round(amt * 100)
    setSubmitting(true)
    try {
      await vendorApi.requestWithdrawal(paise)
      notify('Withdrawal request submitted successfully!')
      setWithdrawModal(false)
      setRupees('')
      onRefresh()
      loadWithdrawalHistory()
    } catch (err) {
      notify(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  const payoutOnFile = withdrawalBalance?.payoutDetailsOnFile ?? false

  return (
    <>
      <PageHeader
        crumb="Finance"
        title="Earnings & Payouts"
        desc="Track your sales earnings and request withdrawals."
        action={
          <button
            className="button"
            disabled={!payoutOnFile}
            title={!payoutOnFile ? 'Payout details not on file' : undefined}
            onClick={() => setWithdrawModal(true)}
          >
            Request Withdrawal
          </button>
        }
      />

      {!payoutOnFile && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: 6, marginBottom: 16 }}>
          <b>Notice:</b> You do not have payout details on file. Please contact support or update bank details before requesting withdrawals.
        </div>
      )}

      <div className="metric-grid">
        <Metric label="Gross Sales" value={currency(earnings?.live?.grossSales)} />
        <Metric label="Commission Deducted" value={currency(earnings?.live?.commissionDeducted)} />
        <Metric label="Net Earnings" value={currency(earnings?.live?.netEarnings)} />
        <Metric label="Available to Withdraw" value={currency(withdrawalBalance?.availableToWithdraw)} />
      </div>

      <Card title="Withdrawal History" className="table-card">
        {loadingHistory ? (
          <div style={{ padding: 24, textAlign: 'center' }} className="muted">Loading history…</div>
        ) : history.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w) => (
                  <tr key={w.id}>
                    <td><b>#{w.id}</b></td>
                    <td>{currency(w.amount)}</td>
                    <td><Badge value={w.status} /></td>
                    <td>{toDate(w.requestedAt)}</td>
                    <td>{w.paymentReference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No withdrawal history" text="Your past withdrawal requests will appear here." />
        )}
      </Card>

      {withdrawModal && (
        <Modal title="Request Withdrawal" close={() => setWithdrawModal(false)}>
          <p className="muted" style={{ marginBottom: 16 }}>
            Minimum request: {currency(withdrawalBalance?.minimumRequest || '100.00')}
          </p>
          <Field
            label="Amount (in Rupees)"
            required
            prefix="₹"
            type="number"
            value={rupees}
            onChange={(v: string) => setRupees(v)}
            placeholder="500.00"
          />
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="button secondary" onClick={() => setWithdrawModal(false)}>
              Cancel
            </button>
            <button className="button" disabled={submitting} onClick={handleWithdrawRequest}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
