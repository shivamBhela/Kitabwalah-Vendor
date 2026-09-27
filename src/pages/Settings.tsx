import { Card, PageHeader } from '../components/ui'

type SettingsProps = {
  logout: () => void
}

export function Settings({ logout }: SettingsProps) {
  return (
    <>
      <PageHeader crumb="Account" title="Settings" desc="Manage account settings." />
      <Card title="Account Actions">
        <button className="button danger" onClick={logout}>
          Log Out of Vendor Account
        </button>
      </Card>
    </>
  )
}
