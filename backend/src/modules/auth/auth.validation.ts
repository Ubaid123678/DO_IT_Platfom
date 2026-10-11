import Joi from 'joi';

const email = Joi.string().trim().email().required();
const phone = Joi.string().trim().min(8).max(20).required();
const password = Joi.string().min(8).max(128).required();
const otp = Joi.string().trim().length(6).required();

export const authValidators = {
  register: Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required(),
    email,
    phone,
    password,
    role: Joi.string().valid('client', 'provider').optional(),
    countryCode: Joi.string().trim().length(2).uppercase().required(),
  }),
  login: Joi.object({
    email,
    password,
  }),
  verifyEmail: Joi.object({
    email,
    otp,
  }),
  resendEmailOtp: Joi.object({
    email,
  }),
  verifyPhone: Joi.object({
    phone,
    otp,
  }),
  resendPhoneOtp: Joi.object({
    phone,
  }),
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  logout: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  forgotPassword: Joi.object({
    email,
  }),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: password,
  }),
  updateMe: Joi.object({
    fullName: Joi.string().trim().min(2).max(120),
    role: Joi.string().valid('client', 'provider'),
    clientProfile: Joi.object({
      bio: Joi.string().allow('').max(500),
      city: Joi.string().allow('').max(120),
      languages: Joi.array().items(Joi.object({
        code: Joi.string().trim().min(2).max(10).required(),
        level: Joi.string().valid('basic', 'intermediate', 'fluent').required(),
      })),
      notificationEmail: Joi.boolean(),
      notificationPush: Joi.boolean(),
      notificationSms: Joi.boolean(),
      profileVisibility: Joi.string().valid('public', 'private'),
    }),
  }).min(1),
};
