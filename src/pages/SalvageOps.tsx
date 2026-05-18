import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Recycle, Plus, Hash } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SessionCard } from '../components/sessions/SessionCard'
import { JoinByCode } from '../components/sessions/JoinByCode'
import { useAuth } from '../lib/auth'
import { createSalvageSession, getSessionCodes, getSession } from '../lib/firestore'
import type { Session } from '../types'

export function SalvageOps() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      const codes = await getSessionCodes(user!.uid)
      const docs = await Promise.all(codes.map((c) => getSession(c)))
      if (!cancelled) {
        setSessions(
          docs.filter((s): s is Session => s !== null && s.type === 'salvage')
        )
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    setCreateError(null)
    try {
      const code = await createSalvageSession(
        user.uid,
        user.displayName ?? 'Unknown',
        user.photoURL,
      )
      navigate(`/session/${code}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create session.')
      setCreating(false)
    }
  }

  const active = sessions.filter((s) => s.status === 'active')
  const closed = sessions.filter((s) => s.status === 'closed')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Recycle size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Salvage Ops</h1>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleCreate} disabled={creating} className="flex-1">
          <Plus size={16} />
          {creating ? 'Creating…' : 'Create Session'}
        </Button>
        <Button variant="secondary" onClick={() => setShowJoin(true)} className="flex-1">
          <Hash size={16} />
          Join by Code
        </Button>
      </div>

      {createError && <p className="text-danger text-sm">{createError}</p>}

      {loading ? (
        <p className="text-text-muted text-sm text-center py-8 animate-pulse">Loading sessions…</p>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-heading font-semibold text-text-muted uppercase tracking-wider">Active</h2>
              {active.map((s) => <SessionCard key={s.code} session={s} />)}
            </div>
          )}
          {closed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-heading font-semibold text-text-muted uppercase tracking-wider">Closed</h2>
              {closed.map((s) => <SessionCard key={s.code} session={s} />)}
            </div>
          )}
          {sessions.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-text-muted text-sm text-center py-8">
                  No salvage sessions yet. Create one or join a crew with their code.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join Session">
        {user && <JoinByCode user={user} onJoined={() => setShowJoin(false)} />}
      </Modal>
    </div>
  )
}
