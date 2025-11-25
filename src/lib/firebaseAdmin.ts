import admin from 'firebase-admin'

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  })
}

// export admin so other modules can access FieldValue and other helpers
export const adminInstance = admin
export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
