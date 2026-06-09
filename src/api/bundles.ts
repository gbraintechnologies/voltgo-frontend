import { api } from './client';

// ── Types ────────────────────────────────────────────────────────────────────
export interface BundleProduct {
  id: string;
  name: string;
  credits: number;
  price_ghs: number;
  validity_days: number;
  discount_percent: number;
}

export interface ActiveBundle {
  id: string;
  credits_total: number;
  credits_remaining: number;
  expires_at: string;
  auto_renew: boolean;
  product: BundleProduct;
}

export type BundleStatus = 'active' | 'expired' | 'exhausted' | 'cancelled';

export interface BundleHistoryItem {
  id: string;
  status: BundleStatus;
  credits_total: number;
  credits_remaining: number;
  expires_at: string;
  auto_renew: boolean;
  product: BundleProduct;
  created_at: string;
}

// ── Bundles endpoints ────────────────────────────────────────────────────────
export const bundlesApi = {
  /** Browse available bundle products */
  getProducts: () =>
    api.get<{ status: number; message: string; data: BundleProduct[] }>('/bundles/products', false),

  /** Purchase a bundle */
  purchase: (body: { bundle_product_id: string; auto_renew: boolean }) =>
    api.post<{ success: boolean; message: string; data: ActiveBundle }>('/bundles/purchase', body, true),

  /** Get my bundle history */
  getMyBundles: (status?: BundleStatus) => {
    const qs = status ? `?status=${status}` : '';
    return api.get<{ success: boolean; data: BundleHistoryItem[] }>(`/bundles/my${qs}`, true);
  },

  /** Get active bundle */
  getActiveBundle: () =>
    api.get<{ status: number; message: string; data: ActiveBundle }>('/bundles/my/active', true),

  /** Cancel a bundle */
  cancelBundle: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/bundles/my/${id}/cancel`, {}, true),
};



