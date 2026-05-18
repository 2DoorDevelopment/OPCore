import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Copy, Check, Plus, Users, Gem, PieChart, Recycle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MemberList } from '../components/sessions/MemberList'
import { RockEntryCard } from '../components/sessions/RockEntry'
import { SalvageEntryCard } from '../components/sessions/SalvageEntry'
import { SplitSummary } from '../components/sessions/SplitSummary'
import { AddRockModal } from '../components/sessions/AddRockModal'
import { AddSalvageModal } from '../components/sessions/AddSalvageModal'
import { useAuth } from '../lib/auth'
import {
  subscribeToSession,
  subscribeToMembers,
  subscribeToRocks,
  subscribeToSalvage,
  addRock,
  updateRock,
  deleteRock,
  addSalvageEntry,
  updateSalvageEntry,
  deleteSalvageEntry,
  updateSessionSplitMode,
  closeSession,
} from '../lib/firestore'
import { cn } from '../lib/utils'
import type { Session, SessionMember, RockEntry, SalvageEntry, SplitMode } from '../types'

type Tab = 'entries' | 'members' | 'split'

export function SessionView() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [members, setMembers] = useState<SessionMember[]>([])
  const [rocks, setRocks] = useState<RockEntry[]>([])
  const [salvage, setSalvage] = useState<SalvageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('entries')
  const [showAdd, setShowAdd] = useState(false)
  const [editingRock, setEditingRock] = useState<RockEntry | null>(null)
  const [editingSalvage, setEditingSalvage] = useState<SalvageEntry | null>(null)
  const [copied, setCopied] = useState(false)
  const [closing, setClosing] = useState(false)
  const [customPcts, setCustomPcts] = useState<Record<string, number>>({})

  // Subscribe to session + members
  useEffect(() => {
    if (!code) return
    const unsubSession = subscribeToSession(code, (s) => { setSession(s); setLoading(false) })
    const unsubMembers = subscribeToMembers(code, setMembers)
    return () => { unsubSession(); unsubMembers() }
  }, [code])

  // Subscribe to type-specific entries once session type is known
  useEffect(() => {
    if (!code || !session) return
    if (session.type === 'mining') return subscribeToRocks(code, setRocks)
    return subscribeToSalvage(code, setSalvage)
  }, [code, session?.type]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync customPcts when session or members change
  useEffect(() => {
    if (!session || members.length === 0) return
    if (session.splitMode === 'custom' && session.customSplits) {
      setCustomPcts(session.customSplits)
    } else {
      const equal = Math.floor(100 / members.length)
      setCustomPcts(
        Object.fromEntries(
          members.map((m, i) => [
            m.uid,
            i === 0 ? 100 - equal * (members.length - 1) : equal,
          ])
        )
      )
    }
  }, [session?.splitMode, session?.customSplits, members]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCopyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSetSplitMode(mode: SplitMode) {
    if (!code) return
    await updateSessionSplitMode(code, mode, mode === 'custom' ? customPcts : null)
  }

  async function handleSaveCustomSplits() {
    if (!code) return
    await updateSessionSplitMode(code, 'custom', customPcts)
  }

  async function handleClose() {
    if (!code || !session) return
    setClosing(true)
    const entries = session.type === 'mining' ? rocks : salvage
    try {
      await closeSession(code, session, members, entries)
      navigate(session.type === 'mining' ? '/mining' : '/salvage')
    } catch {
      setClosing(false)
    }
  }

  // Rock handlers
  async function handleAddRock(rock: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>) {
    if (!code || !user) return
    await addRock(code, user.uid, rock)
  }
  async function handleUpdateRock(rock: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>) {
    if (!code || !editingRock) return
    await updateRock(code, editingRock.rockId, rock)
    setEditingRock(null)
  }
  const handleDeleteRock = (rockId: string) => code ? deleteRock(code, rockId) : Promise.resolve()

  // Salvage handlers
  async function handleAddSalvage(entry: Omit<SalvageEntry, 'salvageId' | 'createdBy' | 'createdAt'>) {
    if (!code || !user) return
    await addSalvageEntry(code, user.uid, entry)
  }
  async function handleUpdateSalvage(entry: Omit<SalvageEntry, 'salvageId' | 'createdBy' | 'createdAt'>) {
    if (!code || !editingSalvage) return
    await updateSalvageEntry(code, editingSalvage.salvageId, entry)
    setEditingSalvage(null)
  }
  const handleDeleteSalvage = (id: string) => code ? deleteSalvageEntry(code, id) : Promise.resolve()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted text-sm animate-pulse">Loading session…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-text-muted">Session not found.</p>
        <Link to="/mining"><Button variant="secondary">Back</Button></Link>
      </div>
    )
  }

  const isHost = user?.uid === session.hostUid
  const isActive = session.status === 'active'
  const isMember = members.some((m) => m.uid === user?.uid)
  const isMining = session.type === 'mining'
  const entries = isMining ? rocks : salvage
  const entryCount = entries.length
  const pctTotal = Object.values(customPcts).reduce((a, b) => a + b, 0)

  const tabs: Array<{ id: Tab; label: string; icon: typeof Gem; count?: number }> = [
    { id: 'entries', label: isMining ? 'Rocks' : 'Salvage', icon: isMining ? Gem : Recycle, count: entryCount },
    { id: 'members', label: 'Members', icon: Users, count: members.length },
    { id: 'split', label: 'Split', icon: PieChart },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          to={isMining ? '/mining' : '/salvage'}
          className="text-text-muted hover:text-text transition-colors p-1 -ml-1"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-heading font-semibold flex-1 capitalize">
          {session.type} Session
        </h1>
        {isHost && isActive && (
          <Button variant="danger" size="sm" onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : 'Close'}
          </Button>
        )}
      </div>

      {/* Session info */}
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-accent tracking-widest">
                {session.code}
              </span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isActive ? 'bg-success/20 text-success' : 'bg-text-dim/20 text-text-dim'
              )}>
                {session.status}
              </span>
            </div>
            <p className="text-text-dim text-xs mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isActive && (
            <Button variant="secondary" size="sm" onClick={handleCopyCode}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Share Code'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            <Icon size={15} />
            {label}
            {count !== undefined && (
              <span className="text-xs bg-bg-elevated px-1.5 py-0.5 rounded-full ml-0.5">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Entries tab */}
      {activeTab === 'entries' && (
        <div className="space-y-3">
          {isActive && isMember && (
            <Button variant="secondary" onClick={() => setShowAdd(true)} className="w-full">
              <Plus size={16} />
              Add {isMining ? 'Rock' : 'Salvage'} Entry
            </Button>
          )}
          {entryCount === 0 ? (
            <Card>
              <CardContent>
                <p className="text-text-muted text-sm text-center py-8">
                  No entries yet. Hit the button above to start tracking.
                </p>
              </CardContent>
            </Card>
          ) : isMining ? (
            rocks.map((rock) => (
              <RockEntryCard
                key={rock.rockId}
                rock={rock}
                canEdit={isActive && (isHost || rock.createdBy === user?.uid)}
                onEdit={setEditingRock}
                onDelete={handleDeleteRock}
              />
            ))
          ) : (
            salvage.map((entry) => (
              <SalvageEntryCard
                key={entry.salvageId}
                entry={entry}
                canEdit={isActive && (isHost || entry.createdBy === user?.uid)}
                onEdit={setEditingSalvage}
                onDelete={handleDeleteSalvage}
              />
            ))
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <Card>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">No members yet.</p>
            ) : (
              <MemberList members={members} hostUid={session.hostUid} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Split tab */}
      {activeTab === 'split' && (
        <div className="space-y-4">
          {/* Mode selector — host only, active sessions */}
          {isHost && isActive && (
            <Card>
              <CardContent className="space-y-4">
                <p className="text-xs text-text-muted uppercase tracking-wide font-heading">Split Mode</p>
                <div className="flex gap-2">
                  {(['equal', 'contribution', 'custom'] as SplitMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleSetSplitMode(mode)}
                      className={cn(
                        'flex-1 py-2 rounded text-xs capitalize border transition-colors',
                        session.splitMode === mode
                          ? 'bg-accent text-bg border-accent'
                          : 'bg-bg-elevated text-text-muted border-border hover:text-text'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {session.splitMode === 'custom' && (
                  <div className="space-y-2 pt-1">
                    {members.map((member) => (
                      <div key={member.uid} className="flex items-center gap-3">
                        <span className="text-sm text-text-muted flex-1 truncate">{member.displayName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={customPcts[member.uid] ?? 0}
                            onChange={(e) =>
                              setCustomPcts((p) => ({ ...p, [member.uid]: Number(e.target.value) }))
                            }
                            className="w-16 text-center py-1"
                          />
                          <span className="text-text-muted text-sm">%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className={cn('text-xs', pctTotal === 100 ? 'text-success' : 'text-danger')}>
                        Total: {pctTotal}% {pctTotal !== 100 && '(must equal 100)'}
                      </span>
                      <Button size="sm" onClick={handleSaveCustomSplits} disabled={pctTotal !== 100}>
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <SplitSummary session={session} members={members} entries={entries} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rock modals */}
      {isMining && (
        <>
          <AddRockModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddRock} />
          {editingRock && (
            <AddRockModal open onClose={() => setEditingRock(null)} onSave={handleUpdateRock} initialRock={editingRock} />
          )}
        </>
      )}

      {/* Salvage modals */}
      {!isMining && (
        <>
          <AddSalvageModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddSalvage} />
          {editingSalvage && (
            <AddSalvageModal open onClose={() => setEditingSalvage(null)} onSave={handleUpdateSalvage} initialEntry={editingSalvage} />
          )}
        </>
      )}
    </div>
  )
}
