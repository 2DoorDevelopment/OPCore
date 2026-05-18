import type { Timestamp } from 'firebase/firestore'

export type SessionType = 'mining' | 'salvage'
export type SessionStatus = 'active' | 'closed'
export type SplitMode = 'equal' | 'contribution' | 'custom'
export type MemberRole = 'host' | 'member'
export type RockStatus = 'scanned' | 'mined' | 'refined' | 'sold'

export interface Session {
  code: string
  type: SessionType
  hostUid: string
  createdAt: Timestamp
  closedAt: Timestamp | null
  status: SessionStatus
  splitMode: SplitMode
  customSplits: Record<string, number> | null
}

export interface SessionMember {
  uid: string
  displayName: string
  photoURL: string | null
  role: MemberRole
  joinedAt: Timestamp
}

export interface RockEntry {
  rockId: string
  createdBy: string
  createdAt: Timestamp
  location: string
  rockType: string
  scanValue: number | null
  composition: Record<string, number>
  notes: string
  status: RockStatus
  finalSaleValue: number | null
}
