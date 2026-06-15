import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
import CloseXSvg from "../../assets/icons/close_x.svg";
import { Order } from "../../api/orders";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  cancelRed: "#EF4444",
  cancelRedBg: "#FEF2F2",
  inputBg: "#F2F4F7",
  selectedBorder: "#0B1F3A",
};

const CANCEL_REASONS = [
  "Change of plans",
  "Ordered by mistake",
  "Rider is taking too long",
  "Found a better option",
  "Wrong delivery details",
  "Other",
];

interface CancelReasonModalProps {
  visible: boolean;
  order: Order | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function CancelReasonModal({
  visible,
  order,
  loading = false,
  onConfirm,
  onClose,
}: CancelReasonModalProps) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 68,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>Cancel delivery</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseXSvg width={18} height={18} />
          </TouchableOpacity>
        </View>

        {/* Destination summary */}
        {order && (
          <View style={styles.orderSummary}>
            <View style={styles.orderDot} />
            <Text style={styles.orderText} numberOfLines={1}>
              {order.dropoff_address}
            </Text>
          </View>
        )}

        {/* Subheading */}
        <Text style={styles.subheading}>Why are you cancelling?</Text>

        {/* Reason list */}
        <View style={styles.reasonList}>
          {CANCEL_REASONS.map((reason) => {
            const isSelected = selected === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonRow,
                  isSelected && styles.reasonRowSelected,
                ]}
                onPress={() => setSelected(reason)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    isSelected && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warning note */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            A cancellation fee may apply if a rider has already been assigned.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.keepBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.keepBtnText}>Keep delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelBtn,
              (!selected || loading) && styles.cancelBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selected || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.cancelBtnText}>Confirm cancel</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 31, 58, 0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  orderSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  orderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cancelRed,
    flexShrink: 0,
  },
  orderText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },

  subheading: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  reasonList: {
    marginHorizontal: 20,
    gap: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  reasonRowSelected: {
    borderColor: Colors.selectedBorder,
    backgroundColor: "#F0F3F7",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: Colors.navy,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.navy,
  },
  reasonText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  reasonTextSelected: {
    fontFamily: "Poppins-SemiBold",
    color: Colors.textPrimary,
  },

  warningBox: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.cancelRedBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  warningText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.cancelRed,
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
  },
  keepBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  keepBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: Colors.cancelRed,
  },
  cancelBtnDisabled: {
    opacity: 0.45,
  },
  cancelBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.white,
  },
});