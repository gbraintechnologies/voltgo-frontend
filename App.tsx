import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCustomFonts } from "./src/hooks/useCustomFonts";
import RootNavigator from "./src/navigation/RootNavigator";
import { Colors } from "./src/theme";
import { useAuthStore, startSessionWatcher } from "./src/stores/authStore";
import { LocationProvider } from "@/contexts/LocationContext";
import { ToastProvider } from "./src/components/common/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 1;
      },
      staleTime: 2 * 60 * 1000,
    },
  },
});

function AppInner() {
  const { fontsLoaded } = useCustomFonts();
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    hydrateFromStorage();
    startSessionWatcher();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SafeAreaProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <AppInner />
      </LocationProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
