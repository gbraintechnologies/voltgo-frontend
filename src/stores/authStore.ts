import { create } from "zustand";
import { tokenStorage } from "../api/client";
import { CustomerProfile } from "../api/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { primeSocketToken } from "@/utils/socket";

const ONBOARDING_KEY = "has_seen_onboarding";

const onboardingStorage = {
  markSeen: () => AsyncStorage.setItem(ONBOARDING_KEY, "true"),
  hasSeen: async () => (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true",
};

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  customer: CustomerProfile | null;

  pendingPhone: string | null;
  pendingPassword: string | null;
  pendingFullName: string | null;

  setAuthenticated: (
    customer: CustomerProfile,
    access: string,
    refresh: string,
  ) => Promise<void>;
  setCustomer: (customer: CustomerProfile) => void;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  setHasSeenOnboarding: () => Promise<void>;

  setPendingRegistration: (
    fullName: string,
    phone: string,
    password: string,
  ) => void;
  clearPendingRegistration: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,
  customer: null,
  pendingPhone: null,
  pendingPassword: null,
  pendingFullName: null,

  setAuthenticated: async (customer, access, refresh) => {
    await tokenStorage.setTokens(access, refresh);
    await primeSocketToken(); // ← add this
    set({ isAuthenticated: true, customer });
  },

  setCustomer: (customer) => set({ customer }),

  // ── Does NOT touch hasSeenOnboarding — survives every logout ──
  logout: async () => {
    await tokenStorage.clearTokens();
    set({ isAuthenticated: false, customer: null });
  },

  setHasSeenOnboarding: async () => {
    await onboardingStorage.markSeen();
    set({ hasSeenOnboarding: true });
  },

  hydrateFromStorage: async () => {
    try {
      const [token, seenOnboarding] = await Promise.all([
        tokenStorage.getAccessToken(),
        onboardingStorage.hasSeen(),
      ]);
      if (!token) {
        set({
          isLoading: false,
          isAuthenticated: false,
          hasSeenOnboarding: seenOnboarding,
        });
        return;
      }
      await primeSocketToken(); // ← add this
      set({
        isLoading: false,
        isAuthenticated: true,
        hasSeenOnboarding: seenOnboarding,
      });
    } catch {
      set({
        isLoading: false,
        isAuthenticated: false,
        hasSeenOnboarding: false,
      });
    }
  },

  setPendingRegistration: (fullName, phone, password) =>
    set({
      pendingFullName: fullName,
      pendingPhone: phone,
      pendingPassword: password,
    }),

  clearPendingRegistration: () =>
    set({ pendingFullName: null, pendingPhone: null, pendingPassword: null }),
}));

let _watcherStarted = false;
export function startSessionWatcher() {
  if (_watcherStarted) return;
  _watcherStarted = true;

  setInterval(async () => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated) return;
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      state.logout();
    }
  }, 3000);
}


