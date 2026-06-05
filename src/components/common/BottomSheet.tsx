/**
 * BottomSheet — animated slide-up panel
 * Used on: HomeMapScreen, SelectVehicleScreen
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Radius, Shadow } from '../../theme';

const { height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  /** Height of the sheet as a fraction of screen height, e.g. 0.38 */
  heightFraction?: number;
  /** Whether to show the drag handle pill */
  showHandle?: boolean;
  style?: object;
}

export default function BottomSheet({
  children,
  heightFraction = 0.35,
  showHandle = true,
  style,
}: Props) {
  const sheetHeight = height * heightFraction;
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: sheetHeight, transform: [{ translateY: slideAnim }] },
        Shadow.medium,
        style,
      ]}
    >
      {showHandle && (
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>
      )}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'visible',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
  },
});
