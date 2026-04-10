type AuditLevel = 'info' | 'warn';

type AuditPayload = {
  event: string;
  userId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

export const logAuthAudit = ({ event, userId, email, metadata }: AuditPayload, level: AuditLevel = 'info'): void => {
  const entry = {
    domain: 'auth',
    event,
    userId,
    email,
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (level === 'warn') {
    console.warn('[audit]', JSON.stringify(entry));
    return;
  }

  console.info('[audit]', JSON.stringify(entry));
};
