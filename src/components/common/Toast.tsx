/**
 * Toast.tsx — CUSTOMER APP
 * ─────────────────────────────────────────────────────────
 * WhatsApp-style minimal pill toast.
 * Supports success, error, info, and warning variants.
 *
 * Setup:
 *   1. Wrap your root navigator with <ToastProvider>
 *   2. Call toast.success / toast.error / toast.info / toast.warning anywhere
 *
 * Usage:
 *   import { useToast } from '../components/common/Toast';
 *   const toast = useToast();
 *   toast.success("Package booked!");
 *   toast.error("Login failed. Check your credentials.");
 *   toast.info("OTP sent to your phone.");
 *   toast.warning("Please check your connection.");
 *   toast.show({ message: "Custom", variant: "warning", duration: 4000 });
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  /** ms — default 3000 */
  duration?: number;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  success: (message: string, subtitle?: string) => void; // add subtitle?
  error: (message: string, subtitle?: string) => void;
  info: (message: string, subtitle?: string) => void;
  warning: (message: string, subtitle?: string) => void;
  dismiss: () => void;
}
// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Accent dot colors — matches customer app palette ─────────────────────────
const ACCENT: Record<ToastVariant, string> = {
  success: "#4CD964", // app primary green
  error: "#EF4444",
  info: "#3B82F6",
  warning: "#F59E0B",
};

const DEFAULT_DURATION = 3000;
const ANIM_MS = 200;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(
    null,
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, scale]);

  const show = useCallback(
    (opts: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      idRef.current += 1;
      const id = idRef.current;

      // Reset before showing
      opacity.setValue(0);
      scale.setValue(0.92);
      setToast({ ...opts, id });

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        if (idRef.current === id) dismiss();
      }, opts.duration ?? DEFAULT_DURATION);
    },
    [opacity, scale, dismiss],
  );

  const success = useCallback(
    (message: string, _subtitle?: string) =>
      show({ message, variant: "success" }),
    [show],
  );
  const error = useCallback(
    (message: string, _subtitle?: string) =>
      show({ message, variant: "error" }),
    [show],
  );
  const info = useCallback(
    (message: string, _subtitle?: string) => show({ message, variant: "info" }),
    [show],
  );
  const warning = useCallback(
    (message: string, _subtitle?: string) =>
      show({ message, variant: "warning" }),
    [show],
  );

  const topOffset = (Platform.OS === "ios" ? insets.top : insets.top + 8) + 12;

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, dismiss }}
    >
      {children}

      {toast && (
        <View
          style={[styles.overlay, { top: topOffset }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.pill, { opacity, transform: [{ scale }] }]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={dismiss}
              style={styles.pillInner}
            >
              {/* Accent dot */}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: ACCENT[toast.variant ?? "info"] },
                ]}
              />
              <Text style={styles.message} numberOfLines={2}>
                {toast.message}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center", // centers pill horizontally
  },
  pill: {
    maxWidth: "80%",
    minWidth: 120,
    backgroundColor: "#0B1F3A", // app navy — consistent with brand
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
  },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  message: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#F1F1F1",
    flexShrink: 1,
    lineHeight: 18,
  },
});
