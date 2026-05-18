import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<void> {
  const result = await signInWithPopup(auth, provider)
  await ensureUserDoc(result.user)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      handle: null,
    })
  } else {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true })
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) ensureUserDoc(u)
    })
    return unsub
  }, [])

  return { user, loading }
}
