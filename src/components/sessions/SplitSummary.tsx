import { calculateSplits, totalSaleValue } from '../../lib/splits'
import type { Session, SessionMember, SplitEntry } from '../../types'

interface SplitSummaryProps {
  session: Session
  members: SessionMember[]
  entries: SplitEntry[]
}

export function SplitSummary({ session, members, entries }: SplitSummaryProps) {
  const total = totalSaleValue(entries)
  const splits = calculateSplits(session, members, entries)

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Total sold value</span>
        <span className="text-text font-medium">{total.toLocaleString()} aUEC</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Split mode</span>
        <span className="text-text capitalize">{session.splitMode}</span>
      </div>
      {members.length > 0 && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs text-text-dim uppercase tracking-wide font-heading">Per member</p>
          {members.map((member) => (
            <div key={member.uid} className="flex justify-between text-sm">
              <span className="text-text-muted truncate">{member.displayName}</span>
              <span className="text-accent font-medium shrink-0 ml-4">
                {(splits[member.uid] ?? 0).toLocaleString()} aUEC
              </span>
            </div>
          ))}
        </div>
      )}
      {total === 0 && (
        <p className="text-text-dim text-xs text-center pt-2">
          Mark entries as sold and add sale values to see splits.
        </p>
      )}
    </div>
  )
}
