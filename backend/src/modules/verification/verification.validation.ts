import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

const evidenceType = Joi.string().valid(
  'certificate', 'prior_work', 'portfolio', 'oauth',
).required();

const verificationStatus = Joi.string().valid(
  'draft', 'pending_review', 'scheduled', 'auto_approved', 'approved', 'rejected', 'expired',
);

const jobType = Joi.string().valid('physical', 'digital').required();

export const verificationValidators = {
  selectCategories: Joi.object({
    categories: Joi.array().min(1).max(3).items(objectId).required(),
    skill_items: Joi.array().min(1).items(objectId).required(),
  }),

  submitEvidence: Joi.object({
    category_id: objectId,
    skill_item_id: objectId,
    evidence_type: evidenceType,
    evidence_payload: Joi.object().required(),
  }),

  resubmitEvidence: Joi.object({
    category_id: objectId,
    skill_item_id: objectId,
    evidence_type: evidenceType,
    evidence_payload: Joi.object().required(),
  }),

  uploadResume: Joi.object({
    headline: Joi.string().trim().max(200).optional().allow(''),
    bio: Joi.string().trim().max(500).optional().allow(''),
    years_experience: Joi.number().integer().min(0).max(100).optional(),
    languages: Joi.array().items(Joi.string().trim()).optional(),
    work_history: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().required(),
        company: Joi.string().trim().required(),
        start_date: Joi.string().trim().required(),
        end_date: Joi.string().trim().optional().allow(''),
        description: Joi.string().trim().optional().allow(''),
      }),
    ).optional(),
    education: Joi.array().items(
      Joi.object({
        institution: Joi.string().trim().required(),
        degree: Joi.string().trim().required(),
        field: Joi.string().trim().optional().allow(''),
        start_year: Joi.number().integer().optional(),
        end_year: Joi.number().integer().optional(),
      }),
    ).optional(),
  }),

  adminReview: Joi.object({
    action: Joi.string().valid('approve', 'reject', 'request_info').required(),
    reason: Joi.string().trim().min(3).max(1000).when('action', {
      is: Joi.string().valid('reject', 'request_info'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  adminListQuery: Joi.object({
    status: verificationStatus.optional(),
    category_id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    sla_overdue: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).max(200).default(50),
    skip: Joi.number().integer().min(0).default(0),
  }),

  skillTestStart: Joi.object({
    skill_item_id: objectId,
  }),

  skillTestSubmit: Joi.object({
    answers: Joi.array().items(
      Joi.object({
        question_id: Joi.string().required(),
        selected_option: Joi.number().integer().min(0).required(),
      }),
    ).min(1).required(),
  }),

  queryCategories: Joi.object({
    job_type: jobType.optional(),
    active_only: Joi.boolean().optional(),
  }),

  connectOAuth: Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    platform: Joi.string().valid('github', 'upwork', 'linkedin').default('github'),
    skill_keywords: Joi.array().items(Joi.string().trim().max(50)).optional(),
  }),

  verifyPortfolio: Joi.object({
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  }),

  submitBatchEvidence: Joi.object({
    evidence_batch: Joi.array().min(1).items(
      Joi.object({
        category_id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
        skill_item_id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
        evidence_type: Joi.string().valid('certificate', 'prior_work', 'portfolio', 'oauth', 'digital', 'physical').required(),
        evidence_payload: Joi.object().required(),
      }),
    ).required(),
  }),

  updateProfile: Joi.object({
    headline: Joi.string().trim().max(200).optional(),
    bio: Joi.string().trim().max(500).optional(),
    years_experience: Joi.number().integer().min(0).max(100).optional(),
    languages: Joi.array().items(Joi.string().trim()).optional(),
    work_history: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().required(),
        company: Joi.string().trim().required(),
        start_date: Joi.string().trim().required(),
        end_date: Joi.string().trim().optional().allow(''),
        description: Joi.string().trim().optional().allow(''),
      }),
    ).optional(),
    education: Joi.array().items(
      Joi.object({
        institution: Joi.string().trim().required(),
        degree: Joi.string().trim().required(),
        field: Joi.string().trim().optional().allow(''),
        start_year: Joi.number().integer().optional(),
        end_year: Joi.number().integer().optional(),
      }),
    ).optional(),
    public_profile: Joi.boolean().optional(),
  }),
};
