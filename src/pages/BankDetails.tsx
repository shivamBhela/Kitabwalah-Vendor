import { Card, PageHeader } from '../components/ui'
import type { WithdrawalBalance } from '../types'

type BankDetailsProps = {
  withdrawalBalance: WithdrawalBalance | null
  notify: (m: string) => void
}

export function BankDetails({
  withdrawalBalance,
}: BankDetailsProps) {
  return (
    <>
      <PageHeader crumb="Account" title="Bank & Payout Details" desc="View payout status." />
      <Card title="Payout Status">
        <p><b>Payout details on file:</b> {withdrawalBalance?.payoutDetailsOnFile ? 'Yes' : 'No'}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          Bank account details are managed through backend admin administration.
        </p>
      </Card>
    </>
  )
}
