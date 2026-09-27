import { Card, Empty, PageHeader } from '../components/ui'

export function Notifications() {
  return (
    <>
      <PageHeader crumb="Engagement" title="Notifications" desc="Store alerts and system notices." />
      <Card><Empty title="No notifications" text="System notices will appear here." /></Card>
    </>
  )
}
