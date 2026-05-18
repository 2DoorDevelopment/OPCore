import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'
import type { SalvageEntry, SalvageStatus } from '../../types'

interface SalvageEntryCardProps {
  entry: SalvageEntry
  canEdit: boolean
  onEdit: (entry: SalvageEntry) => void
  onDelete: (salvageId: string) => void
}

const STATUS_COLOR: Record<SalvageStatus, string> = {
  scanned: 'text-text-muted',
  stripped: 'text-warn',
  sold: 'text-success',
}

export function SalvageEntryCard({ entry, canEdit, onEdit, onDelete }: SalvageEntryCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text truncate">
                {entry.shipType || 'Unknown ship'}
              </span>
              <span className={cn('text-xs capitalize', STATUS_COLOR[entry.status])}>
                {entry.status}
              </span>
            </div>
            <p className="text-xs text-text-dim mt-0.5 truncate">{entry.location || 'No location'}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 text-text-muted hover:text-text transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(entry.salvageId)}
                  className="p-1.5 text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="p-1.5 text-text-muted hover:text-text transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {entry.rmcUnits > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-dim">RMC</span>
                  <span className="text-text">{entry.rmcUnits} SCU</span>
                </div>
              )}
              {entry.cmUnits > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-dim">CM</span>
                  <span className="text-text">{entry.cmUnits} SCU</span>
                </div>
              )}
            </div>
            {entry.finalSaleValue != null && (
              <div className="flex justify-between text-xs">
                <span className="text-text-dim">Sale value</span>
                <span className="text-success">{entry.finalSaleValue.toLocaleString()} aUEC</span>
              </div>
            )}
            {entry.notes && (
              <p className="text-xs text-text-muted mt-1 italic">{entry.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
