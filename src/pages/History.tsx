import { History as HistoryIcon } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function History() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">History</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Closed sessions and past earnings — coming in Phase 3.</p>
        </CardContent>
      </Card>
    </div>
  )
}
