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
      params: { sort: 'updated', per_page: 100 },
      timeout: 10000,
    });
    return res.data;
  } catch {
    return [];
  }
}

const WEB_LANGUAGES = new Set([
  'javascript', 'typescript', 'html', 'css', 'scss', 'sass', 'less',
  'php', 'ruby', 'python', 'go', 'java', 'vue', 'svelte', 'astro',
  'react', 'next', 'shell', 'hcl', 'django', 'flask', 'laravel',
]);

const MOBILE_LANGUAGES = new Set([
  'kotlin', 'swift', 'dart', 'java', 'objective-c', 'c#', 'typescript', 'javascript', 'c++',
]);

interface ExpandedKeywords {
  terms: string[];
  isWebSkill: boolean;
  isMobileSkill: boolean;
}

function expandSkillKeywords(skillKeywords: string[]): ExpandedKeywords {
  const terms = new Set<string>();
  const joined = skillKeywords.join(' ').toLowerCase();

  for (const kw of skillKeywords) {
    const lower = kw.toLowerCase();
    terms.add(lower);
    // Break multi-word skills ("Web Development Full Stack") into individual
    // tokens so repos describing only part of the skill still match.
    for (const part of lower.split(/[^a-z0-9+#._-]+/)) {
      if (part.length >= 3) terms.add(part);
    }
  }

  const isWebSkill = /\b(web|frontend|front-end|backend|back-end|full[\s-]?stack|fullstack|website|html|css|javascript|react|node)\b/.test(joined);
  const isMobileSkill = /\b(mobile|android|ios|flutter|react[\s-]?native|app)\b/.test(joined);

  return { terms: Array.from(terms), isWebSkill, isMobileSkill };
}

function analyzeReposForSkills(repos: GitHubRepo[], skillKeywords: string[]): { match_count: number; matched_repos: string[]; languages: string[] } {
  const { terms, isWebSkill, isMobileSkill } = expandSkillKeywords(skillKeywords);
  const matchedRepos: string[] = [];
  const languages = new Set<string>();

  const languageMatchesDomain = (lang: string | null): boolean => {
    const l = (lang || '').toLowerCase();
    if (!l) return false;
    if (isWebSkill && WEB_LANGUAGES.has(l)) return true;
    if (isMobileSkill && MOBILE_LANGUAGES.has(l)) return true;
    return false;
  };

  for (const repo of repos) {
    if (repo.fork) continue;
    if (repo.language) languages.add(repo.language);
    for (const topic of repo.topics) languages.add(topic);

    // Match against the repo name, description, topics AND primary language so a
    // "Web Development Full Stack" skill matches repos that simply use web tech.
    const searchText = [repo.name, repo.description, ...repo.topics, repo.language]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let matched = terms.some((term) => searchText.includes(term));

    // Fallback: when no text token matches, count repos written in a language that
    // belongs to the skill's domain (e.g. a JS/HTML portfolio for a web skill).
    if (!matched && languageMatchesDomain(repo.language)) {
      matched = true;
    }

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
      if (userData.public_repos >= 10) score += 0.2;
      else if (userData.public_repos >= 5) score += 0.15;
      else if (userData.public_repos >= 1) score += 0.05;
      if (userData.followers >= 20) score += 0.15;
      else if (userData.followers >= 10) score += 0.1;
      if (nonForkRepos.length >= 10) score += 0.15;
      else if (nonForkRepos.length >= 5) score += 0.1;
      else if (nonForkRepos.length >= 1) score += 0.05;
      if (userData.bio) score += 0.1;
      if (repoAnalysis.match_count >= 3) score += 0.35;
      else if (repoAnalysis.match_count >= 1) score += 0.25;
      if (repoAnalysis.languages.length >= 3) score += 0.1;
      else if (repoAnalysis.languages.length >= 1) score += 0.05;
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

  verifyPortfolioUrl: async (url: string): Promise<{ valid: boolean; status_code: number; content_length: number }> => {
    try {
      const res = await axios.get(url, {
        timeout: 15000,
        validateStatus: () => true,
        maxContentLength: 5 * 1024 * 1024,
        maxRedirects: 5,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/json,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const contentLength = typeof res.data === 'string' ? res.data.length : 0;
      const valid = res.status >= 200 && res.status < 400 && contentLength > 0;
      return { valid, status_code: res.status, content_length: contentLength };
    } catch {
      return { valid: false, status_code: 0, content_length: 0 };
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
