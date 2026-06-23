import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import {
  usePaymentMethods,
  useSetDefaultPayment,
  useRemovePayment,
} from "../../hooks/useApi";
import { PaymentMethod } from "../../api/payments";
import { ApiError } from "../../api/client";
import ConfirmModal from "@/components/common/ConfirmModal";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/common/Toast";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  error: "#EF4444",
};

function ProviderLogo({ method }: { method: PaymentMethod }) {
  if (method.provider === "mtn_momo") {
    return (
      <Image
        source={require("../../assets/images/mtn_logo.png")}
        style={{ width: 36, height: 36 }}
        resizeMode="contain"
      />
    );
  }
  if (method.provider === "vodafone_cash") {
    return (
      <Image
        source={require("../../assets/images/telecel_logo.png")}
        style={{ width: 36, height: 36 }}
        resizeMode="contain"
      />
    );
  }
  if (method.provider === "airteltigo_money") {
    return (
      <Image
        source={require("../../assets/images/at_logo.png")}
        style={{ width: 36, height: 36 }}
        resizeMode="contain"
      />
    );
  }
  if (method.type === "card") {
    return (
      <Image
        source={require("../../assets/images/visa_logo.png")}
        style={{ width: 40, height: 28 }}
        resizeMode="contain"
      />
    );
  }
  return null;
}

export default function PaymentMethodsScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  const { data, isLoading, refetch } = usePaymentMethods();
  const setDefaultMutation = useSetDefaultPayment();
  const removeMutation = useRemovePayment();

  const methods: PaymentMethod[] = data?.data ?? [];

  const toast = useToast();
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toast.success("Default payment updated");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update default.",
      );
    }
  };

  const handleRemove = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemoveTarget({ id, name });
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.id);
      setRemoveTarget(null);
      toast.success("Payment method removed");
    } catch (err) {
      setRemoveTarget(null);
      toast.error(err instanceof ApiError ? err.message : "Failed to remove.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate("Account")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeIn }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {methods.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>💳</Text>
              </View>
              <Text style={styles.emptyTitle}>No payment methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a mobile money account or card to pay for deliveries
                quickly.
              </Text>
              {/* ── Navy CTA only shown in empty state ── */}
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate("AddMobileMoney")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddBtnText}>
                  + Add a Payment Method
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            methods.map((method, index) => (
              <View
                key={method.id}
                style={[
                  styles.methodRow,
                  index < methods.length - 1 && styles.methodRowBorder,
                ]}
              >
                <View style={styles.methodLogo}>
                  <ProviderLogo method={method} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>
                    {method.account_name ??
                      (method.type === "card" ? "Card" : "Mobile Money")}
                  </Text>
                  <Text style={styles.methodSub}>
                    {method.account_number ?? method.provider ?? ""}
                    {method.is_default ? "  ·  Default" : ""}
                  </Text>
                </View>
                <View style={styles.methodActions}>
                  {!method.is_default && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(method.id)}
                      disabled={setDefaultMutation.isPending}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.setDefaultText}>Set default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      handleRemove(
                        method.id,
                        method.account_name ?? "this method",
                      )
                    }
                    disabled={removeMutation.isPending}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* ── These always show, whether empty or not ── */}
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate("AddMobileMoney")}
            activeOpacity={0.7}
          >
            <Text style={styles.addRowText}>+ Add Mobile Money</Text>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate("AddCard")}
            activeOpacity={0.7}
          >
            <Text style={styles.addRowText}>+ Add Card</Text>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />

          <ConfirmModal
            visible={!!removeTarget}
            title="Remove payment method"
            message={`Remove ${removeTarget?.name ?? "this method"}? This can't be undone.`}
            confirmLabel="Remove"
            variant="danger"
            loading={removeMutation.isPending}
            onConfirm={confirmRemove}
            onCancel={() => setRemoveTarget(null)}
          />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  methodLogo: { width: 44, alignItems: "center" },
  methodInfo: { flex: 1 },
  methodName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  methodSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  methodActions: { gap: 4, alignItems: "flex-end" },
  actionBtn: { paddingVertical: 2 },
  setDefaultText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: Colors.navy,
  },
  removeText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.error,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  addRowText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.navy,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyAddBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
});
