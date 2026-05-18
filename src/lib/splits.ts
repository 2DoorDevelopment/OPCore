import type { RockEntry, SessionMember, Session } from '../types'

export function totalSaleValue(rocks: RockEntry[]): number {
  return rocks.reduce((sum, r) => sum + (r.finalSaleValue ?? 0), 0)
}

function equalSplit(total: number, members: SessionMember[]): Record<string, number> {
  if (members.length === 0) return {}
  const share = Math.floor(total / members.length)
  return Object.fromEntries(members.map((m) => [m.uid, share]))
}

function contributionSplit(
  total: number,
  members: SessionMember[],
  rocks: RockEntry[],
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(members.map((m) => [m.uid, 0]))
  for (const rock of rocks) {
    if (rock.createdBy in counts) counts[rock.createdBy]++
  }
  const totalRocks = Object.values(counts).reduce((a, b) => a + b, 0)
  if (totalRocks === 0) return equalSplit(total, members)
  return Object.fromEntries(
    Object.entries(counts).map(([uid, count]) => [uid, Math.floor(total * (count / totalRocks))])
  )
}

export function calculateSplits(
  session: Pick<Session, 'splitMode' | 'customSplits'>,
  members: SessionMember[],
  rocks: RockEntry[],
): Record<string, number> {
  const total = totalSaleValue(rocks)
  if (session.splitMode === 'contribution') return contributionSplit(total, members, rocks)
  if (session.splitMode === 'custom' && session.customSplits) {
    return Object.fromEntries(
      Object.entries(session.customSplits).map(([uid, pct]) => [uid, Math.floor((total * pct) / 100)])
    )
  }
  return equalSplit(total, members)
}
