import { Wrench } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function Toolbox() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wrench size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Toolbox</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Quick-links dashboard — coming in Phase 6.</p>
        </CardContent>
      </Card>
    </div>
  )
}
