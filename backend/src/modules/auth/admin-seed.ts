import { AppError } from '../../common/errors/AppError.js';
import config from '../../config/env.js';
import UserModel from './auth.model.js';
import { authValidators } from './auth.validation.js';
import { hashPassword } from './password.js';

export interface SeedAdminResult {
  created: boolean;
  email: string;
}

interface SeedAdminInput {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'admin';
  countryCode: string;
  emailVerified: true;
  phoneVerified: true;
}

export interface SeedAdminStore {
  findAdmin: () => Promise<{ email: string } | null>;
  findByEmail: (email: string) => Promise<{ role: string } | null>;
  create: (user: SeedAdminInput) => Promise<{ email: string }>;
}

const userStore: SeedAdminStore = {
  findAdmin: async () => {
    const user = await UserModel.findOne({ role: 'admin' });
    return user ? { email: user.email } : null;
  },
  findByEmail: async (email) => {
    const user = await UserModel.findOne({ email });
    return user ? { role: user.role } : null;
  },
  create: async (user) => {
    const createdUser = await UserModel.create(user);
    return { email: createdUser.email };
  },
};

export const seedAdminIfMissing = async (
  email: string,
  password: string,
  store: SeedAdminStore = userStore,
): Promise<SeedAdminResult> => {
  const validation = authValidators.login.validate({ email, password });
  if (validation.error) {
    throw new AppError(validation.error.message, 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingAdmin = await store.findAdmin();
  if (existingAdmin) {
    return { created: false, email: existingAdmin.email };
  }

  const existingUser = await store.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(
      'The configured admin email already belongs to a non-admin user',
      409,
      'ADMIN_EMAIL_ALREADY_IN_USE',
    );
  }

  const passwordHash = await hashPassword(password);
  const admin = await store.create({
    fullName: 'Admin User',
    email: normalizedEmail,
    phone: config.admin_phone,
    passwordHash,
    role: 'admin',
    countryCode: config.admin_country_code,
    emailVerified: true,
    phoneVerified: true,
  });

  return { created: true, email: admin.email };
};
