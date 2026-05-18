import { Recycle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function SalvageOps() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Recycle size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Salvage Ops</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Coming soon — Phase 3.</p>
        </CardContent>
      </Card>
    </div>
  )
}
