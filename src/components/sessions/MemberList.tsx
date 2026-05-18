import { Crown } from 'lucide-react'
import type { SessionMember } from '../../types'

interface MemberListProps {
  members: SessionMember[]
  hostUid: string
}

export function MemberList({ members, hostUid }: MemberListProps) {
  const sorted = [...members].sort((a) => (a.role === 'host' ? -1 : 1))

  return (
    <div className="space-y-3">
      {sorted.map((member) => (
        <div key={member.uid} className="flex items-center gap-3">
          {member.photoURL ? (
            <img
              src={member.photoURL}
              alt={member.displayName}
              className="w-8 h-8 rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs text-text-muted shrink-0">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-text flex-1 truncate">{member.displayName}</span>
          {member.uid === hostUid && <Crown size={14} className="text-warn shrink-0" />}
        </div>
      ))}
    </div>
  )
}
