import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Copy, Check, Plus, Users, Gem, PieChart } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MemberList } from '../components/sessions/MemberList'
import { RockEntryCard } from '../components/sessions/RockEntry'
import { SplitSummary } from '../components/sessions/SplitSummary'
import { AddRockModal } from '../components/sessions/AddRockModal'
import { useAuth } from '../lib/auth'
import {
  subscribeToSession,
  subscribeToMembers,
  subscribeToRocks,
  addRock,
  updateRock,
  deleteRock,
  closeSession,
} from '../lib/firestore'
import { cn } from '../lib/utils'
import type { Session, SessionMember, RockEntry } from '../types'

type Tab = 'rocks' | 'members' | 'split'

export function SessionView() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [members, setMembers] = useState<SessionMember[]>([])
  const [rocks, setRocks] = useState<RockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('rocks')
  const [showAddRock, setShowAddRock] = useState(false)
  const [editingRock, setEditingRock] = useState<RockEntry | null>(null)
  const [copied, setCopied] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!code) return
    const unsubSession = subscribeToSession(code, (s) => { setSession(s); setLoading(false) })
    const unsubMembers = subscribeToMembers(code, setMembers)
    const unsubRocks = subscribeToRocks(code, setRocks)
    return () => { unsubSession(); unsubMembers(); unsubRocks() }
  }, [code])

  async function handleCopyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAddRock(rockData: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>) {
    if (!code || !user) return
    await addRock(code, user.uid, rockData)
  }

  async function handleUpdateRock(rockData: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>) {
    if (!code || !editingRock) return
    await updateRock(code, editingRock.rockId, rockData)
    setEditingRock(null)
  }

  async function handleDeleteRock(rockId: string) {
    if (!code) return
    await deleteRock(code, rockId)
  }

  async function handleClose() {
    if (!code) return
    setClosing(true)
    try {
      await closeSession(code)
      navigate('/mining')
    } catch {
      setClosing(false)
    }
  }

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
        <Link to="/mining">
          <Button variant="secondary">Back to Mining Ops</Button>
        </Link>
      </div>
    )
  }

  const isHost = user?.uid === session.hostUid
  const isActive = session.status === 'active'
  const isMember = members.some((m) => m.uid === user?.uid)

  const tabs: Array<{ id: Tab; label: string; icon: typeof Gem; count?: number }> = [
    { id: 'rocks', label: 'Rocks', icon: Gem, count: rocks.length },
    { id: 'members', label: 'Members', icon: Users, count: members.length },
    { id: 'split', label: 'Split', icon: PieChart },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/mining" className="text-text-muted hover:text-text transition-colors p-1 -ml-1">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-heading font-semibold flex-1">Mining Session</h1>
        {isHost && isActive && (
          <Button variant="danger" size="sm" onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : 'Close'}
          </Button>
        )}
      </div>

      {/* Session info card */}
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-accent tracking-widest">
                {session.code}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-success/20 text-success' : 'bg-text-dim/20 text-text-dim'
                )}
              >
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
              <span className="text-xs bg-bg-elevated px-1.5 py-0.5 rounded-full ml-0.5">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'rocks' && (
        <div className="space-y-3">
          {isActive && isMember && (
            <Button
              variant="secondary"
              onClick={() => setShowAddRock(true)}
              className="w-full"
            >
              <Plus size={16} />
              Add Rock Entry
            </Button>
          )}
          {rocks.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-text-muted text-sm text-center py-8">
                  No rocks logged yet. Hit "Add Rock Entry" to start tracking.
                </p>
              </CardContent>
            </Card>
          ) : (
            rocks.map((rock) => (
              <RockEntryCard
                key={rock.rockId}
                rock={rock}
                canEdit={isActive && (isHost || rock.createdBy === user?.uid)}
                onEdit={setEditingRock}
                onDelete={handleDeleteRock}
              />
            ))
          )}
        </div>
      )}

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

      {activeTab === 'split' && (
        <Card>
          <CardContent>
            <SplitSummary session={session} members={members} rocks={rocks} />
          </CardContent>
        </Card>
      )}

      <AddRockModal
        open={showAddRock}
        onClose={() => setShowAddRock(false)}
        onSave={handleAddRock}
      />

      {editingRock && (
        <AddRockModal
          open={true}
          onClose={() => setEditingRock(null)}
          onSave={handleUpdateRock}
          initialRock={editingRock}
        />
      )}
    </div>
  )
}
