import { FlaskConical } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function Refinery() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Refinery</h1>
      </div>
      <Card>
        <CardContent>
          <p className="text-text-muted text-sm text-center py-8">Refinery job tracker — coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  )
}
