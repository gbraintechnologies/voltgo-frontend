/**
 * Toast.tsx
 * ─────────────────────────────────────────────────────────
 * Lightweight, imperative toast system for VoltGO.
 * Supports success, error, info, and warning variants.
 *
 * Setup:
 *   1. Wrap your root navigator with <ToastProvider>
 *   2. Call toast.show / toast.success / toast.error anywhere
 *
 * Usage:
 *   import { useToast } from '../components/common/Toast';
 *   const toast = useToast();
 *   toast.success("Package booked!");
 *   toast.error("Login failed. Check your credentials.");
 *   toast.info("OTP sent to your phone.");
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
  Dimensions,
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
  /** ms — default 3500 */
  duration?: number;
  /** Optional sub-label under the main message */
  subtitle?: string;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  success: (message: string, subtitle?: string) => void;
  error: (message: string, subtitle?: string) => void;
  info: (message: string, subtitle?: string) => void;
  warning: (message: string, subtitle?: string) => void;
  dismiss: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────
const VARIANTS: Record<
  ToastVariant,
  { bg: string; border: string; icon: string; iconColor: string; textColor: string }
> = {
  success: {
    bg: "#F0FDF4",
    border: "#4CD964",
    icon: "✓",
    iconColor: "#16A34A",
    textColor: "#14532D",
  },
  error: {
    bg: "#FEF2F2",
    border: "#EF4444",
    icon: "✕",
    iconColor: "#DC2626",
    textColor: "#7F1D1D",
  },
  info: {
    bg: "#EFF6FF",
    border: "#3B82F6",
    icon: "i",
    iconColor: "#2563EB",
    textColor: "#1E3A8A",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#F59E0B",
    icon: "!",
    iconColor: "#D97706",
    textColor: "#78350F",
  },
};

const DEFAULT_DURATION = 3500;
const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  const show = useCallback(
    (opts: ToastOptions) => {
      // Clear any pending dismiss timer
      if (timerRef.current) clearTimeout(timerRef.current);

      idRef.current += 1;
      const id = idRef.current;

      // Reset position instantly before showing
      translateY.setValue(-120);
      opacity.setValue(0);
      setToast({ ...opts, id });

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 70,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        // Only dismiss if this toast is still the active one
        if (idRef.current === id) dismiss();
      }, opts.duration ?? DEFAULT_DURATION);
    },
    [translateY, opacity, dismiss],
  );

  const success = useCallback(
    (message: string, subtitle?: string) =>
      show({ message, subtitle, variant: "success" }),
    [show],
  );
  const error = useCallback(
    (message: string, subtitle?: string) =>
      show({ message, subtitle, variant: "error" }),
    [show],
  );
  const info = useCallback(
    (message: string, subtitle?: string) =>
      show({ message, subtitle, variant: "info" }),
    [show],
  );
  const warning = useCallback(
    (message: string, subtitle?: string) =>
      show({ message, subtitle, variant: "warning" }),
    [show],
  );

  const config = VARIANTS[toast?.variant ?? "info"];

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, dismiss }}>
      {children}

      {/* Toast overlay — rendered on top of everything */}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              top: insets.top + (Platform.OS === "ios" ? 8 : 12),
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismiss}
            style={[
              styles.toast,
              {
                backgroundColor: config.bg,
                borderLeftColor: config.border,
              },
            ]}
          >
            {/* Icon circle */}
            <View
              style={[styles.iconCircle, { backgroundColor: config.border }]}
            >
              <Text style={[styles.iconText, { color: "#fff" }]}>
                {config.icon}
              </Text>
            </View>

            {/* Text */}
            <View style={styles.textWrap}>
              <Text
                style={[styles.message, { color: config.textColor }]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
              {toast.subtitle ? (
                <Text
                  style={[styles.subtitle, { color: config.textColor }]}
                  numberOfLines={1}
                >
                  {toast.subtitle}
                </Text>
              ) : null}
            </View>

            {/* Dismiss X */}
            <TouchableOpacity
              onPress={dismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Text style={[styles.closeText, { color: config.iconColor }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 99,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    gap: 12,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
    lineHeight: 16,
  },
  textWrap: {
    flex: 1,
  },
  message: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13.5,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 1,
    opacity: 0.8,
  },
  closeBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
});

