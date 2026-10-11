import Joi from 'joi';

export type FraudValidators = {
  createFraudRule: Joi.ObjectSchema<any>;
  updateFraudRule: Joi.ObjectSchema<any>;
  getFraudRules: Joi.ObjectSchema<any>;
  getFraudRuleById: Joi.ObjectSchema<any>;
  deleteFraudRule: Joi.ObjectSchema<any>;
  getFraudFlags: Joi.ObjectSchema<any>;
  getFraudFlagById: Joi.ObjectSchema<any>;
  reviewFraudFlag: Joi.ObjectSchema<any>;
  submitEvidence: Joi.ObjectSchema<any>;
  createFraudCase: Joi.ObjectSchema<any>;
  getFraudCases: Joi.ObjectSchema<any>;
  updateFraudCase: Joi.ObjectSchema<any>;
  resolveFraudCase: Joi.ObjectSchema<any>;
  applyFraudAction: Joi.ObjectSchema<any>;
  blockIp: Joi.ObjectSchema<any>;
  blockDevice: Joi.ObjectSchema<any>;
  lockAccount: Joi.ObjectSchema<any>;
  require2fa: Joi.ObjectSchema<any>;
  notifyUser: Joi.ObjectSchema<any>;
  notifyAdmin: Joi.ObjectSchema<any>;
  getFraudStats: Joi.ObjectSchema<any>;
  bulkUpdateFlags: Joi.ObjectSchema<any>;
  exportFraudFlags: Joi.ObjectSchema<any>;
};

export const fraudValidators: FraudValidators = {
  createFraudRule: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).max(500).required(),
    type: Joi.string().valid(
      'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
      'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
      'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
    ).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    enabled: Joi.boolean().default(true),
    conditions: Joi.object().default({}),
    actions: Joi.array().items(Joi.string().valid(
      'block', 'challenge', 'monitor', 'alert', 'require_2fa', 'lock_account',
      'notify_user', 'notify_admin', 'require_kyc', 'block_ip', 'block_device'
    )).min(1).required(),
    scoreThreshold: Joi.number().integer().min(0).max(100).required(),
    windowMs: Joi.number().integer().min(1000).required(),
    maxTriggers: Joi.number().integer().min(1).max(1000).default(10),
    cooldownMs: Joi.number().integer().min(1000).default(300000),
    metadata: Joi.object().default({}),
  }),

  updateFraudRule: Joi.object({
    name: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().min(10).max(500).optional(),
    type: Joi.string().valid(
      'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
      'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
      'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
    ).optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    enabled: Joi.boolean().optional(),
    conditions: Joi.object().optional(),
    actions: Joi.array().items(Joi.string().valid(
      'block', 'challenge', 'monitor', 'alert', 'require_2fa', 'lock_account',
      'notify_user', 'notify_admin', 'require_kyc', 'block_ip', 'block_device'
    )).optional(),
    scoreThreshold: Joi.number().integer().min(0).max(100).optional(),
    windowMs: Joi.number().integer().min(1000).optional(),
    maxTriggers: Joi.number().integer().min(1).max(1000).optional(),
    cooldownMs: Joi.number().integer().min(1000).optional(),
    metadata: Joi.object().optional(),
  }).min(1),

  getFraudRules: Joi.object({
    type: Joi.string().valid(
      'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
      'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
      'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
    ).optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    enabled: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
  }),

  getFraudRuleById: Joi.object({
    ruleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  deleteFraudRule: Joi.object({
    ruleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  // Fraud Flags
  getFraudFlags: Joi.object({
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    status: Joi.string().valid('pending', 'under_review', 'confirmed_fraud', 'false_positive', 'resolved', 'dismissed').optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    ruleType: Joi.string().valid(
      'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
      'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
      'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
    ).optional(),
    ruleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('triggeredAt', 'severity', 'score').default('triggeredAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  getFraudFlagById: Joi.object({
    flagId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  reviewFraudFlag: Joi.object({
    flagId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    action: Joi.string().valid('confirm_fraud', 'mark_false_positive', 'dismiss', 'escalate').required(),
    reviewNotes: Joi.string().max(2000).optional(),
    resolution: Joi.string().valid(
      'fraud_confirmed', 'false_positive', 'insufficient_evidence', 'user_educated', 'account_closed'
    ).when('action', { is: 'resolve', then: Joi.required(), otherwise: Joi.optional() }),
  }),

  submitEvidence: Joi.object({
    flagId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    evidence: Joi.object().required(),
  }),

  // Admin bulk actions
  bulkUpdateFlags: Joi.object({
    flagIds: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).min(1).max(100).required(),
    action: Joi.string().valid('confirm_fraud', 'mark_false_positive', 'dismiss', 'escalate').required(),
    reviewNotes: Joi.string().max(2000).optional(),
  }),

  // Export
  exportFraudFlags: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    format: Joi.string().valid('json', 'csv').default('csv'),
    fields: Joi.array().items(Joi.string()).optional(),
  }),

  // Fraud Cases
  createFraudCase: Joi.object({
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    flagIds: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).min(1).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    summary: Joi.string().trim().min(10).max(500).required(),
  }),

  getFraudCases: Joi.object({
    status: Joi.string().valid('open', 'investigating', 'resolved', 'closed').optional(),
    assignedTo: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'priority').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  updateFraudCase: Joi.object({
    caseId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    status: Joi.string().valid('open', 'investigating', 'resolved', 'closed').optional(),
    assignedTo: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    investigatorNotes: Joi.string().max(5000).optional(),
    resolution: Joi.string().valid(
      'fraud_confirmed', 'false_positive', 'insufficient_evidence', 'user_educated', 'account_closed'
    ).optional(),
  }).min(1),

  resolveFraudCase: Joi.object({
    caseId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    resolution: Joi.string().valid(
      'fraud_confirmed', 'false_positive', 'insufficient_evidence', 'user_educated', 'account_closed'
    ).required(),
    resolutionNotes: Joi.string().max(2000).optional(),
  }),

  // Admin actions
  applyFraudAction: Joi.object({
    flagId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    action: Joi.string().valid(
      'block', 'challenge', 'monitor', 'alert', 'require_2fa', 'lock_account',
      'notify_user', 'notify_admin', 'require_kyc', 'block_ip', 'block_device'
    ).required(),
    reason: Joi.string().max(500).optional(),
  }),

  blockIp: Joi.object({
    ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
    reason: Joi.string().max(500).required(),
    duration: Joi.number().integer().min(300).max(31536000).default(86400), // 1 day default
  }),

  blockDevice: Joi.object({
    deviceId: Joi.string().required(),
    reason: Joi.string().max(500).required(),
    duration: Joi.number().integer().min(300).max(31536000).default(86400),
  }),

  lockAccount: Joi.object({
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    reason: Joi.string().max(500).required(),
    duration: Joi.number().integer().min(300).max(2592000).optional(), // 5 min to 30 days
  }),

  require2fa: Joi.object({
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    reason: Joi.string().max(500).required(),
  }),

  notifyUser: Joi.object({
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    title: Joi.string().max(200).required(),
    message: Joi.string().max(1000).required(),
    channels: Joi.array().items(Joi.string().valid('in_app', 'push', 'email', 'sms')).default(['in_app']),
  }),

  notifyAdmin: Joi.object({
    title: Joi.string().max(200).required(),
    message: Joi.string().max(1000).required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('high'),
    recipients: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).optional(),
  }),

  // Statistics
  getFraudStats: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'ruleType', 'severity', 'status').default('day'),
  }),

  };