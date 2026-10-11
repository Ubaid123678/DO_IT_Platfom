import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

const createProposalSchema = Joi.object({
  jobId: objectId,
  bidAmount: Joi.number().min(0).required(),
  bidType: Joi.string().valid('fixed', 'hourly').required(),
  hourlyRate: Joi.number().min(0).when('bidType', {
    is: 'hourly',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  estimatedHours: Joi.number().min(0).when('bidType', {
    is: 'hourly',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  coverLetter: Joi.string().trim().min(20).max(2000).required(),
  estimatedTimeline: Joi.string().trim().min(1).max(100).required(),
});

const updateProposalSchema = Joi.object({
  bidAmount: Joi.number().min(0).optional(),
  bidType: Joi.string().valid('fixed', 'hourly').optional(),
  hourlyRate: Joi.number().min(0).optional(),
  estimatedHours: Joi.number().min(0).optional(),
  coverLetter: Joi.string().trim().min(20).max(2000).optional(),
  estimatedTimeline: Joi.string().trim().min(1).max(100).optional(),
}).min(1);

const proposalQuerySchema = Joi.object({
  status: Joi.string().valid('submitted', 'withdrawn', 'accepted', 'rejected', 'expired').optional(),
  jobId: objectId.optional(),
  sortBy: Joi.string().valid('createdAt', 'bidAmount', 'submittedAt').default('submittedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  skip: Joi.number().integer().min(0).default(0),
});

const clientProposalActionSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject').required(),
  message: Joi.string().trim().max(1000).optional(),
});

export const proposalValidators = {
  createProposal: createProposalSchema,
  updateProposal: updateProposalSchema,
  proposalQuery: proposalQuerySchema,
  clientProposalAction: clientProposalActionSchema,
};