import Bull from 'bull';
import config from '../../config/env.js';
import { verificationAutoService } from './verification-auto.service.js';

interface OAuthVerifyJob {
  type: 'oauth-verify';
  providerId: string;
  platform: 'github' | 'upwork' | 'linkedin';
  username: string;
  skillKeywords?: string[];
}

interface CredentialUrlVerifyJob {
  type: 'credential-url-verify';
  recordId: string;
  url: string;
  skillKeywords?: string[];
}

type VerificationJob = OAuthVerifyJob | CredentialUrlVerifyJob;

let verificationQueue: Bull.Queue<VerificationJob> | null = null;

let isRedisAvailable = false;

export function getVerificationQueue(): Bull.Queue<VerificationJob> | null {
  return verificationQueue;
}

export async function initializeVerificationWorker(): Promise<void> {
  try {
    verificationQueue = new Bull<VerificationJob>('verification', config.redis_url);

    await verificationQueue.isReady();
    isRedisAvailable = true;
    console.log('[verification-worker] Connected to Redis, worker active');

    verificationQueue.process(async (job) => {
      const data = job.data;

      switch (data.type) {
        case 'oauth-verify': {
          const result = await verificationAutoService.connectOAuthPlatform(
            data.providerId,
            data.platform,
            data.username,
            data.skillKeywords,
          );
          return result;
        }

        case 'credential-url-verify': {
          const check = await verificationAutoService.verifyCredentialUrl(data.url);
          await verificationAutoService.applyAutoVerification(data.recordId, {
            url_checked: data.url,
            ...check,
            verified_at: new Date().toISOString(),
          });
          return check;
        }

        default:
          throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
      }
    });

    verificationQueue.on('failed', (job, err) => {
      console.error(`[verification-worker] Job ${job.id} failed:`, err.message);
    });

    verificationQueue.on('completed', (job, result) => {
      console.log(`[verification-worker] Job ${job.id} completed:`, typeof result === 'object' ? JSON.stringify(result).slice(0, 200) : result);
    });
  } catch (err) {
    console.warn('[verification-worker] Redis unavailable, auto-verification queue disabled. Inline verification will be used.');
    isRedisAvailable = false;
  }
}

export async function enqueueOAuthVerification(
  providerId: string,
  platform: 'github' | 'upwork' | 'linkedin',
  username: string,
  skillKeywords?: string[],
) {
  if (isRedisAvailable && verificationQueue) {
    await verificationQueue.add({
      type: 'oauth-verify',
      providerId,
      platform,
      username,
      skillKeywords,
    });
  } else {
    await verificationAutoService.connectOAuthPlatform(providerId, platform, username, skillKeywords);
  }
}

export async function enqueueCredentialUrlVerification(
  recordId: string,
  url: string,
  skillKeywords?: string[],
) {
  if (isRedisAvailable && verificationQueue) {
    await verificationQueue.add({
      type: 'credential-url-verify',
      recordId,
      url,
      skillKeywords,
    });
  } else {
    const check = await verificationAutoService.verifyCredentialUrl(url);
    await verificationAutoService.applyAutoVerification(recordId, {
      url_checked: url,
      ...check,
      verified_at: new Date().toISOString(),
    });
  }
}
