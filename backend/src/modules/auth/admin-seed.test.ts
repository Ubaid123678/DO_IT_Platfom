import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';

import { seedAdminIfMissing, type SeedAdminStore } from './admin-seed.js';

describe('seedAdminIfMissing', () => {
  it('creates an admin once and leaves the existing account unchanged on subsequent runs', async () => {
    let admin: { email: string } | null = null;
    let storedPasswordHash = '';
    const store: SeedAdminStore = {
      findAdmin: vi.fn(async () => admin),
      findByEmail: vi.fn(async () => null),
      create: vi.fn(async (user) => {
        admin = { email: user.email };
        storedPasswordHash = user.passwordHash;
        return admin;
      }),
    };

    const firstResult = await seedAdminIfMissing(
      'Admin@Example.com',
      'StrongPass123!',
      store,
    );
    const secondResult = await seedAdminIfMissing(
      'Admin@Example.com',
      'DifferentPass123!',
      store,
    );

    expect(firstResult).toEqual({ created: true, email: 'admin@example.com' });
    expect(secondResult).toEqual({
      created: false,
      email: 'admin@example.com',
    });
    expect(store.create).toHaveBeenCalledTimes(1);
    await expect(
      bcrypt.compare('StrongPass123!', storedPasswordHash),
    ).resolves.toBe(true);
  });
});
