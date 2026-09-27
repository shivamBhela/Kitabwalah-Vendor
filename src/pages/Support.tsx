import { Card, PageHeader } from '../components/ui'

type SupportProps = {
  notify: (m: string) => void
}

export function Support({ notify }: SupportProps) {
  return (
    <>
      <PageHeader crumb="Help" title="Vendor Support" desc="Get help with your store." />
      <Card title="Contact Backend Team">
        <p>For assistance with your vendor account, store verification, or payouts, please reach out to admin support.</p>
      </Card>
    </>
  )
}
