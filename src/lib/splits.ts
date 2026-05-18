import type { SessionMember, Session, SplitEntry } from '../types'

export function totalSaleValue(entries: SplitEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.finalSaleValue ?? 0), 0)
}

function equalSplit(total: number, members: SessionMember[]): Record<string, number> {
  if (members.length === 0) return {}
  const share = Math.floor(total / members.length)
  return Object.fromEntries(members.map((m) => [m.uid, share]))
}

function contributionSplit(
  total: number,
  members: SessionMember[],
  entries: SplitEntry[],
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(members.map((m) => [m.uid, 0]))
  for (const e of entries) {
    if (e.createdBy in counts) counts[e.createdBy]++
  }
  const totalEntries = Object.values(counts).reduce((a, b) => a + b, 0)
  if (totalEntries === 0) return equalSplit(total, members)
  return Object.fromEntries(
    Object.entries(counts).map(([uid, count]) => [uid, Math.floor(total * (count / totalEntries))])
  )
}

export function calculateSplits(
  session: Pick<Session, 'splitMode' | 'customSplits'>,
  members: SessionMember[],
  entries: SplitEntry[],
): Record<string, number> {
  const total = totalSaleValue(entries)
  if (session.splitMode === 'contribution') return contributionSplit(total, members, entries)
  if (session.splitMode === 'custom' && session.customSplits) {
    return Object.fromEntries(
      Object.entries(session.customSplits).map(([uid, pct]) => [uid, Math.floor((total * pct) / 100)])
    )
  }
  return equalSplit(total, members)
}
