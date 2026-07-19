import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
  isAxiosError: vi.fn(() => false),
}));

vi.mock('../../config/env.js', () => ({
  default: {
    node_env: 'development',
    otp_debug_mode: true,
    sendgrid_api_key: 'not-used',
    sendgrid_from_email: 'dev@example.com',
    twilio_account_sid: 'not-used',
    twilio_auth_token: 'not-used',
    twilio_phone_number: '+10000000000',
  },
}));

import { sendEmailOtp, sendPhoneOtp } from './otpDelivery.js';

const mockedAxiosPost = vi.mocked(axios.post);

beforeEach(() => {
  mockedAxiosPost.mockClear();
});

describe('otpDelivery debug mode', () => {
  it('skips SendGrid when OTP debug mode is enabled', async () => {
    await expect(sendEmailOtp('dev@example.com', '123456')).resolves.toBe(true);
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });

  it('skips Twilio when OTP debug mode is enabled', async () => {
    await expect(sendPhoneOtp('+923001234567', '654321')).resolves.toBe(true);
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });
});