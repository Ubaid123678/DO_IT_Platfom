import axios from 'axios';

import { AppError } from '../../common/errors/AppError.js';
import {
  ConnectedAccountModel,
  VerificationRecordModel,
  type VerificationStatus,
} from './verification.model.js';

interface GitHubUserData {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  html_url: string;
  topics: string[];
  updated_at: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

async function fetchGitHubUser(username: string): Promise<GitHubUserData> {
  try {
    const res = await axios.get(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'do-it-platform' },
      timeout: 10000,
    });
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new AppError('GitHub user not found', 404, 'GITHUB_USER_NOT_FOUND');
    }
    throw new AppError('Failed to verify GitHub profile', 502, 'GITHUB_VERIFICATION_FAILED');
  }
}

async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const res = await axios.get(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos`, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'do-it-platform' },
      params: { sort: 'updated', per_page: 30, type: 'public' },
      timeout: 10000,
    });
    return res.data;
  } catch {
    return [];
  }
}

function analyzeReposForSkills(repos: GitHubRepo[], skillKeywords: string[]): { match_count: number; matched_repos: string[]; languages: string[] } {
  const matchedRepos: string[] = [];
  const languages = new Set<string>();

  for (const repo of repos) {
    if (repo.fork) continue;
    if (repo.language) languages.add(repo.language);
    for (const topic of repo.topics) languages.add(topic);

    const searchText = [repo.name, repo.description, ...repo.topics].filter(Boolean).join(' ').toLowerCase();
    const matched = skillKeywords.some((kw) => searchText.includes(kw.toLowerCase()));
    if (matched) matchedRepos.push(repo.html_url);
  }

  return { match_count: matchedRepos.length, matched_repos: matchedRepos, languages: Array.from(languages) };
}

export const verificationAutoService = {
  verifyGitHubUsername: async (username: string, skillKeywords?: string[]) => {
    const [userData, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);

    const repoAnalysis = skillKeywords && skillKeywords.length > 0
      ? analyzeReposForSkills(repos, skillKeywords)
      : { match_count: 0, matched_repos: [], languages: [] };

    const nonForkRepos = repos.filter((r) => !r.fork);

    const verificationScore = (() => {
      let score = 0;
      if (userData.public_repos >= 5) score += 0.2;
      if (userData.followers >= 10) score += 0.15;
      if (nonForkRepos.length >= 5) score += 0.15;
      if (userData.bio) score += 0.1;
      if (repoAnalysis.match_count >= 1) score += 0.3;
      if (repoAnalysis.languages.length > 0) score += 0.1;
      return Math.min(score, 1);
    })();

    return {
      platform_user_id: userData.id.toString(),
      platform_data: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
        company: userData.company,
        location: userData.location,
        bio: userData.bio,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        account_age_days: Math.floor((Date.now() - new Date(userData.created_at).getTime()) / 86400000),
      },
      repo_analysis: repoAnalysis,
      verification_score: verificationScore,
      verified: verificationScore >= 0.5,
    };
  },

  verifyCredentialUrl: async (url: string): Promise<{ valid: boolean; status_code: number; content_type?: string }> => {
    try {
      const res = await axios.head(url, { timeout: 15000, validateStatus: () => true });
      const valid = res.status >= 200 && res.status < 400;
      return { valid, status_code: res.status, content_type: res.headers['content-type'] };
    } catch {
      return { valid: false, status_code: 0 };
    }
  },

  applyAutoVerification: async (recordId: string, autoResult: Record<string, unknown>): Promise<void> => {
    const record = await VerificationRecordModel.findById(recordId);
    if (!record) return;

    record.set('auto_check_result', autoResult);
    const score = (autoResult.verification_score as number) ?? 0;
    let newStatus: VerificationStatus = 'pending_review';
    if (score >= 0.7) newStatus = 'auto_approved';
    else if (score >= 0.4) newStatus = 'pending_review';
    record.set('status', newStatus);
    await record.save();
  },

  connectOAuthPlatform: async (
    providerId: string,
    platform: 'github' | 'upwork' | 'linkedin',
    username: string,
    skillKeywords?: string[],
  ) => {
    const existing = await ConnectedAccountModel.findOne({ provider_id: providerId, platform });
    if (existing) {
      existing.set('username', username);
      existing.set('verified', false);
      existing.set('verified_at', undefined);
      existing.set('platform_data', undefined);
      await existing.save();
    }

    if (platform === 'github') {
      const verification = await verificationAutoService.verifyGitHubUsername(username, skillKeywords);

      const account = existing ?? new ConnectedAccountModel({
        provider_id: providerId,
        platform,
        username,
      });

      account.set('platform_user_id', verification.platform_user_id);
      account.set('platform_data', verification.platform_data);
      account.set('verified', verification.verified);
      account.set('verified_at', verification.verified ? new Date() : undefined);

      if (!existing) await account.save();
      else await account.save();

      return {
        platform,
        username,
        verified: verification.verified,
        verification_score: verification.verification_score,
        platform_data: verification.platform_data,
        repo_analysis: verification.repo_analysis,
      };
    }

    if (!existing) {
      await ConnectedAccountModel.create({
        provider_id: providerId,
        platform,
        username,
      });
    }

    return {
      platform,
      username,
      verified: false,
      platform_data: null,
    };
  },

  getConnectedAccounts: async (providerId: string) => {
    const accounts = await ConnectedAccountModel.find({ provider_id: providerId }).lean();
    return accounts.map((a) => ({
      id: a._id.toString(),
      platform: a.platform,
      username: a.username,
      platform_user_id: a.platform_user_id ?? null,
      verified: a.verified,
      verified_at: a.verified_at ?? null,
      connected_at: a.connected_at,
    }));
  },
};
