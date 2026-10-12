import Joi from 'joi';

const userRole = Joi.string().valid('pending', 'client', 'provider', 'admin');

export const adminValidators = {
  listUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().min(2).max(100).optional(),
    role: userRole.optional(),
    email_verified: Joi.boolean().optional(),
    phone_verified: Joi.boolean().optional(),
    kyc_status: Joi.string()
      .valid('approved', 'pending', 'rejected', 'missing')
      .optional(),
    overall_status: Joi.string()
      .valid(
        'incomplete',
        'pending',
        'partially_verified',
        'verified',
        'rejected',
      )
      .optional(),
    track: Joi.string().valid('physical', 'digital', 'errand').optional(),
    sort_by: Joi.string()
      .valid('createdAt', 'updatedAt', 'fullName', 'email')
      .default('createdAt'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
  }).unknown(false),
  userId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  updateUser: Joi.object({
    role: userRole.optional(),
    isActive: Joi.boolean().optional(),
    reason: Joi.string().trim().max(500).optional().allow(''),
  })
    .or('role', 'isActive')
    .unknown(false),
  deleteUser: Joi.object({
    reason: Joi.string().trim().max(500).optional().allow(''),
  }).unknown(false),
};
