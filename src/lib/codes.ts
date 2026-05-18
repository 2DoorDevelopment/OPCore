import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('')
}

export async function createUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode()
    const snap = await getDoc(doc(db, 'sessions', code))
    if (!snap.exists()) return code
  }
  throw new Error('Failed to generate a unique session code — try again.')
}
