import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

const coordinates = Joi.array().items(Joi.number()).length(2).required().messages({
  'array.length': 'Coordinates must be [longitude, latitude]',
});

const jobLocationSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: coordinates,
  address: Joi.string().trim().max(200).optional().allow(''),
  city: Joi.string().trim().max(100).optional().allow(''),
  country: Joi.string().trim().uppercase().min(2).max(2).optional().allow(''),
  formattedAddress: Joi.string().trim().max(300).optional().allow(''),
}).required();

const jobBudgetSchema = Joi.object({
  type: Joi.string().valid('fixed', 'hourly').required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().uppercase().min(3).max(3).default('USD'),
  hourlyRate: Joi.number().min(0).when('type', {
    is: 'hourly',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  estimatedHours: Joi.number().min(0).when('type', {
    is: 'hourly',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
}).required();

const jobScheduleSchema = Joi.object({
  startsAt: Joi.date().iso().optional(),
  endsAt: Joi.date().iso().min(Joi.ref('startsAt')).optional(),
  timezone: Joi.string().default('UTC'),
  isFlexible: Joi.boolean().default(true),
  preferredDays: Joi.array().items(Joi.string().trim().max(20)).optional(),
  preferredShifts: Joi.array().items(Joi.string().trim().max(20)).optional(),
}).required();

const jobRequirementsSchema = Joi.object({
  categories: Joi.array().items(objectId).min(1).max(3).required(),
  skillItems: Joi.array().items(objectId).optional(),
  experienceLevel: Joi.string().valid('entry', 'intermediate', 'expert').optional(),
  languages: Joi.array().items(Joi.string().trim().min(2).max(10)).optional(),
  certificationsRequired: Joi.boolean().default(false),
  vehicleRequired: Joi.boolean().default(false),
}).required();

const createJobSchema = Joi.object({
  title: Joi.string().trim().min(5).max(120).required(),
  description: Joi.string().trim().min(20).max(5000).required(),
  type: Joi.string().valid('physical', 'digital', 'errand').required(),
  location: jobLocationSchema,
  budget: jobBudgetSchema,
  schedule: jobScheduleSchema,
  requirements: jobRequirementsSchema,
  metadata: Joi.object({
    tags: Joi.array().items(Joi.string().trim().max(30)).max(10).optional(),
    isUrgent: Joi.boolean().default(false),
  }).optional(),
});

const updateJobSchema = Joi.object({
  title: Joi.string().trim().min(5).max(120).optional(),
  description: Joi.string().trim().min(20).max(5000).optional(),
  location: jobLocationSchema.optional(),
  budget: jobBudgetSchema.optional(),
  schedule: jobScheduleSchema.optional(),
  requirements: jobRequirementsSchema.optional(),
  metadata: Joi.object({
    tags: Joi.array().items(Joi.string().trim().max(30)).max(10).optional(),
    isUrgent: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
  }).optional(),
}).min(1);

const browseJobsQuerySchema = Joi.object({
  type: Joi.string().valid('physical', 'digital', 'errand').optional(),
  category: objectId.optional(),
  skillItem: objectId.optional(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled', 'disputed').default('open'),
  minBudget: Joi.number().min(0).optional(),
  maxBudget: Joi.number().min(0).optional(),
  budgetType: Joi.string().valid('fixed', 'hourly').optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  radiusKm: Joi.number().min(1).max(500).default(50),
  city: Joi.string().trim().max(100).optional(),
  experienceLevel: Joi.string().valid('entry', 'intermediate', 'expert').optional(),
  isUrgent: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  sortBy: Joi.string().valid('createdAt', 'budget', 'distance', 'urgency').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  skip: Joi.number().integer().min(0).default(0),
  search: Joi.string().trim().max(100).optional(),
});

const jobStatusTransitionSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled', 'disputed').required(),
});

const clientJobQuerySchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled', 'disputed').optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  skip: Joi.number().integer().min(0).default(0),
});

const providerJobQuerySchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled', 'disputed').optional(),
  type: Joi.string().valid('physical', 'digital', 'errand').optional(),
  sortBy: Joi.string().valid('createdAt', 'budget', 'distance').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  skip: Joi.number().integer().min(0).default(0),
});

export const jobValidators = {
  createJob: createJobSchema,
  updateJob: updateJobSchema,
  browseJobsQuery: browseJobsQuerySchema,
  jobStatusTransition: jobStatusTransitionSchema,
  clientJobQuery: clientJobQuerySchema,
  providerJobQuery: providerJobQuerySchema,
};