import { api } from './api';

export type UserRole = 'pending' | 'client' | 'provider' | 'admin';

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    message?: string;
  };
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'client' | 'provider';
  countryCode: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type VerifyPhonePayload = {
  phone: string;
  otp: string;
};

export type OtpFlowType = 'email' | 'phone' | 'reset';

export type VerifyOtpPayload = {
  type: OtpFlowType;
  contact: string;
  otp: string;
};

export type ResendOtpPayload = {
  type: OtpFlowType;
  contact: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type UpdateMePayload = {
  fullName?: string;
  role?: 'client' | 'provider';
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ user: AuthUser; debugOtp?: { emailOtp?: string; phoneOtp?: string } }>>(
      '/auth/register',
      payload,
    ),
  verifyEmail: (payload: VerifyEmailPayload) => api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-email', payload),
  verifyPhone: (payload: VerifyPhonePayload) => api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-phone', payload),
  verifyOTP: (payload: VerifyOtpPayload) => {
    if (payload.type === 'email') {
      return api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-email', {
        email: payload.contact,
        otp: payload.otp,
      });
    }

    if (payload.type === 'reset') {
      throw new Error('Reset OTP verification is not supported by this API flow. Use forgot-password and reset-password endpoints.');
    }

    return api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-phone', {
      phone: payload.contact,
      otp: payload.otp,
    });
  },
  resendOTP: (payload: ResendOtpPayload) => {
    if (payload.type === 'reset') {
      return api.post<ApiResponse<{ debugResetToken?: string; debugOtp?: string }>>('/auth/forgot-password', {
        email: payload.contact,
      });
    }

    const endpoint = payload.type === 'email' ? '/auth/resend-email-otp' : '/auth/resend-phone-otp';
    const key = payload.type === 'email' ? 'email' : 'phone';
    return api.post<ApiResponse<{ resent: boolean; debugOtp?: string }>>(endpoint, { [key]: payload.contact });
  },
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>>('/auth/login', payload),
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<TokenPair>>('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken: string) => api.post<ApiResponse<null>>('/auth/logout', { refreshToken }),
  sendResetCode: (contact: string) =>
    api.post<ApiResponse<{ debugResetToken?: string }>>('/auth/forgot-password', {
      email: contact,
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiResponse<{ debugResetToken?: string }>>('/auth/forgot-password', payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/reset-password', payload),
  me: (accessToken: string) =>
    api.get<ApiResponse<{ user: AuthUser }>>('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  updateMe: (accessToken: string, payload: UpdateMePayload) =>
    api.patch<ApiResponse<{ user: AuthUser }>>('/auth/me', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};
