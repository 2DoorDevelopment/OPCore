import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthError,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db, getFirebaseConfigIssues } from '../firebase'

const provider = new GoogleAuthProvider()
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
])
const LAST_AUTH_ERROR_KEY = 'opcore:last-auth-error'

function persistLastAuthError(message: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(LAST_AUTH_ERROR_KEY, message)
}

export function consumeLastAuthError(): string | null {
  if (typeof window === 'undefined') return null
  const message = window.sessionStorage.getItem(LAST_AUTH_ERROR_KEY)
  if (message) window.sessionStorage.removeItem(LAST_AUTH_ERROR_KEY)
  return message
}

function shouldPreferRedirectSignIn() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const host = window.location.hostname.toLowerCase()
  const ua = navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(ua)
  const isEmbeddedWebView = /\bwv\b|fbav|instagram|line\//.test(ua)
  return host.endsWith('.github.io') || isIos || isEmbeddedWebView
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as AuthError | undefined)?.code
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled before completion.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth. Add this site to Firebase Authentication → Settings → Authorized domains.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled in Firebase. Enable Google under Authentication → Sign-in method.'
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid. Verify your VITE_FIREBASE_* settings match your Firebase project.'
    case 'auth/network-request-failed':
      return 'Network error during sign-in. Check your connection and any browser privacy/ad-block settings, then try again.'
    default: {
      if (code) return `Sign-in failed (${code}). Check Firebase Authentication setup for this deployment.`
      if (error instanceof Error && error.message) return error.message
      return 'Sign-in failed. Please try again.'
    }
  }
}

export async function signInWithGoogle(): Promise<void> {
  const missingConfig = getFirebaseConfigIssues()
  if (missingConfig.length > 0) {
    throw new Error(
      `Firebase config is incomplete (${missingConfig.join(', ')}). Update your VITE_FIREBASE_* variables and redeploy.`
    )
  }

  if (shouldPreferRedirectSignIn()) {
    await signInWithRedirect(auth, provider)
    return
  }

  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    const code = (e as AuthError)?.code
    if (code && REDIRECT_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(auth, provider)
    } else {
      throw e
    }
  }
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
      sessionCodes: [],
    })
  } else {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true })
  }
}

// Race getRedirectResult against a 4s timeout so iOS never hangs
function safeGetRedirectResult() {
  return Promise.race([
    getRedirectResult(auth),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ])
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    safeGetRedirectResult()
      .then((result) => { if (result?.user) ensureUserDoc(result.user) })
      .catch((error) => {
        persistLastAuthError(getAuthErrorMessage(error))
      })

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) ensureUserDoc(u)
    })
    return unsub
  }, [])

  return { user, loading }
}
