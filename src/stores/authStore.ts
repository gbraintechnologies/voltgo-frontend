import { create } from 'zustand';
import { tokenStorage } from '../api/client';
import { CustomerProfile } from '../api/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  customer: CustomerProfile | null;

  // Pending registration (held between register → OTP verify)
  pendingPhone: string | null;
  pendingPassword: string | null;
  pendingFullName: string | null;

  setAuthenticated: (customer: CustomerProfile, access: string, refresh: string) => Promise<void>;
  setCustomer: (customer: CustomerProfile) => void;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;

  setPendingRegistration: (fullName: string, phone: string, password: string) => void;
  clearPendingRegistration: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  customer: null,
  pendingPhone: null,
  pendingPassword: null,
  pendingFullName: null,

  setAuthenticated: async (customer, access, refresh) => {
    await tokenStorage.setTokens(access, refresh);
    set({ isAuthenticated: true, customer });
  },

  setCustomer: (customer) => set({ customer }),

  logout: async () => {
    await tokenStorage.clearTokens();
    set({ isAuthenticated: false, customer: null });
  },

  hydrateFromStorage: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      set({ isLoading: false, isAuthenticated: true });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setPendingRegistration: (fullName, phone, password) =>
    set({ pendingFullName: fullName, pendingPhone: phone, pendingPassword: password }),

  clearPendingRegistration: () =>
    set({ pendingFullName: null, pendingPhone: null, pendingPassword: null }),
}));

// ── Global 401 listener ──────────────────────────────────────────────────────
// When the API client clears tokens after a failed refresh, this watcher
// detects the token is gone and forces logout so the navigator redirects.
let _watcherStarted = false;
export function startSessionWatcher() {
  if (_watcherStarted) return;
  _watcherStarted = true;

  setInterval(async () => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated) return;

    const token = await tokenStorage.getAccessToken();
    if (!token) {
      // Token was cleared by the auto-refresh failure — log out
      state.logout();
    }
  }, 3000); // check every 3 seconds
}





