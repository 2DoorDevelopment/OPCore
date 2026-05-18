import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'
import type { RockEntry, RockStatus } from '../../types'

interface RockEntryCardProps {
  rock: RockEntry
  canEdit: boolean
  onEdit: (rock: RockEntry) => void
  onDelete: (rockId: string) => void
}

const STATUS_COLOR: Record<RockStatus, string> = {
  scanned: 'text-text-muted',
  mined: 'text-warn',
  refined: 'text-accent',
  sold: 'text-success',
}

export function RockEntryCard({ rock, canEdit, onEdit, onDelete }: RockEntryCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text truncate">
                {rock.rockType || 'Unknown type'}
              </span>
              <span className={cn('text-xs capitalize', STATUS_COLOR[rock.status])}>
                {rock.status}
              </span>
            </div>
            <p className="text-xs text-text-dim mt-0.5 truncate">{rock.location || 'No location'}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(rock)}
                  className="p-1.5 text-text-muted hover:text-text transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(rock.rockId)}
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
            {rock.scanValue != null && (
              <div className="flex justify-between text-xs">
                <span className="text-text-dim">Scan value</span>
                <span className="text-text">{rock.scanValue.toLocaleString()} aUEC</span>
              </div>
            )}
            {rock.finalSaleValue != null && (
              <div className="flex justify-between text-xs">
                <span className="text-text-dim">Sale value</span>
                <span className="text-success">{rock.finalSaleValue.toLocaleString()} aUEC</span>
              </div>
            )}
            {Object.keys(rock.composition).length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-text-dim mb-1">Composition</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {Object.entries(rock.composition).map(([mineral, pct]) => (
                    <div key={mineral} className="flex justify-between text-xs">
                      <span className="text-text-muted capitalize">{mineral}</span>
                      <span className="text-text">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rock.notes && (
              <p className="text-xs text-text-muted mt-1 italic">{rock.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
