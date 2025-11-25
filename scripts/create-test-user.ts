#!/usr/bin/env ts-node
import { adminAuth } from '../src/lib/firebaseAdmin';

async function main() {
  const email = process.env.TEST_USER_EMAIL || 'e2e-test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

  try {
    // try to find existing user
    const existing = await adminAuth.getUserByEmail(email).catch(() => null);
    if (existing) {
      console.log(`User already exists: ${email} (uid=${existing.uid})`);
      console.log(`Use these credentials for E2E: TEST_USER_EMAIL=${email} TEST_USER_PASSWORD=${password}`);
      return;
    }

    const user = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
      disabled: false
    });

    console.log(`Created test user: ${email} (uid=${user.uid})`);
    console.log(`Set environment variables for tests:`);
    console.log(`$env:TEST_USER_EMAIL = '${email}'`);
    console.log(`$env:TEST_USER_PASSWORD = '${password}'`);
  } catch (err: any) {
    console.error('Error creating test user:', err?.message || err);
    process.exit(1);
  }
}

main();
