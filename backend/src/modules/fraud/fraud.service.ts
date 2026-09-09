import { FraudRuleModel, type IFraudRule } from './fraud.model.js';
import { FraudFlagModel, type IFraudFlag } from './fraud.model.js';
import { FraudCaseModel, type IFraudCase } from './fraud.model.js';
import Queue from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const fraudQueue = new Queue('fraud-detection', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

const fraudDetectionQueue = new Queue('fraud-analysis', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

const serializeRule = (rule: IFraudRule) => {
  const obj = rule.toJSON?.() ?? rule;
  return obj;
};

const serializeFlag = (flag: IFraudFlag) => {
  const obj = flag.toJSON?.() ?? flag;
  return obj;
};

const serializeCase = (caseData: IFraudCase) => {
  const obj = caseData.toJSON?.() ?? caseData;
  return obj;
};

interface FraudCheckContext {
  userId: string;
  ip?: string;
  deviceId?: string;
  userAgent?: string;
  location?: { country: string; city: string; lat: number; lng: number };
  deviceFingerprint?: string;
  sessionId?: string;
  requestId?: string;
  action: string;
  metadata?: Record<string, any>;
}

interface FraudCheckResult {
  flagged: boolean;
  flags: Array<{
    ruleId: string;
    ruleName: string;
    ruleType: string;
    severity: string;
    score: number;
    flagId?: string;
  }>;
  actions: Array<{
    action: string;
    params: Record<string, any>;
  }>;
  score: number;
}

export const fraudService = {
  // Fraud Rules
  createFraudRule: async (input: {
    name: string;
    description: string;
    type: string;
    severity: string;
    enabled: boolean;
    conditions: Record<string, any>;
    actions: string[];
    scoreThreshold: number;
    windowMs: number;
    maxTriggers: number;
    cooldownMs: number;
    metadata?: Record<string, any>;
  }) => {
    const rule = await FraudRuleModel.create({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { ...serializeRule(rule) };
  },

  getFraudRules: async (query: {
    type?: string;
    severity?: string;
    enabled?: boolean;
    limit?: number;
    skip?: number;
  }) => {
    const filter: Record<string, any> = {};
    if (query.type) filter.type = query.type;
    if (query.severity) filter.severity = query.severity;
    if (query.enabled !== undefined) filter.enabled = query.enabled;

    const [rules, total] = await Promise.all([
      FraudRuleModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(query.skip || 0)
        .limit(query.limit || 20)
        .lean(),
      FraudRuleModel.countDocuments(filter),
    ]);

    return {
      rules: rules.map(serializeRule),
      total,
      limit: query.limit || 20,
      skip: query.skip || 0,
    };
  },

  getFraudRuleById: async (ruleId: string) => {
    const rule = await FraudRuleModel.findById(ruleId).lean();
    if (!rule) throw new Error('Fraud rule not found');
    return serializeRule(rule);
  },

  updateFraudRule: async (ruleId: string, updates: Partial<any>) => {
    const rule = await FraudRuleModel.findByIdAndUpdate(ruleId, updates, { new: true }).lean();
    if (!rule) throw new Error('Fraud rule not found');
    return serializeRule(rule);
  },

  deleteFraudRule: async (ruleId: string) => {
    await FraudRuleModel.findByIdAndDelete(ruleId);
    return { success: true };
  },

  // Fraud Detection Engine
  checkFraud: async (context: FraudCheckContext): Promise<FraudCheckResult> => {
    const activeRules = await FraudRuleModel.find({ enabled: true }).lean();
    const flags = [];
    const actions: Array<{ action: string; params: Record<string, any> }> = [];
    let totalScore = 0;

    for (const rule of activeRules) {
      const score = await evaluateRule(rule, context);
      if (score >= rule.scoreThreshold) {
        flags.push({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          ruleType: rule.type,
          severity: rule.severity,
          score,
        });

        // Add actions from rule
        for (const action of rule.actions) {
          actions.push({ action, params: {} });
        }

        totalScore += score;
      }
    }

    // Determine actions based on total score
    if (totalScore >= 90) {
      actions.push({ action: 'block', params: { reason: 'High fraud score' } });
    } else if (totalScore >= 70) {
      actions.push({ action: 'challenge', params: { type: 'captcha', reason: 'Suspicious activity detected' } });
    } else if (totalScore >= 50) {
      actions.push({ action: 'monitor', params: { reason: 'Elevated risk score' } });
    } else if (totalScore >= 30) {
      actions.push({ action: 'monitor', params: { reason: 'Elevated risk score' } });
    }

    return {
      flagged: flags.length > 0,
      flags,
      actions,
      score: totalScore,
    };
  },

  // Fraud Flag Management
  createFraudFlag: async (input: {
    userId: string;
    ruleId: string;
    ruleName: string;
    ruleType: string;
    severity: string;
    score: number;
    evidence: Record<string, any>;
    context: any;
  }) => {
    const flag = await FraudFlagModel.create({
      ...input,
      status: 'pending',
      triggeredAt: new Date(),
    });
    return serializeFlag(flag);
  },

  getFraudFlagById: async (flagId: string, userId: string, userRole: string) => {
    const flag = await FraudFlagModel.findById(flagId).lean();
    if (!flag) throw new Error('Fraud flag not found');

    // Check authorization
    if (userRole !== 'admin' && flag.userId.toString() !== userId) {
      throw new Error('Not authorized to view this flag');
    }

    return serializeFlag(flag);
  },

  submitEvidence: async (flagId: string, userId: string, evidence: Record<string, any>) => {
    const flag = await FraudFlagModel.findById(flagId);
    if (!flag) throw new Error('Fraud flag not found');

    // Check authorization
    if (flag.userId.toString() !== userId) {
      throw new Error('Not authorized to submit evidence for this flag');
    }

    flag.evidence = { ...flag.evidence, ...evidence };
    await flag.save();

    return serializeFlag(flag);
  },

  getFraudFlags: async (query: {
    userId?: string;
    status?: string;
    severity?: string;
    ruleType?: string;
    ruleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const filter: Record<string, any> = {};

    if (query.userId) filter.userId = query.userId;
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.ruleType) filter.ruleType = query.ruleType;
    if (query.ruleId) filter.ruleId = query.ruleId;
    if (query.startDate || query.endDate) {
      filter.triggeredAt = {};
      if (query.startDate) filter.triggeredAt.$gte = query.startDate;
      if (query.endDate) filter.triggeredAt.$lte = query.endDate;
    }
    if (query.ruleType) filter.ruleType = query.ruleType;

    const sortField = query.sortBy || 'triggeredAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [flags, total] = await Promise.all([
      FraudFlagModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(query.skip || 0)
        .limit(query.limit || 20)
        .populate('ruleId', 'name type severity')
        .lean(),
      FraudFlagModel.countDocuments(filter),
    ]);

    return {
      flags: flags.map(serializeFlag),
      total,
      limit: query.limit || 20,
      skip: query.skip || 0,
    };
  },

  reviewFraudFlag: async (flagId: string, adminId: string, input: {
    action: 'confirm_fraud' | 'mark_false_positive' | 'dismiss' | 'escalate';
    reviewNotes?: string;
    resolution?: 'fraud_confirmed' | 'false_positive' | 'insufficient_evidence' | 'user_educated' | 'account_closed';
  }) => {
    const flag = await FraudFlagModel.findById(flagId);
    if (!flag) throw new Error('Fraud flag not found');

    if (input.action === 'confirm_fraud') {
      flag.status = 'confirmed_fraud';
    } else if (input.action === 'mark_false_positive') {
      flag.status = 'false_positive';
    } else if (input.action === 'dismiss') {
      flag.status = 'dismissed';
    } else if (input.action === 'escalate') {
      flag.status = 'under_review';
    }

    flag.reviewedBy = adminId;
    flag.reviewedAt = new Date();
    flag.reviewNotes = input.reviewNotes;
    await flag.save();

    // If confirmed fraud, create case
    if (input.action === 'confirm_fraud') {
      await fraudService.createFraudCase({
        userId: flag.userId.toString(),
        flagIds: [flag._id.toString()],
        priority: 'high',
        summary: `Fraud confirmed by admin. ${input.reviewNotes || ''}`,
      });
    }

    return serializeFlag(flag);
  },

  bulkReviewFlags: async (flagIds: string[], action: string, _reviewNotes?: string) => {
    const flags = await FraudFlagModel.find({ _id: { $in: flagIds } });

    const results = [];
    for (const flag of flags) {
      if (action === 'confirm_fraud') {
        flag.status = 'confirmed_fraud';
      } else if (action === 'mark_false_positive') {
        flag.status = 'false_positive';
      } else if (action === 'dismiss') {
        flag.status = 'dismissed';
      } else if (action === 'escalate') {
        flag.status = 'under_review';
      }
      flag.reviewedBy = 'admin'; // Would be actual admin ID
      flag.reviewedAt = new Date();
      await flag.save();
      results.push(serializeFlag(flag));
    }

    return { updated: results.length };
  },

  // Fraud Cases
  createFraudCase: async (input: {
    userId: string;
    flagIds: string[];
    priority: string;
    summary: string;
  }) => {
    const caseData = await FraudCaseModel.create({
      userId: input.userId,
      flags: input.flagIds,
      priority: input.priority,
      summary: input.summary,
      status: 'open',
    });
    return serializeCase(caseData);
  },

  getFraudCases: async (query: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.priority) filter.priority = query.priority;

    const sort: Record<string, 1 | -1> = {};
    const order = query.sortOrder === 'asc' ? 1 : -1;
    sort[query.sortBy || 'createdAt'] = order;

    const [cases, total] = await Promise.all([
      FraudCaseModel.find(filter)
        .sort(sort)
        .skip(query.skip || 0)
        .limit(query.limit || 20)
        .populate('flags', 'ruleName severity score triggeredAt status')
        .populate('userId', 'fullName email')
        .lean(),
      FraudCaseModel.countDocuments(filter),
    ]);

    return {
      cases: cases.map(serializeCase),
      total,
      limit: query.limit || 20,
      skip: query.skip || 0,
    };
  },

  getFraudCaseById: async (caseId: string) => {
    const caseData = await FraudCaseModel.findById(caseId)
      .populate('flags', 'ruleName severity score triggeredAt status')
      .populate('userId', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .lean();
    if (!caseData) throw new Error('Fraud case not found');
    return serializeCase(caseData);
  },

  updateFraudCase: async (caseId: string, updates: Partial<any>) => {
    const caseData = await FraudCaseModel.findByIdAndUpdate(caseId, updates, { new: true }).lean();
    if (!caseData) throw new Error('Fraud case not found');
    return serializeCase(caseData);
  },

  resolveFraudCase: async (caseId: string, adminId: string, input: {
    resolution: 'fraud_confirmed' | 'false_positive' | 'insufficient_evidence' | 'user_educated' | 'account_closed';
    resolutionNotes?: string;
  }) => {
    const caseData = await FraudCaseModel.findByIdAndUpdate(
      caseId,
      {
        status: 'resolved',
        resolution: input.resolution,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
      { new: true }
    ).lean();

    if (!caseData) throw new Error('Fraud case not found');
    return serializeCase(caseData);
  },

  // Admin Actions
  applyFraudAction: async (flagId: string, action: string, _reason?: string) => {
    const flag = await FraudFlagModel.findById(flagId);
    if (!flag) throw new Error('Fraud flag not found');

    const actions: Record<string, () => Promise<any>> = {
      block: async () => { /* block logic */ },
      challenge: async () => { /* challenge logic */ },
      monitor: async () => { /* monitor logic */ },
      alert: async () => { /* alert logic */ },
      require_2fa: async () => { /* 2fa logic */ },
      lock_account: async () => { /* lock account logic */ },
      notify_user: async () => { /* notify user */ },
      notify_admin: async () => { /* notify admin */ },
      require_kyc: async () => { /* require kyc */ },
      block_ip: async () => { /* block ip */ },
      block_device: async () => { /* block device */ },
    };

    const actionFn = actions[action];
    if (!actionFn) throw new Error('Invalid action');

    await actionFn();
    flag.status = 'resolved';
    flag.actionsTaken.push(action);
    flag.resolvedAt = new Date();
    await flag.save();

    return { success: true, message: `Action ${action} applied` };
  },

  blockIp: async (ip: string, _reason: string, duration: number) => {
    // Implementation would block IP at infrastructure level
    return { success: true, message: `IP ${ip} blocked for ${duration}ms` };
  },

  blockDevice: async (deviceId: string, _reason: string, duration: number) => {
    return { success: true, message: `Device ${deviceId} blocked for ${duration}ms` };
  },

  lockAccount: async (_userId: string, _reason: string, _duration?: number) => {
    // Implementation would lock user account
    return { success: true, message: 'Account locked' };
  },

  require2fa: async (_userId: string, _reason: string) => {
    // Implementation would require 2FA for user
    return { success: true, message: '2FA required' };
  },

  notifyUser: async (_userId: string, _title: string, _message: string, _channels: string[]) => {
    // Implementation would send notification
    return { success: true, message: 'User notified' };
  },

  notifyAdmin: async (_title: string, _message: string, _priority: string, _recipients?: string[]) => {
    // Implementation would notify admin
    return { success: true, message: 'Admin notified' };
  },

  // Statistics
  getFraudStats: async (query: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    groupBy?: 'day' | 'week' | 'month' | 'ruleType' | 'severity' | 'status';
  }) => {
    const match: Record<string, any> = {};

    if (query.startDate || query.endDate) {
      match.triggeredAt = {};
      if (query.startDate) match.triggeredAt.$gte = query.startDate;
      if (query.endDate) match.triggeredAt.$lte = query.endDate;
    }
    if (query.userId) match.userId = query.userId;

    const groupBy = query.groupBy || 'day';
    let groupByField: any;

    switch (groupBy) {
      case 'day':
        groupByField = '$triggeredAt';
        break;
      case 'week':
        groupByField = { $week: '$triggeredAt' };
        break;
      case 'month':
        groupByField = { $month: '$triggeredAt' };
        break;
      case 'ruleType':
        groupByField = '$ruleType';
        break;
      case 'severity':
        groupByField = '$severity';
        break;
      case 'status':
        groupByField = '$status';
        break;
      default:
        groupByField = '$triggeredAt';
    }

    const stats = await FraudFlagModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupByField,
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  },

  bulkUpdateFlags: async (flagIds: string[], action: string, _reviewNotes?: string) => {
    return fraudService.bulkReviewFlags(flagIds, action);
  },

  exportFraudFlags: async (startDate: Date, endDate: Date, format: string = 'csv', _fields?: string[]) => {
    const flags = await FraudFlagModel.find({
      triggeredAt: { $gte: startDate, $lte: endDate },
    })
      .populate('ruleId', 'name type severity')
      .lean();

    if (format === 'csv') {
      const headers = ['flagId', 'userId', 'ruleName', 'ruleType', 'severity', 'score', 'status', 'triggeredAt'];
      const rows = flags.map(f => [
        f._id.toString(),
        f.userId.toString(),
        f.ruleName,
        f.ruleType,
        f.severity,
        f.score,
        f.status,
        f.triggeredAt.toISOString(),
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return flags;
  },

  // Job Processors
  setupJobProcessors: () => {
    // Process fraud detection jobs
    fraudDetectionQueue.process('check-fraud', async (job) => {
      const { context } = job.data;
      return fraudService.checkFraud(context);
    });

    // Process fraud flag review
    fraudQueue.process('review-flag', async (job) => {
      const { flagId, action, adminId, reviewNotes, resolution } = job.data;
      await fraudService.reviewFraudFlag(flagId, adminId, {
        action,
        reviewNotes,
        resolution,
      });
    });

    // Process fraud case resolution
    fraudQueue.process('resolve-case', async (job) => {
      const { caseId, adminId, resolution, resolutionNotes } = job.data;
      await fraudService.resolveFraudCase(caseId, adminId, {
        resolution,
        resolutionNotes,
      });
    });
  },

  // Initialize
  init: () => {
    fraudService.setupJobProcessors();
  },
};

// Rule evaluation engine
async function evaluateRule(rule: any, context: any): Promise<number> {
  let score = 0;

  switch (rule.type) {
    case 'velocity_check':
      score = await evaluateVelocityCheck(rule, context);
      break;
    case 'geo_anomaly':
      score = await evaluateGeoAnomaly(rule, context);
      break;
    case 'device_fingerprint':
      score = await evaluateDeviceFingerprint(rule, context);
      break;
    case 'ip_reputation':
      score = await evaluateIpReputation(rule, context);
      break;
    case 'payment_velocity':
      score = await evaluatePaymentVelocity(rule, context);
      break;
    case 'account_takeover':
      score = await evaluateAccountTakeover(rule, context);
      break;
    case 'bot_detection':
      score = await evaluateBotDetection(rule, context);
      break;
    case 'card_testing':
      score = await evaluateCardTesting(rule, context);
      break;
    case 'account_creation_spam':
      score = await evaluateAccountCreationSpam(rule, context);
      break;
    case 'promo_abuse':
      score = await evaluatePromoAbuse(rule, context);
      break;
    case 'chargeback_risk':
      score = await evaluateChargebackRisk(rule, context);
      break;
    case 'custom':
      score = await evaluateCustomRule(rule, context);
      break;
  }

  return Math.min(score, 100);
}

async function evaluateVelocityCheck(_rule: any, _context: any): Promise<number> {
  // Check request velocity from same IP/device/user
  // This would query recent activity from logs
  return 0;
}

async function evaluateGeoAnomaly(_rule: any, context: any): Promise<number> {
  // Check if location is anomalous for user
  if (!context.location) return 0;
  // Would check against user's historical locations
  return 0;
}

async function evaluateDeviceFingerprint(_rule: any, context: any): Promise<number> {
  // Check device fingerprint consistency
  if (!context.deviceFingerprint) return 0;
  return 0;
}

async function evaluateIpReputation(_rule: any, context: any): Promise<number> {
  // Check IP reputation from threat intelligence
  if (!context.ip) return 0;
  // Would query IP reputation services
  return 0;
}

async function evaluatePaymentVelocity(_rule: any, _context: any): Promise<number> {
  // Check payment frequency and amounts
  return 0;
}

async function evaluateAccountTakeover(_rule: any, _context: any): Promise<number> {
  // Check for account takeover patterns
  return 0;
}

async function evaluateBotDetection(_rule: any, _context: any): Promise<number> {
  // Detect bot-like behavior
  return 0;
}

async function evaluateCardTesting(_rule: any, _context: any): Promise<number> {
  // Detect card testing patterns
  return 0;
}

async function evaluateAccountCreationSpam(_rule: any, _context: any): Promise<number> {
  // Detect mass account creation
  return 0;
}

async function evaluatePromoAbuse(_rule: any, _context: any): Promise<number> {
  // Detect promo abuse
  return 0;
}

async function evaluateChargebackRisk(_rule: any, _context: any): Promise<number> {
  // Assess chargeback risk
  return 0;
}

async function evaluateCustomRule(_rule: any, _context: any): Promise<number> {
  // Custom rule evaluation
  return 0;
}