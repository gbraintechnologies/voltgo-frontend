import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCustomFonts } from './src/hooks/useCustomFonts';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/theme';

export default function App() {
  const { fontsLoaded } = useCustomFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        translucent                          // ← key for Android notch/cutout
        backgroundColor="transparent"        // ← lets SafeArea measure correctly
        barStyle="dark-content"
      />
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});