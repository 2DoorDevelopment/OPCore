import { Pickaxe } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function MiningOps() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pickaxe size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Mining Ops</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Coming soon — Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  )
}
