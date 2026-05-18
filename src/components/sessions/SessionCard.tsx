import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'
import type { Session } from '../../types'

interface SessionCardProps {
  session: Session
  memberCount?: number
}

export function SessionCard({ session, memberCount }: SessionCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:border-border-bright transition-colors"
      onClick={() => navigate(`/session/${session.code}`)}
    >
      <CardContent className="flex items-center justify-between py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent tracking-widest">{session.code}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                session.status === 'active'
                  ? 'bg-success/20 text-success'
                  : 'bg-text-dim/20 text-text-dim'
              )}
            >
              {session.status}
            </span>
          </div>
          <p className="text-text-muted text-xs mt-0.5 capitalize">{session.type} session</p>
        </div>
        {memberCount != null && (
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <Users size={14} />
            <span>{memberCount}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
