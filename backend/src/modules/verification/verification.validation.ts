import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

// Bundle evidence types store one record per category with no skill item, so the
// skill_item_id is only mandatory for per-skill evidence types.
const skillItemIdForEvidence = Joi.string()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .when('evidence_type', {
    is: Joi.string().valid('digital', 'physical', 'errand'),
    then: Joi.optional(),
    otherwise: Joi.required(),
  });

const evidenceType = Joi.string().valid(
  'certificate', 'prior_work', 'portfolio', 'oauth', 'digital', 'physical', 'errand',
).required();

const verificationStatus = Joi.string().valid(
  'draft', 'pending_review', 'scheduled', 'auto_approved', 'approved', 'rejected', 'expired',
);

const jobType = Joi.string().valid('physical', 'digital', 'errand').required();

const trustBundlePayload = Joi.object({
  background_check: Joi.array()
    .min(1)
    .items(
      Joi.object({
        uri: Joi.string().required(),
        name: Joi.string().trim().allow('').optional(),
        issuing_authority: Joi.string().trim().allow('').optional(),
        record_number: Joi.string().trim().allow('').optional(),
        issued_on: Joi.string().trim().allow('').optional(),
      }),
    )
    .required(),
  vehicle_docs: Joi.array()
    .items(
      Joi.object({
        uri: Joi.string().required(),
        name: Joi.string().trim().allow('').optional(),
        type: Joi.string().trim().allow('').optional(),
      }),
    )
    .optional(),
  service_area: Joi.object({
    city: Joi.string().trim().required(),
    radius_km: Joi.number().min(0).max(1000).optional(),
    experience_years: Joi.number().min(0).max(100).optional(),
  }).required(),
  references: Joi.array()
    .max(2)
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        contact: Joi.string().trim().allow('').optional(),
      }),
    )
    .optional(),
  skill_item_ids: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).optional(),
});

// ---------------------------------------------------------------------------
// Provider profile completion (per track)
// ---------------------------------------------------------------------------

const languageLevel = Joi.string().valid('basic', 'intermediate', 'fluent');

const languageItemSchema = Joi.object({
  code: Joi.string().trim().min(2).max(10).required(),
  level: languageLevel.required(),
});

const availabilitySchema = Joi.object({
  days: Joi.array().items(Joi.string().trim().min(1).max(30)).min(1).required(),
  shifts: Joi.array().items(Joi.string().trim().min(1).max(30)).optional(),
  hours_per_week: Joi.number().integer().min(1).max(168).optional(),
});

