import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";

// Onboarding
import SplashScreen from "../screens/onboarding/SplashScreen";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import PhoneAuthScreen from "../screens/onboarding/PhoneAuthScreen";
import OTPVerificationScreen from "../screens/onboarding/OTPVerificationScreen";
import CreateProfileScreen from "../screens/onboarding/CreateProfileScreen";
import BiometricSetupScreen from "../screens/onboarding/BiometricSetupScreen";

// Tab + modal flow navigators
import MainTabNavigator from "./MainTabNavigator";
import DeliveryStackNavigator from "./DeliveryStackNavigator";
import BundlesStackNavigator from "./BundlesStackNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_right",
          animationDuration: 280,
        }}
      >
        {/* ── Onboarding ── */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: "fade" }}
        />
        <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
        />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen
          name="BiometricSetup"
          component={BiometricSetupScreen}
          options={{ animation: "slide_from_bottom" }}
        />

        {/* ── Main App ── */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ animation: "fade", gestureEnabled: false }}
        />

        {/* ── Delivery Flow ── */}
        <Stack.Screen
          name="DeliveryFlow"
          component={DeliveryStackNavigator}
          options={{
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="BundlesFlow"
          component={BundlesStackNavigator}
          options={{
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
