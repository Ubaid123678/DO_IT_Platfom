import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import config from '../../config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import type { UserRole } from './auth.model.js';

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

type RefreshTokenPayload = {
  sub: string;
  tokenVersion: number;
  type: 'refresh';
};

const getRequiredSecret = (value: string, keyName: string): string => {
  if (!value || value === 'change-me') {
    throw new AppError(`${keyName} is not configured`, 500, 'MISSING_SECRET');
  }
  return value;
};

export const generateOtp = (): string => {
  return `${crypto.randomInt(0, 999999)}`.padStart(6, '0');
};

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const secret = getRequiredSecret(config.jwt_secret, 'JWT_SECRET');
  const options: SignOptions = {
    expiresIn: config.jwt_expires_in as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret = getRequiredSecret(config.jwt_refresh_secret, 'JWT_REFRESH_SECRET');
  const options: SignOptions = {
    expiresIn: config.jwt_refresh_expires_in as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const secret = getRequiredSecret(config.jwt_secret, 'JWT_SECRET');
  return jwt.verify(token, secret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret = getRequiredSecret(config.jwt_refresh_secret, 'JWT_REFRESH_SECRET');
  return jwt.verify(token, secret) as RefreshTokenPayload;
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
