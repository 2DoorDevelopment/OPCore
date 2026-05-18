import { LayoutDashboard } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm">Active Sessions</p>
            <p className="text-3xl font-heading font-bold text-text mt-1">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm">Refinery Jobs</p>
            <p className="text-3xl font-heading font-bold text-text mt-1">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm">Recent Earnings</p>
            <p className="text-3xl font-heading font-bold text-text mt-1">—</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">
            Your active sessions and refinery timers will appear here once you get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
