import bcrypt from 'bcryptjs';

const PASSWORD_HASH_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
