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
import type { Session, SessionMember, RockEntry } from '../types'

export async function createMiningSession(
  hostUid: string,
  displayName: string,
  photoURL: string | null,
): Promise<string> {
  const code = await createUniqueCode()
  const batch = writeBatch(db)

  batch.set(doc(db, 'sessions', code), {
    code,
    type: 'mining',
    hostUid,
    createdAt: serverTimestamp(),
    closedAt: null,
    status: 'active',
    splitMode: 'equal',
    customSplits: null,
  })

  batch.set(doc(db, 'sessions', code, 'members', hostUid), {
    uid: hostUid,
    displayName,
    photoURL,
    role: 'host',
    joinedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', hostUid), { sessionCodes: arrayUnion(code) })

  await batch.commit()
  return code
}

export async function joinSession(
  code: string,
  uid: string,
  displayName: string,
  photoURL: string | null,
): Promise<void> {
  const sessionSnap = await getDoc(doc(db, 'sessions', code))
  if (!sessionSnap.exists()) throw new Error('Session not found.')
  const session = sessionSnap.data() as Session
  if (session.status === 'closed') throw new Error('Session is already closed.')

  const memberRef = doc(db, 'sessions', code, 'members', uid)
  if ((await getDoc(memberRef)).exists()) return // already a member

  const batch = writeBatch(db)
  batch.set(memberRef, {
    uid,
    displayName,
    photoURL,
    role: 'member',
    joinedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', uid), { sessionCodes: arrayUnion(code) })
  await batch.commit()
}

export async function getSessionCodes(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return []
  return (snap.data().sessionCodes as string[]) ?? []
}

export async function getSession(code: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'sessions', code))
  return snap.exists() ? (snap.data() as Session) : null
}

export function subscribeToSession(
  code: string,
  callback: (session: Session | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'sessions', code), (snap) => {
    callback(snap.exists() ? (snap.data() as Session) : null)
  })
}

export function subscribeToMembers(
  code: string,
  callback: (members: SessionMember[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'sessions', code, 'members'), (snap) => {
    callback(snap.docs.map((d) => d.data() as SessionMember))
  })
}

export function subscribeToRocks(
  code: string,
  callback: (rocks: RockEntry[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'sessions', code, 'rocks'), (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), rockId: d.id }) as RockEntry))
  })
}

export async function addRock(
  code: string,
  uid: string,
  rock: Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, 'sessions', code, 'rocks'), {
    ...rock,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function updateRock(
  code: string,
  rockId: string,
  updates: Partial<Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'sessions', code, 'rocks', rockId), updates)
}

export async function deleteRock(code: string, rockId: string): Promise<void> {
  await deleteDoc(doc(db, 'sessions', code, 'rocks', rockId))
}

export async function closeSession(code: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', code), {
    status: 'closed',
    closedAt: serverTimestamp(),
  })
}

export async function ensureSessionCodesField(uid: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { sessionCodes: [] }, { merge: true })
}
