import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { AppError } from '../../common/errors/AppError.js';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}

interface SMSOptions {
  to: string;
  body: string;
}

interface TemplateData {
  userName?: string;
  jobTitle?: string;
  providerName?: string;
  clientName?: string;
  amount?: string;
  date?: string;
  time?: string;
  reason?: string;
  trackingUrl?: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  supportEmail?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, string> = new Map();

  initialize() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP not configured, email service will not be available');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Load default templates
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates() {
    this.templates.set('job_created', `
      <h1>New Job Created</h1>
      <p>Hi {{userName}},</p>
      <p>A new job "{{jobTitle}}" has been created and is now available for proposals.</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
      <p>Best regards,<br>{{companyName}}</p>
    `);

    this.templates.set('proposal_received', `
      <h1>New Proposal Received</h1>
      <p>Hi {{clientName}},</p>
      <p>You have received a new proposal for "{{jobTitle}}" from {{providerName}}.</p>
      <p>Bid: {{amount}}</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
    `);

    this.templates.set('proposal_accepted', `
      <h1>Proposal Accepted!</h1>
      <p>Hi {{providerName}},</p>
      <p>Your proposal for "{{jobTitle}}" has been accepted by {{clientName}}.</p>
      <p>Amount: {{amount}}</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
    `);

    this.templates.set('proposal_rejected', `
      <h1>Proposal Update</h1>
      <p>Hi {{providerName}},</p>
      <p>Your proposal for "{{jobTitle}}" was not selected.</p>
      <p>Reason: {{reason}}</p>
      <p>Don't worry, there are plenty of other opportunities!</p>
    `);

    this.templates.set('job_completed', `
      <h1>Job Completed</h1>
      <p>Hi {{userName}},</p>
      <p>The job "{{jobTitle}}" has been marked as completed.</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
    `);

    this.templates.set('payout_completed', `
      <h1>Payout Completed</h1>
      <p>Hi {{providerName}},</p>
      <p>Your payout of {{amount}} has been processed and sent to your account.</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
    `);

    this.templates.set('wallet_low_balance', `
      <h1>Low Wallet Balance</h1>
      <p>Hi {{userName}},</p>
      <p>Your wallet balance is running low. Please top up to continue using the platform.</p>
      <p><a href="{{actionUrl}}">Top Up Now</a></p>
    `);

    this.templates.set('dispute_created', `
      <h1>Dispute Created</h1>
      <p>Hi {{userName}},</p>
      <p>A dispute has been created for job "{{jobTitle}}".</p>
      <p>Reason: {{reason}}</p>
      <p><a href="{{actionUrl}}">View Dispute</a></p>
    `);

    this.templates.set('dispute_resolved', `
      <h1>Dispute Resolved</h1>
      <p>Hi {{userName}},</p>
      <p>The dispute for "{{jobTitle}}" has been resolved.</p>
      <p>Resolution: {{reason}}</p>
      <p><a href="{{actionUrl}}">View Details</a></p>
    `);

    this.templates.set('payout_completed', `
      <h1>Payout Completed</h1>
      <p>Hi {{providerName}},</p>
      <p>Your payout of {{amount}} has been processed and sent to your account.</p>
      <p><a href="{{actionUrl}}">{{actionText}}</a></p>
    `);

    this.templates.set('wallet_low_balance', `
      <h1>Low Wallet Balance</h1>
      <p>Hi {{userName}},</p>
      <p>Your wallet balance is running low. Please top up to continue using the platform.</p>
      <p><a href="{{actionUrl}}">Top Up Now</a></p>
    `);

    this.templates.set('wallet_escrow_locked', `
      <h1>Escrow Locked</h1>
      <p>Hi {{clientName}},</p>
      <p>Escrow of {{amount}} has been locked for job "{{jobTitle}}".</p>
    `);

    this.templates.set('wallet_escrow_released', `
      <h1>Escrow Released</h1>
      <p>Hi {{providerName}},</p>
      <p>Escrow of {{amount}} has been released for job "{{jobTitle}}".</p>
    `);

    this.templates.set('wallet_escrow_refunded', `
      <h1>Escrow Refunded</h1>
      <p>Hi {{clientName}},</p>
      <p>Escrow of {{amount}} has been refunded to your wallet.</p>
    `);

    this.templates.set('payout_requested', `
      <h1>Payout Requested</h1>
      <p>Hi {{providerName}},</p>
      <p>Your payout request of {{amount}} has been received and is being processed.</p>
    `);

    this.templates.set('payout_completed', `
      <h1>Payout Completed</h1>
      <p>Hi {{providerName}},</p>
      <p>Your payout of {{amount}} has been completed and sent to your account.</p>
    `);

    this.templates.set('payout_failed', `
      <h1>Payout Failed</h1>
      <p>Hi {{providerName}},</p>
      <p>Your payout of {{amount}} has failed. Reason: {{reason}}</p>
      <p>Please check your payout details and try again.</    `);

    this.templates.set('wallet_topup', `
      <h1>Wallet Top-up Successful</h1>
      <p>Hi {{userName}},</p>
      <p>Your wallet has been topped up with {{amount}}.</p>
    `);

    this.templates.set('verification_submitted', `
      <h1>Verification Submitted</h1>
      <p>Hi {{userName}},</p>
      <p>Your verification documents have been submitted and are under review.</    `);

    this.templates.set('verification_approved', `
      <h1>Verification Approved</h1>
      <p>Hi {{userName}},</p>
      <p>Your verification has been approved! You can now start offering services.</p>
    `);

    this.templates.set('verification_rejected', `
      <h1>Verification Rejected</h1>
      <p>Hi {{userName}},</p>
      <p>Your verification was rejected. Reason: {{reason}}</p>
      <p>Please review and resubmit your documents.</p>
    `);

    this.templates.set('kyc_submitted', `
      <h1>KYC Submitted</h1>
      <p>Hi {{userName}},</p>
      <p>Your KYC documents have been submitted for review.</p>
    `);

    this.templates.set('kyc_approved', `
      <h1>KYC Approved</h1>
      <p>Hi {{userName}},</p>
      <p>Your KYC has been approved! You can now start offering services on the platform.</p>
    `);

    this.templates.set('kyc_rejected', `
      <h1>KYC Rejected</h1>
      <p>Hi {{userName}},</p>
      <p>Your KYC was rejected. Reason: {{reason}}</p>
      <p>Please review and resubmit your documents.</p>
    `);

    this.templates.set('welcome', `
      <h1>Welcome to {{companyName}}!</h1>
      <p>Hi {{userName}},</p>
      <p>Welcome to {{companyName}}! We're excited to have you on board.</p>
      <p><a href="{{actionUrl}}">Get Started</a></p>
    `);

    this.templates.set('password_reset', `
      <h1>Password Reset</h1>
      <p>Hi {{userName}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{actionUrl}}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `);

    this.templates.set('email_verification', `
      <h1>Verify Your Email</h1>
      <p>Hi {{userName}},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="{{actionUrl}}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    let html = options.html;
    let text = options.text;

    if (options.template && this.templates.has(options.template)) {
      let template = this.templates.get(options.template)!;
      const data = { ...this.getDefaultTemplateData(), ...options.templateData };
      
      // Replace template variables
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, String(data[key]));
      });
      
      html = template;
    }

    if (!html && !text) {
      throw new Error('Either html, text, or template must be provided');
    }

    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      await this.transporter!.sendMail({
        from: process.env.SMTP_FROM || '"Do It Platform" <noreply@doitplatform.com>',
        to,
        subject: options.subject,
        html,
        text,
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  private getDefaultTemplateData(): TemplateData {
    return {
      companyName: 'Do It Platform',
      supportEmail: 'support@doitplatform.com',
    };
  }

  addTemplate(name: string, template: string) {
    this.templates.set(name, template);
  }
}

class SMSService {
  private client: twilio.Twilio | null = null;

  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn('Twilio not configured, SMS service will not be available');
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(options: { to: string; body: string }): Promise<boolean> {
    if (!this.client) {
      throw new Error('SMS service not initialized');
    }

    try {
      await this.client.messages.create({
        body: options.body,
        to: options.to,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  async sendBulkSMS(recipients: string[], body: string): Promise<number> {
    if (!this.client) {
      throw new Error('SMS service not initialized');
    }

    let sent = 0;
    for (const to of recipients) {
      try {
        await this.client.messages.create({
          body,
          to,
          from: process.env.TWILIO_PHONE_NUMBER,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send SMS to ${to}:`, error);
      }
    }
    return sent;
  }
}

export const emailService = new EmailService();
export const smsService = new SMSService();