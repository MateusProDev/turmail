import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

let initialized = false

function ensureInitialized() {
  if (initialized) return
  if (typeof window === 'undefined') return
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  initialized = true
}

export function getClientAuth() {
  ensureInitialized()
  try {
    return typeof window !== 'undefined' ? getAuth() : null
  } catch (err) {
    return null
  }
}

export function getClientDb() {
  ensureInitialized()
  try {
    return typeof window !== 'undefined' ? getFirestore() : null
  } catch (err) {
    return null
  }
}
