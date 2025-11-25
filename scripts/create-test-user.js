const admin = require('firebase-admin');

function initAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing FIREBASE_ADMIN credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  }
}

async function main() {
  initAdmin();
  const auth = admin.auth();

  const email = process.env.TEST_USER_EMAIL || 'e2e-test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

  try {
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      console.log(`User already exists: ${email} (uid=${existing.uid})`);
      console.log(`Set these in PowerShell:`);
      console.log(`$env:TEST_USER_EMAIL = '${email}'`);
      console.log(`$env:TEST_USER_PASSWORD = '${password}'`);
      return;
    }

    const user = await auth.createUser({
      email,
      password,
      emailVerified: true,
      disabled: false
    });

    console.log(`Created test user: ${email} (uid=${user.uid})`);
    console.log(`Set these in PowerShell:`);
    console.log(`$env:TEST_USER_EMAIL = '${email}'`);
    console.log(`$env:TEST_USER_PASSWORD = '${password}'`);
  } catch (err) {
    console.error('Error creating test user:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
