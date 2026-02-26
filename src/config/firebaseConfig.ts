import { initializeApp, getApps } from 'firebase/app'
import { getAuth, indexedDBLocalPersistence, initializeAuth, browserPopupRedirectResolver } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase config values are intentionally public — they identify the project but do not
 * grant access. Security is enforced exclusively by Firestore security rules and Firebase Auth.
 * See: https://firebase.google.com/docs/projects/api-keys
 *
 * Dev  → mundo1-dev   (shared with voyager-RN / voyager-pwa dev environment)
 * Prod → mundo1-1     (shared with voyager-RN / voyager-pwa production)
 */
const devConfig = {
  apiKey: 'AIzaSyCbckV9cMuKUM4ZnvYDJZUvfukshsZfvM0',
  authDomain: 'mundo1-dev.firebaseapp.com',
  projectId: 'mundo1-dev',
  storageBucket: 'mundo1-dev.firebasestorage.app',
  messagingSenderId: '296095212837',
  appId: '1:296095212837:web:6fd8f831e3d7f642f726cc',
}

const prodConfig = {
  apiKey: 'AIzaSyBzRHcKiuCj7vvqJxGDELs2zEXQ0QvQhbk',
  // Use the custom domain as authDomain so the auth iframe is same-origin in Safari.
  // See: https://firebase.google.com/docs/auth/web/redirect-best-practices
  authDomain: 'travalpass.com',
  projectId: 'mundo1-1',
  storageBucket: 'mundo1-1.appspot.com',
  messagingSenderId: '533074391000',
  appId: '1:533074391000:web:2ef7404546e97f4aa2ccad',
}

const firebaseConfig = import.meta.env.MODE === 'production' ? prodConfig : devConfig

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// IndexedDB persistence: survives hard refreshes, is scoped to the origin,
// and maintains auth state across tabs without exposing tokens in localStorage.
let auth: ReturnType<typeof getAuth>
try {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
} catch {
  // initializeAuth throws if already initialized (e.g. HMR). Fall back gracefully.
  auth = getAuth(app)
}

const db = getFirestore(app)

export { app, auth, db }
