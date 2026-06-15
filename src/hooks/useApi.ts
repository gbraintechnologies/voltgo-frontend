import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { ordersApi, BookDeliveryBody, OrderStatus } from "../api/orders";
import { bundlesApi, BundleStatus } from "../api/bundles";
import { paymentApi, AddMomoBody } from "../api/payments";
import { useAuthStore } from "../stores/authStore";

// ── Query keys ───────────────────────────────────────────────────────────────
export const QK = {
  me: ["customer", "me"] as const,
  orders: (status?: OrderStatus) => ["orders", status] as const,
  order: (id: string) => ["order", id] as const,
  bundleProducts: ["bundles", "products"] as const,
  activeBundle: ["bundles", "active"] as const,
  myBundles: (status?: BundleStatus) => ["bundles", "history", status] as const,
  paymentMethods: ["payment-methods"] as const,
  paymentOptions: ["payment-methods", "options"] as const,
};

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

/** Fetch current customer profile */
export const useCustomerProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: QK.me,
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min
  });
};

/** Register mutation — triggers OTP */
export const useRegister = () => {
  const setPending = useAuthStore((s) => s.setPendingRegistration);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, vars) => {
      setPending(vars.fullName, vars.phone, vars.password);
    },
  });
};

/** Verify phone OTP after registration */
export const useVerifyPhone = () => {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const clearPending = useAuthStore((s) => s.clearPendingRegistration);
  const pendingFullName = useAuthStore((s) => s.pendingFullName);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyPhone,
    onSuccess: (res) => {
      if (res.data) {
        const { token, refreshToken, id, phone } = res.data;
        const customer = {
          id,
          phone,
          fullName: pendingFullName ?? "",
          email: null,
          is_active: true,
          created_at: "",
          updated_at: "",
        };
        setAuthenticated(customer, token, refreshToken);
        clearPending();
        qc.setQueryData(QK.me, { success: true, data: customer });
      }
    },
  });
};
/** Login mutation */
export const useLogin = () => {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      if (res.data) {
        const { token, refreshToken, id, phone, full_name } = res.data as any;

        const customer = {
          id,
          phone,
          fullName: full_name ?? "",
          email: null,
          is_active: true,
          created_at: "",
          updated_at: "",
        };

        setAuthenticated(customer, token, refreshToken);
        qc.setQueryData(QK.me, { success: true, data: customer });
      }
    },
  });
};

/** Send OTP for resend */
export const useSendOtp = () =>
  useMutation({ mutationFn: (phone: string) => authApi.sendOtp(phone) });

/** Forgot password */
export const useForgotPassword = () =>
  useMutation({ mutationFn: (phone: string) => authApi.forgotPassword(phone) });

/** Reset password */
export const useResetPassword = () =>
  useMutation({ mutationFn: authApi.resetPassword });

/** Logout */
export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { tokenStorage } = await import("../api/client");
      const refresh = await tokenStorage.getRefreshToken();
      if (refresh) await authApi.logout(refresh);
    },
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
};

// ══════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════════════════════

/** Book a delivery */
export const useBookDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BookDeliveryBody) => ordersApi.book(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.orders() });
    },
  });
};

/** Get my order history */
export const useMyOrders = (params?: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: QK.orders(params?.status),
    queryFn: () => ordersApi.getMyOrders(params),
  });

/** Get a single order */
export const useOrderPolling = (id: string) =>
  useQuery({
    queryKey: QK.order(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
    refetchInterval: 5000,
    staleTime: 0,
  });

/** Cancel an order */
export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ordersApi.cancelOrder(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.orders() });
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { full_name?: string; email?: string }) =>
      authApi.updateProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.me });
    },
  });
};

// ══════════════════════════════════════════════════════════════════════════════
//  BUNDLES
// ══════════════════════════════════════════════════════════════════════════════

/** Browse bundle products */
export const useBundleProducts = () =>
  useQuery({
    queryKey: QK.bundleProducts,
    queryFn: bundlesApi.getProducts,
    staleTime: 10 * 60 * 1000,
  });

/** Get active bundle */
export const useActiveBundle = () =>
  useQuery({
    queryKey: QK.activeBundle,
    queryFn: bundlesApi.getActiveBundle,
    retry: (count, err: any) => err?.status !== 404 && count < 2,
  });

/** My bundle history */
export const useMyBundles = (status?: BundleStatus) =>
  useQuery({
    queryKey: QK.myBundles(status),
    queryFn: () => bundlesApi.getMyBundles(status),
  });

/** Purchase a bundle */
export const usePurchaseBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bundlesApi.purchase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.activeBundle });
      qc.invalidateQueries({ queryKey: QK.myBundles() });
      qc.invalidateQueries({ queryKey: QK.paymentOptions });
    },
  });
};

export const useVerifyPaystack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => paymentApi.verifyPaystack(reference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.activeBundle });
      qc.invalidateQueries({ queryKey: QK.myBundles() });
      qc.invalidateQueries({ queryKey: QK.paymentOptions });
    },
  });
};

/** Cancel a bundle */
export const useCancelBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bundlesApi.cancelBundle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.activeBundle });
      qc.invalidateQueries({ queryKey: QK.myBundles() });
    },
  });
};

// ══════════════════════════════════════════════════════════════════════════════
//  PAYMENT METHODS
// ══════════════════════════════════════════════════════════════════════════════

/** List payment methods */
export const usePaymentMethods = () =>
  useQuery({
    queryKey: QK.paymentMethods,
    queryFn: paymentApi.list,
  });

/** Get checkout payment options */
export const usePaymentOptions = () =>
  useQuery({
    queryKey: QK.paymentOptions,
    queryFn: async () => {
      try {
        return await paymentApi.getOptions();
      } catch {
        // Treat any error (404, 500, network) as empty options list
        return { data: [] };
      }
    },
    // Never retry on failure — empty state is handled gracefully in UI
    retry: false,
  });

/** Add MoMo */
export const useAddMomo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddMomoBody) => paymentApi.addMomo(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.paymentMethods });
      qc.invalidateQueries({ queryKey: QK.paymentOptions });
    },
  });
};

/** Set default payment method */
export const useSetDefaultPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.paymentMethods });
      qc.invalidateQueries({ queryKey: QK.paymentOptions });
    },
  });
};

/** Remove payment method */
export const useRemovePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.paymentMethods });
      qc.invalidateQueries({ queryKey: QK.paymentOptions });
    },
  });
};




