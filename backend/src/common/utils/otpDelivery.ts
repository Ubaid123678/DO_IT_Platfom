import axios, { type AxiosError } from 'axios';

import { AppError } from '../errors/AppError.js';
import config from '../../config/env.js';

type TwilioErrorPayload = {
  code?: number;
  message?: string;
  more_info?: string;
  status?: number;
};

type SendGridErrorPayload = {
  errors?: Array<{
    message?: string;
    field?: string;
    help?: string;
  }>;
};

const isPlaceholder = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    normalized.includes('dummy') ||
    normalized.includes('xxxxx') ||
    normalized.includes('change-this') ||
    normalized === 'sg.xxxxx'
  );
};

const hasSendGridConfig = (): boolean => {
  return !isPlaceholder(config.sendgrid_api_key) && !isPlaceholder(config.sendgrid_from_email);
};

const hasTwilioConfig = (): boolean => {
  return (
    !isPlaceholder(config.twilio_account_sid) &&
    !isPlaceholder(config.twilio_auth_token) &&
    !isPlaceholder(config.twilio_phone_number)
  );
};

const shouldBypassOtpProviders = (): boolean => config.otp_debug_mode;

const toTwilioAppError = (error: AxiosError<TwilioErrorPayload>): AppError => {
  const twilioCode =
    error.response?.data?.code ??
    (error.response?.headers?.['x-twilio-error-code']
      ? Number(error.response.headers['x-twilio-error-code'])
      : undefined);
  const providerMessage = error.response?.data?.message;

  if (twilioCode === 21608) {
    return new AppError(
      'This phone number is not verified in your Twilio trial account. Verify it in Twilio Console or use a verified destination number.',
      400,
      'TWILIO_TRIAL_UNVERIFIED_NUMBER',
      { provider: 'twilio', twilioCode, providerMessage },
    );
  }

  if (twilioCode === 21211) {
    return new AppError(
      'Invalid phone number format. Enter a valid number in international format (for example, +923001234567).',
      400,
      'PHONE_NUMBER_INVALID',
      { provider: 'twilio', twilioCode, providerMessage },
    );
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return new AppError(
      'SMS provider authentication failed. Check Twilio credentials and permissions.',
      503,
      'OTP_DELIVERY_UNAVAILABLE',
      { provider: 'twilio', twilioCode, providerMessage },
    );
  }

  return new AppError(
    providerMessage || 'SMS OTP delivery failed. Please try again.',
    502,
    'OTP_DELIVERY_FAILED',
    { provider: 'twilio', twilioCode, providerMessage },
  );
};

const toSendGridAppError = (error: AxiosError<SendGridErrorPayload>): AppError => {
  const providerMessage = error.response?.data?.errors?.[0]?.message;

  if (error.response?.status === 401 || error.response?.status === 403) {
    return new AppError(
      'Email provider authentication failed. Check SendGrid API key and sender configuration.',
      503,
      'OTP_DELIVERY_UNAVAILABLE',
      { provider: 'sendgrid', providerMessage },
    );
  }

  return new AppError(
    providerMessage || 'Email OTP delivery failed. Please try again.',
    502,
    'OTP_DELIVERY_FAILED',
    { provider: 'sendgrid', providerMessage },
  );
};

export const sendEmailOtp = async (email: string, otp: string): Promise<boolean> => {
  if (shouldBypassOtpProviders()) {
    return true;
  }

  if (!hasSendGridConfig()) {
    return false;
  }

  try {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email }] }],
        from: { email: config.sendgrid_from_email },
        subject: 'Do It verification code',
        content: [
          {
            type: 'text/plain',
            value: `Your Do It verification code is: ${otp}. This code expires in 1 minute.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${config.sendgrid_api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw toSendGridAppError(error as AxiosError<SendGridErrorPayload>);
    }

    throw new AppError('Email OTP delivery failed. Please try again.', 502, 'OTP_DELIVERY_FAILED');
  }

  return true;
};

export const sendPhoneOtp = async (phone: string, otp: string): Promise<boolean> => {
  if (shouldBypassOtpProviders()) {
    return true;
  }

  if (!hasTwilioConfig()) {
    return false;
  }

  const authToken = Buffer.from(`${config.twilio_account_sid}:${config.twilio_auth_token}`).toString('base64');
  const body = new URLSearchParams({
    From: config.twilio_phone_number,
    To: phone,
    Body: `Your Do It verification code is: ${otp}. This code expires in 1 minute.`,
  });

  try {
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json`,
      body.toString(),
      {
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 8000,
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw toTwilioAppError(error as AxiosError<TwilioErrorPayload>);
    }

    throw new AppError('SMS OTP delivery failed. Please try again.', 502, 'OTP_DELIVERY_FAILED');
  }

  return true;
};
