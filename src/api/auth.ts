import { api, tokenStorage } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────
export interface CustomerProfile {
  id: string;
  fullName: string; // keep camelCase internally
  email: string | null;
  phone: string;
  is_active: boolean;
  phone_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    id: string;
    full_name: string;
    phone: string;
    phone_verified: boolean;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyPhoneResponse {
  status: number;
  message: string;
  data?: {
    token: string; // ← actual field name from API
    refreshToken: string;
    id: string;
    phone: string;
    phone_verified: boolean;
    // no customer object in this response
  };
}

// ── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  /** Step 1: Register - sends OTP to phone */
  register: (body: { fullName: string; phone: string; password: string }) =>
    api.post<RegisterResponse>("/customer/auth/register", body),

  /** Step 2: Verify phone OTP - returns tokens */
  verifyPhone: (body: { phone: string; otp: string }) =>
    api.post<VerifyPhoneResponse>("/customer/auth/verify-phone", body),

  /** Resend OTP */
  sendOtp: (phone: string) =>
    api.post<OtpResponse>("/customer/auth/send-otp", { phone }),

  /** Login with phone + password */
  login: (body: { phone: string; password: string }) =>
    api.post<LoginResponse>("/customer/auth/login", body),

  /** Request password reset OTP */
  forgotPassword: (phone: string) =>
    api.post<OtpResponse>("/customer/auth/forgot-password", { phone }),

  /** Reset password with OTP */
  resetPassword: (body: { phone: string; otp: string; new_password: string }) =>
    api.post<OtpResponse>("/customer/auth/reset-password", body),

  /** Get current customer profile - requires auth */
  getMe: async (): Promise<{ success: boolean; data: CustomerProfile }> => {
    const res = await api.get<any>("/customer/auth/me", true);
    return {
      ...res,
      data: {
        ...res.data,
        fullName: res.data.full_name ?? res.data.fullName ?? "",
      },
    };
  },

  updateProfile: (body: { fullName?: string; email?: string }) =>
    api.patch<{ success: boolean; data: CustomerProfile }>(
      "/customer/auth/profile",
      body,
      true,
    ),

  /** Logout - revokes refresh token */
  logout: async (refreshToken: string) => {
    await api.post<{ success: boolean }>(
      "/customer/auth/logout",
      { refreshToken },
      true,
    );
    await tokenStorage.clearTokens();
  },
};


