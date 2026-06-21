import { api } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────
export type PaymentMethodType = "momo" | "card";
export type MomoProvider = "mtn_momo" | "vodafone_cash" | "airteltigo_money";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider?: MomoProvider;
  account_name?: string;
  account_number?: string;
  is_default: boolean;
  created_at: string;
}

export interface AddMomoBody {
  type: "momo";
  provider: MomoProvider;
  account_name: string;
  account_number: string;
  is_default?: boolean;
}

export interface PaymentOption {
  id: string;
  type: PaymentMethodType | "bundle_credit";
  label: string;
  sub?: string;
  is_default: boolean;
}

// ── Payment methods endpoints ────────────────────────────────────────────────
export const paymentApi = {
  /** List saved payment methods */
  list: () =>
    api.get<{ success: boolean; data: PaymentMethod[] }>(
      "/payment-methods",
      true,
    ),

  /** Get checkout payment options (includes bundle credit if active) */
  getOptions: () =>
    api.get<{ success: boolean; data: PaymentOption[] }>(
      "/payment-methods/options",
      true,
    ),

  /** Add a MoMo payment method */
  addMomo: (body: AddMomoBody) =>
    api.post<{ success: boolean; message: string; data: PaymentMethod }>(
      "/payment-methods",
      body,
      true,
    ),

  /** Set a payment method as default */
  setDefault: (id: string) =>
    api.post<{ success: boolean }>(`/payment-methods/${id}/default`, {}, true),

  verifyPaystack: (reference: string) =>
    api.post<{ success: boolean; message: string }>(
      "/payments/paystack/verify",
      { reference },
      true,
    ),

  /** Remove a payment method */
  remove: (id: string) =>
    api.delete<{ success: boolean }>(`/payment-methods/${id}`, true),
};


