import { Warehouse } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function Hangar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Hangar</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Fleet tracker — coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  )
}