const uriField = Joi.string()
  .custom((value: string, helpers) => {
    if (/^https?:\/\//i.test(value)) return value;
    if (/^\/uploads\//.test(value)) return value;
    if (/^data:/.test(value)) return value;
    return helpers.error('string.uriCustomScheme');
  })
  .optional()
  .allow('');

const providerProfileSchema = Joi.object({
  avatar_url: uriField,
  headline: Joi.string().trim().max(120).optional().allow(''),
  bio: Joi.string().trim().max(500).optional().allow(''),
  languages: Joi.array().items(languageItemSchema).optional(),
  city: Joi.string().trim().max(100).optional().allow(''),
  availability: availabilitySchema.optional(),
  public_profile: Joi.boolean().optional(),
});

const physicalTrackDataSchema = Joi.object({
  years_experience: Joi.number().integer().min(0).max(100).optional(),
  service_radius_km: Joi.number().integer().min(1).max(500).optional(),
  tools_equipment: Joi.array().items(Joi.string().trim().max(60)).max(20).optional(),
  hourly_rate: Joi.number().min(0).max(100000).optional(),
  on_site_availability: availabilitySchema.optional(),
  can_travel: Joi.boolean().optional(),
  team_size: Joi.string().valid('solo', 'with_helper', 'with_team').optional(),
  insurance: Joi.object({ covered: Joi.boolean().required(), doc_uri: uriField }).optional(),
  has_transport: Joi.object({
    yes: Joi.boolean().required(),
    mode: Joi.string().valid('bicycle', 'motorbike', 'car').optional(),
  }).optional(),
});

const digitalTrackDataSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().max(60)).max(10).optional(),
  tech_stack: Joi.array().items(Joi.string().trim().max(60)).max(20).optional(),
  hourly_rate: Joi.number().min(0).max(100000).optional(),
  project_rate: Joi.number().min(0).max(10000000).optional(),
  timezone: Joi.string().trim().max(60).optional().allow(''),
  english_proficiency: languageLevel.optional(),
  work_history: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().max(120).required(),
        company: Joi.string().trim().max(120).required(),
        start_date: Joi.string().trim().max(20).required(),
        end_date: Joi.string().trim().max(20).optional().allow(''),
        description: Joi.string().trim().max(1000).optional().allow(''),
      }),
    )
    .optional(),
  education: Joi.array()
    .items(
      Joi.object({
        institution: Joi.string().trim().max(160).required(),
        degree: Joi.string().trim().max(160).required(),
        field: Joi.string().trim().max(160).optional().allow(''),
        start_year: Joi.number().integer().min(1900).max(2100).optional(),
        end_year: Joi.number().integer().min(1900).max(2100).optional(),
      }),
    )
    .optional(),
  resume_file_url: uriField,
});

const errandTrackDataSchema = Joi.object({
  service_area: Joi.object({
    city: Joi.string().trim().max(100).required(),
    radius_km: Joi.number().min(1).max(1000).required(),
  }).optional(),
  transport_mode: Joi.string().valid('on_foot', 'bicycle', 'motorbike', 'car', 'van').optional(),
  base_fee: Joi.number().min(0).max(1000000).optional(),
  per_km_fee: Joi.number().min(0).max(100000).optional(),
  working_hours: availabilitySchema.optional(),
  same_day_express: Joi.boolean().optional(),
  delivery_capabilities: Joi.array().items(Joi.string().trim().max(60)).optional(),
  max_payload_kg: Joi.number().min(0).max(1000).optional(),
  max_package_size: Joi.string().trim().max(60).optional().allow(''),
  goods_insurance: Joi.object({ covered: Joi.boolean().required(), doc_uri: uriField }).optional(),
});

export const verificationValidators = {
  selectCategories: Joi.object({
    categories: Joi.array().min(1).max(3).items(objectId).required(),
    skill_items: Joi.array().min(1).items(objectId).required(),
  }),

  submitEvidence: Joi.object({
    category_id: objectId,
    skill_item_id: skillItemIdForEvidence,
    evidence_type: evidenceType,
    evidence_payload: Joi.alternatives().conditional('evidence_type', {
      is: 'errand',
      then: trustBundlePayload,
      otherwise: Joi.object().required(),
    }),
  }),

  resubmitEvidence: Joi.object({
    category_id: objectId,
    skill_item_id: skillItemIdForEvidence,
    evidence_type: evidenceType,
    evidence_payload: Joi.alternatives().conditional('evidence_type', {
      is: 'errand',
      then: trustBundlePayload,
      otherwise: Joi.object().required(),
    }),
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
        evidence_type: Joi.string().valid('certificate', 'prior_work', 'portfolio', 'oauth', 'digital', 'physical', 'errand').required(),
        evidence_payload: Joi.alternatives().conditional('evidence_type', {
          is: 'errand',
          then: trustBundlePayload,
          otherwise: Joi.object().required(),
        }),
      }),
    ).required(),
  }),

  updateProfile: Joi.object({
    provider_profile: providerProfileSchema,
    track_data: Joi.object({
      physical: physicalTrackDataSchema,
      digital: digitalTrackDataSchema,
      errand: errandTrackDataSchema,
    }).optional(),
  }).or('provider_profile', 'track_data'),
};
