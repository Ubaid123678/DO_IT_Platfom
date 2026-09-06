import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

const evidenceSchema = Joi.object({
  type: Joi.string().valid('document', 'image', 'video', 'text', 'link').required(),
  url: Joi.string().uri().when('type', { is: Joi.string().valid('document', 'image', 'video', 'link'), then: Joi.required(), otherwise: Joi.optional() }),
  content: Joi.string().max(5000).when('type', { is: 'text', then: Joi.required(), otherwise: Joi.optional() }),
  description: Joi.string().max(500).optional(),
});

export const disputeValidators = {
  createDispute: Joi.object({
    jobId: objectId,
    proposalId: objectId,
    reason: Joi.string().trim().min(5).max(200).required(),
    description: Joi.string().trim().max(5000).optional(),
  }),

  submitEvidence: Joi.object({
    evidence: Joi.array().items(evidenceSchema).min(1).required(),
  }),

  addEvidence: Joi.object({
    evidence: evidenceSchema.required(),
  }),

  resolveDispute: Joi.object({
    verdict: Joi.string().valid('client_wins', 'provider_wins', 'split').required(),
    resolution: Joi.string().valid('escrow_to_client', 'escrow_to_provider', 'escrow_split', 'escrow_refunded').required(),
    reasoning: Joi.string().max(2000).optional(),
    splitPercentage: Joi.number().min(0).max(100).when('verdict', { is: 'split', then: Joi.required(), otherwise: Joi.optional() }),
    adminNotes: Joi.string().max(2000).optional(),
  }),

  getDisputes: Joi.object({
    status: Joi.string().valid('open', 'evidence_submitted', 'under_review', 'resolved', 'closed').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    sortBy: Joi.string().valid('createdAt', 'openedAt', 'evidenceDeadline').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  getDisputeById: Joi.object({
    disputeId: objectId,
  }),

  updateDisputeStatus: Joi.object({
    status: Joi.string().valid('open', 'evidence_submitted', 'under_review', 'resolved', 'closed').required(),
    adminNotes: Joi.string().max(2000).optional(),
  }),

  extendEvidenceDeadline: Joi.object({
    days: Joi.number().integer().min(1).max(30).required(),
  }),
};