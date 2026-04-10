import { api } from './api';

export type UserRole = 'client' | 'provider' | 'admin';

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
  role: 'client' | 'provider';
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

export type ForgotPasswordPayload = {
  email: string;
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
    api.post<ApiResponse<{ user: AuthUser; debugOtp?: { emailOtp: string; phoneOtp: string } }>>(
      '/auth/register',
      payload,
    ),
  verifyEmail: (payload: VerifyEmailPayload) => api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-email', payload),
  verifyPhone: (payload: VerifyPhonePayload) => api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-phone', payload),
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>>('/auth/login', payload),
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<TokenPair>>('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken: string) => api.post<ApiResponse<null>>('/auth/logout', { refreshToken }),
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
};
