import { Package } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function Logistics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Logistics</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Trade route planner — coming in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  )
}
