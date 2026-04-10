import { api } from './api';

export const jobService = {
  createJob: (payload: Record<string, unknown>) => api.post('/jobs', payload),
  getJobs: () => api.get('/jobs'),
  getMyJobs: () => api.get('/jobs/mine'),
};
