import crypto from 'node:crypto';

import config from '../../config/env.js';

export type StorageProvider = 'mock' | 's3' | 'r2';

const normalizeStorageProvider = (value: string): StorageProvider => {
  if (value === 's3' || value === 'r2') {
    return value;
  }

  return 'mock';
};

const sanitizeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export const resolveStorageProvider = (): StorageProvider => normalizeStorageProvider(config.storage_provider);

export const buildKycStorageKey = (userId: string, fileName: string): string => {
  const safeName = sanitizeSegment(fileName || 'kyc-document');
  return `kyc/${userId}/${Date.now()}-${safeName}`;
};

export const buildSignedUploadUrl = (
  storageKey: string,
  mimeType: string,
  fileSizeBytes: number,
  requestedProvider?: StorageProvider,
): { uploadUrl: string; expiresAt: Date; storageProvider: StorageProvider } => {
  const storageProvider = requestedProvider || resolveStorageProvider();
  const expiresAt = new Date(Date.now() + config.kyc_upload_url_ttl_minutes * 60 * 1000);
  const payload = `${storageProvider}:${storageKey}:${mimeType}:${fileSizeBytes}:${expiresAt.toISOString()}`;
  const signature = crypto.createHmac('sha256', config.jwt_secret).update(payload).digest('hex');

  let baseUrl = 'https://mock-storage.local';
  if (storageProvider === 's3') {
    baseUrl = `https://${config.s3_bucket_name || 'do-it-kyc'}.s3.${config.aws_region}.amazonaws.com`;
  } else if (storageProvider === 'r2') {
    baseUrl = config.r2_public_url || `https://${config.s3_bucket_name || 'do-it-kyc'}.${config.r2_account_id || 'account'}.r2.cloudflarestorage.com`;
  }

  const uploadUrl = `${baseUrl}/${storageKey}?expires=${encodeURIComponent(expiresAt.toISOString())}&signature=${signature}`;
  return { uploadUrl, expiresAt, storageProvider };
};
