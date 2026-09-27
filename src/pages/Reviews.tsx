import { Card, Empty, Metric, PageHeader } from '../components/ui'
import type { VendorProfileView } from '../types'

type ReviewsProps = {
  profile: VendorProfileView | null
}

export function Reviews({ profile }: ReviewsProps) {
  return (
    <>
      <PageHeader crumb="Engagement" title="Reviews" desc="Store reviews and feedback." />
      <div className="metric-grid four">
        <Metric label="Store Rating" value={`${profile?.averageRating || '0.00'} / 5`} />
        <Metric label="Total Reviews" value={String(profile?.totalReviews || 0)} />
      </div>
      <Card>
        <Empty title="No customer reviews yet" text="Reviews will appear when customers leave feedback." />
      </Card>
    </>
  )
}
