import Joi from 'joi';

const fileName = Joi.string().trim().min(1).max(255).required();

const documentType = Joi.string()
  .valid('id_card', 'passport', 'driver_license', 'business_license', 'proof_of_address', 'other')
  .required();

const storageProvider = Joi.string().valid('mock', 's3', 'r2').optional();

const countryCode = Joi.string().trim().uppercase().min(2).max(3).required();

export const kycValidators = {
  uploadUrl: Joi.object({
    documentType,
    fileName,
    mimeType: Joi.string().trim().min(3).max(120).required(),
    fileSizeBytes: Joi.number().integer().positive().max(25 * 1024 * 1024).required(),
    storageProvider,
    countryCode,
  }),
  submit: Joi.object({
    documentType,
    fileName,
    mimeType: Joi.string().trim().min(3).max(120).required(),
    fileSizeBytes: Joi.number().integer().positive().max(25 * 1024 * 1024).required(),
    storageKey: Joi.string().trim().min(5).max(512).required(),
    storageUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).required(),
    storageProvider,
    countryCode,
    notes: Joi.string().trim().max(500).optional(),
  }),
  review: Joi.object({
    reason: Joi.string().trim().min(3).max(500).when('action', {
      is: 'reject',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    action: Joi.string().valid('approve', 'reject').required(),
  }),
  statusQuery: Joi.object({
    status: Joi.string().valid('missing', 'pending', 'approved', 'rejected').optional(),
  }),
};

export const providerRestrictionValidator = Joi.object({
  userId: Joi.string().trim().min(1).required(),
});
