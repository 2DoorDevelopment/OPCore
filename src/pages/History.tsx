import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon, Pickaxe, Recycle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { useAuth } from '../lib/auth'
import { getSessionCodes, getSession } from '../lib/firestore'
import type { Session } from '../types'

export function History() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      const codes = await getSessionCodes(user!.uid)
      const docs = await Promise.all(codes.map((c) => getSession(c)))
      if (!cancelled) {
        const closed = docs
          .filter((s): s is Session => s !== null && s.status === 'closed')
          .sort((a, b) => (b.closedAt?.toMillis() ?? 0) - (a.closedAt?.toMillis() ?? 0))
        setSessions(closed)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const totalEarnings = sessions.reduce(
    (sum, s) => sum + (s.finalSplits?.[user?.uid ?? ''] ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">History</h1>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-text-muted text-sm">Total Earnings</span>
            <span className="text-accent font-heading font-bold text-2xl">
              {totalEarnings.toLocaleString()} aUEC
            </span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-text-muted text-sm text-center py-8 animate-pulse">Loading history…</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm text-center py-8">
              No closed sessions yet. Close a session to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <HistoryCard key={s.code} session={s} userUid={user!.uid} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ session, userUid }: { session: Session; userUid: string }) {
  const navigate = useNavigate()
  const payout = session.finalSplits?.[userUid]
  const Icon = session.type === 'mining' ? Pickaxe : Recycle

  return (
    <Card
      className="cursor-pointer hover:border-border-bright transition-colors"
      onClick={() => navigate(`/session/${session.code}`)}
    >
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-text-muted shrink-0" />
              <span className="font-mono font-bold text-accent tracking-widest">{session.code}</span>
              <span className="text-xs text-text-dim capitalize">{session.type}</span>
            </div>
            {session.closedAt && (
              <p className="text-xs text-text-dim mt-0.5">
                Closed {session.closedAt.toDate().toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
            {session.finalTotalValue != null && (
              <p className="text-xs text-text-dim mt-0.5">
                Total: {session.finalTotalValue.toLocaleString()} aUEC
                {' · '}{Object.keys(session.finalSplits ?? {}).length} members
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {payout != null ? (
              <>
                <p className="text-accent font-medium">{payout.toLocaleString()}</p>
                <p className="text-xs text-text-dim">aUEC</p>
              </>
            ) : (
              <p className="text-text-dim text-sm">—</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
