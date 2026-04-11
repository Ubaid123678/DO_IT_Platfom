import { api } from './api';

export const jobService = {
  createJob: (payload: Record<string, unknown>) => api.post('/jobs', payload),
  getJobs: () => api.get('/jobs'),
  getMyJobs: () => api.get('/jobs/mine'),
  submitReview: (payload: { jobId: string; rating: number; tags: string[]; comment: string }) =>
    api.post(`/jobs/${payload.jobId}/review`, {
      rating: payload.rating,
      tags: payload.tags,
      comment: payload.comment,
    }),
};
