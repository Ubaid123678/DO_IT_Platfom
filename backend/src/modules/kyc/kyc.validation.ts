import Joi from 'joi';

const documentType = Joi.string().valid('pass', 'driving_license', 'passport').required();
const countryCode = Joi.string().trim().uppercase().min(2).max(3).required();
const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

const base64Image = Joi.string()
  .min(50)
  .pattern(/^data:image\/[a-z]+;base64,/)
  .required()
  .messages({
    'string.pattern.base': 'Image must be a valid base64 data URL (data:image/...;base64,...)',
    'any.required': 'Image is required',
  });

const kycImageType = Joi.string()
  .valid('document_front', 'document_back', 'face_clear', 'move_left', 'move_right', 'smile')
  .required();

export const kycValidators = {
  uploadImage: Joi.object({
    imageType: kycImageType,
    data: base64Image,
  }),
  submit: Joi.object({
    documentType,
    documentImageIds: Joi.object({
      front: objectId,
      back: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional().allow(''),
    }).required(),
    livenessImageIds: Joi.object({
      face_clear: objectId,
      move_left: objectId,
      move_right: objectId,
      smile: objectId,
    }).required(),
    countryCode,
    notes: Joi.string().trim().max(500).optional().allow(''),
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
