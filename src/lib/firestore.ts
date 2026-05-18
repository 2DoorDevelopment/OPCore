import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createUniqueCode } from './codes'
import { calculateSplits, totalSaleValue } from './splits'
import type { Session, SessionMember, RockEntry, SalvageEntry, SplitMode, SplitEntry } from '../types'

// ── Session creation ─────────────────────────────────────────────────────────

async function createSession(
  type: 'mining' | 'salvage',
  hostUid: string,
  displayName: string,
  photoURL: string | null,
): Promise<string> {
  const code = await createUniqueCode()
  const batch = writeBatch(db)
  batch.set(doc(db, 'sessions', code), {
    code, type, hostUid,
    createdAt: serverTimestamp(),
    closedAt: null,
    status: 'active',
    splitMode: 'equal',
    customSplits: null,
  })
  batch.set(doc(db, 'sessions', code, 'members', hostUid), {
    uid: hostUid, displayName, photoURL, role: 'host', joinedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', hostUid), { sessionCodes: arrayUnion(code) })
  await batch.commit()
  return code
}

export const createMiningSession = (uid: string, name: string, photo: string | null) =>
  createSession('mining', uid, name, photo)

export const createSalvageSession = (uid: string, name: string, photo: string | null) =>
  createSession('salvage', uid, name, photo)

// ── Join ─────────────────────────────────────────────────────────────────────

export async function joinSession(
  code: string,
  uid: string,
  displayName: string,
  photoURL: string | null,
): Promise<void> {
  const sessionSnap = await getDoc(doc(db, 'sessions', code))
  if (!sessionSnap.exists()) throw new Error('Session not found.')
  if ((sessionSnap.data() as Session).status === 'closed') throw new Error('Session is already closed.')

  const memberRef = doc(db, 'sessions', code, 'members', uid)
  if ((await getDoc(memberRef)).exists()) return

  const batch = writeBatch(db)
  batch.set(memberRef, { uid, displayName, photoURL, role: 'member', joinedAt: serverTimestamp() })
  batch.update(doc(db, 'users', uid), { sessionCodes: arrayUnion(code) })
  await batch.commit()
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getSessionCodes(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ((snap.data().sessionCodes as string[]) ?? []) : []
}

export async function getSession(code: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'sessions', code))
  return snap.exists() ? (snap.data() as Session) : null
}

// ── Realtime subscriptions ───────────────────────────────────────────────────

export const subscribeToSession = (code: string, cb: (s: Session | null) => void): Unsubscribe =>
  onSnapshot(doc(db, 'sessions', code), (snap) => cb(snap.exists() ? (snap.data() as Session) : null))

export const subscribeToMembers = (code: string, cb: (m: SessionMember[]) => void): Unsubscribe =>
  onSnapshot(collection(db, 'sessions', code, 'members'), (snap) =>
    cb(snap.docs.map((d) => d.data() as SessionMember))
  )

export const subscribeToRocks = (code: string, cb: (r: RockEntry[]) => void): Unsubscribe =>
  onSnapshot(collection(db, 'sessions', code, 'rocks'), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), rockId: d.id }) as RockEntry))
  )

export const subscribeToSalvage = (code: string, cb: (e: SalvageEntry[]) => void): Unsubscribe =>
  onSnapshot(collection(db, 'sessions', code, 'salvage'), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), salvageId: d.id }) as SalvageEntry))
  )

// ── Rock entries ─────────────────────────────────────────────────────────────

export async function addRock(
  code: string, uid: string,
  rock: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, 'sessions', code, 'rocks'), { ...rock, createdBy: uid, createdAt: serverTimestamp() })
}

export async function updateRock(
  code: string, rockId: string,
  updates: Partial<Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'sessions', code, 'rocks', rockId), updates)
}

export const deleteRock = (code: string, rockId: string) =>
  deleteDoc(doc(db, 'sessions', code, 'rocks', rockId))

// ── Salvage entries ──────────────────────────────────────────────────────────

export async function addSalvageEntry(
  code: string, uid: string,
  entry: Omit<SalvageEntry, 'salvageId' | 'createdBy' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, 'sessions', code, 'salvage'), { ...entry, createdBy: uid, createdAt: serverTimestamp() })
}

export async function updateSalvageEntry(
  code: string, salvageId: string,
  updates: Partial<Omit<SalvageEntry, 'salvageId' | 'createdBy' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'sessions', code, 'salvage', salvageId), updates)
}

export const deleteSalvageEntry = (code: string, salvageId: string) =>
  deleteDoc(doc(db, 'sessions', code, 'salvage', salvageId))

// ── Split mode ───────────────────────────────────────────────────────────────

export async function updateSessionSplitMode(
  code: string,
  splitMode: SplitMode,
  customSplits: Record<string, number> | null,
): Promise<void> {
  await updateDoc(doc(db, 'sessions', code), { splitMode, customSplits })
}

// ── Close session ────────────────────────────────────────────────────────────

export async function closeSession(
  code: string,
  session: Session,
  members: SessionMember[],
  entries: SplitEntry[],
): Promise<void> {
  const finalSplits = calculateSplits(session, members, entries)
  const finalTotalValue = totalSaleValue(entries)
  await updateDoc(doc(db, 'sessions', code), {
    status: 'closed',
    closedAt: serverTimestamp(),
    finalSplits,
    finalTotalValue,
  })
}

// ── Misc ─────────────────────────────────────────────────────────────────────

export async function ensureSessionCodesField(uid: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { sessionCodes: [] }, { merge: true })
}
