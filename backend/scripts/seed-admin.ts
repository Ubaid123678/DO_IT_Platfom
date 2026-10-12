import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDatabase } from '../src/config/database.js';
import { seedAdminIfMissing } from '../src/modules/auth/admin-seed.js';

const main = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin user.',
    );
  }

  await connectDatabase();
  try {
    const result = await seedAdminIfMissing(email, password);
    if (result.created) {
      console.log(`[seed:admin] Created admin user ${result.email}.`);
    } else {
      console.log(
        `[seed:admin] Admin user ${result.email} already exists; no changes made.`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error('[seed:admin] Failed to seed admin user.', error);
  process.exitCode = 1;
});
