import mongoose from 'mongoose';
import { JobModel } from '../jobs/job.model.js';
import UserModel from '../auth/auth.model.js';
import { AppError } from '../../common/errors/AppError.js';

// Extended provider profile for matching (includes dynamic fields from Mixed type)
interface ExtendedProviderProfile {
  avatar_url?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  service_radius_km?: number;
  availability?: {
    days: string[];
    shifts: string[];
    hours_per_week: number;
  };
  rating?: number;
}

interface ProviderWithExtendedProfile {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  rating?: number;
  categories_selected?: string[];
  skill_items_selected?: string[];
  overall_status?: string;
  provider_profile?: ExtendedProviderProfile;
}

interface MatchingOptions {
  jobId: string;
  limit?: number;
  minRating?: number;
}

interface MatchedProvider {
  providerId: string;
  fullName: string;
  avatarUrl?: string;
  rating: number;
  distance?: number;
  skillOverlap: number;
  verifiedCategories: string[];
  serviceRadius?: number;
  isAvailable: boolean;
  matchScore: number;
}

interface MatchingResult {
  jobId: string;
  matches: MatchedProvider[];
  totalCandidates: number;
  notified: number;
}

const MIN_RATING = 4.0;
const DEFAULT_LIMIT = 10;

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateSkillOverlap = (
  providerSkillItems: string[],
  jobSkillItems: string[],
  _jobCategories: string[]
): number => {
  if (jobSkillItems.length === 0) return 0.5; // Neutral if no specific skills
  const overlap = jobSkillItems.filter((skill) => providerSkillItems.includes(skill)).length;
  return overlap / jobSkillItems.length;
};

export const matchingEngine = {
  findMatchingProviders: async (options: MatchingOptions): Promise<MatchingResult> => {
    const { jobId, limit = DEFAULT_LIMIT, minRating = MIN_RATING } = options;

    const job = await JobModel.findById(jobId)
      .populate('requirements.categories', 'name job_type')
      .populate('requirements.skillItems', 'name')
      .lean();

    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.status !== 'open') throw new AppError('Job is not open', 400, 'JOB_NOT_OPEN');

    const jobCategories = (job.requirements.categories as any[])?.map((c) => c._id.toString()) || [];
    const jobSkillItems = (job.requirements.skillItems as any[])?.map((s) => s._id.toString()) || [];
    const jobType = job.type;
    const jobLocation = job.location?.coordinates;

    // Build base filter for providers
    const providerFilter: any = {
      role: 'provider',
      'provider_profile.availability': { $exists: true, $ne: null },
      overall_status: 'verified',
      rating: { $gte: minRating },
    };

    // Add category/skill filter based on job type
    if (jobType === 'physical' || jobType === 'errand') {
      // Geo-based matching
      if (jobLocation) {
        providerFilter['provider_profile.location'] = {
          $near: {
            $geometry: { type: 'Point', coordinates: jobLocation },
            $maxDistance: 50000, // 50km default, will filter by service_radius per provider
          },
        };
      }
    }

    // For digital jobs, no geo constraint but need skill match
    if (jobType === 'digital') {
      providerFilter['categories_selected'] = { $in: jobCategories };
      if (jobSkillItems.length > 0) {
        providerFilter['skill_items_selected'] = { $in: jobSkillItems };
      }
    }

    const providers = await UserModel.find(providerFilter)
      .select('fullName provider_profile rating categories_selected skill_items_selected overall_status')
      .lean();

    // Filter and score each provider
    const matches: MatchedProvider[] = [];

    for (const provider of providers) {
      const p = provider as any as ProviderWithExtendedProfile;

      // Check if provider has verified the required categories
      const verifiedCategories = (p.categories_selected || []).filter((catId: string) =>
        jobCategories.includes(catId)
      );

      if (verifiedCategories.length === 0) continue; // Must have at least one matching verified category

      // For physical/errand: check distance and service radius
      let distance: number | undefined;
      let withinRadius = true;

      if (jobType === 'physical' || jobType === 'errand') {
        if (jobLocation && p.provider_profile?.location?.coordinates) {
          distance = calculateDistance(
            jobLocation[1], // lat
            jobLocation[0], // lon
            p.provider_profile.location.coordinates[1],
            p.provider_profile.location.coordinates[0]
          );
          const serviceRadius = p.provider_profile?.service_radius_km || 50;
          withinRadius = distance <= serviceRadius;
        } else {
          withinRadius = false;
        }
      }

      if (!withinRadius) continue;

      // Calculate skill overlap
      const providerSkillItems = p.skill_items_selected || [];
      const skillOverlap = calculateSkillOverlap(providerSkillItems, jobSkillItems, jobCategories);

      // Check availability
      const isAvailable = (p.provider_profile?.availability?.days?.length ?? 0) > 0;

      // Calculate match score (0-100)
      const matchScore = Math.round(
        (skillOverlap * 40) +
        (Math.min((p.rating || 0) / 5, 1) * 25) +
        (verifiedCategories.length / Math.max(jobCategories.length, 1) * 20) +
        (isAvailable ? 15 : 0)
      );

      matches.push({
        providerId: p._id.toString(),
        fullName: p.fullName,
        avatarUrl: p.provider_profile?.avatar_url,
        rating: p.rating || 0,
        distance,
        skillOverlap: Math.round(skillOverlap * 100),
        verifiedCategories,
        serviceRadius: p.provider_profile?.service_radius_km,
        isAvailable,
        matchScore,
      });
    }

    // Sort by match score descending, then by distance ascending
    matches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
      return 0;
    });

    // Limit results
    const limitedMatches = matches.slice(0, limit);

    return {
      jobId,
      matches: limitedMatches,
      totalCandidates: providers.length,
      notified: 0, // Will be updated after notifications
    };
  },

  notifyMatchingProviders: async (_jobId: string, providerIds: string[]) => {
    // This would integrate with the notification service
    // For now, we just return the count
    return providerIds.length;
  },

  autoMatchAndNotify: async (jobId: string, options: { limit?: number; minRating?: number } = {}) => {
    const result = await matchingEngine.findMatchingProviders({ jobId, ...options });
    const providerIds = result.matches.map((m) => m.providerId);
    const notified = await matchingEngine.notifyMatchingProviders(jobId, providerIds);
    return { ...result, notified };
  },
};