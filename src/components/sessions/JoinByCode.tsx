import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { joinSession } from '../../lib/firestore'
import type { User } from 'firebase/auth'

interface JoinByCodeProps {
  user: User
  onJoined?: () => void
}

export function JoinByCode({ user, onJoined }: JoinByCodeProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('Code must be exactly 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await joinSession(trimmed, user.uid, user.displayName ?? 'Unknown', user.photoURL)
      onJoined?.()
      navigate(`/session/${trimmed}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join session.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="ABC123"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={6}
        className="font-mono tracking-widest text-center text-lg uppercase"
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        autoFocus
      />
      {error && <p className="text-danger text-sm">{error}</p>}
      <Button onClick={handleJoin} disabled={loading} className="w-full">
        {loading ? 'Joining…' : 'Join Session'}
      </Button>
    </div>
  )
}
