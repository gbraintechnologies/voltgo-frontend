import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BundlesStackParamList } from "./types";

import BundlesCreditsScreen from "../screens/bundles/BundlesCreditsScreen";
import TopupScreen from "../screens/bundles/TopupScreen";
import RenewScreen from "../screens/bundles/RenewScreen";
import BundleSuccessScreen from "@/screens/bundles/BundleSuccessScreen";
import BundlePaymentScreen from "@/screens/bundles/BundlePaymentScreen";
import BundleHistoryScreen from "@/screens/bundles/BundleHistoryScreen";

const Stack = createNativeStackNavigator<BundlesStackParamList>();

export default function BundlesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 260,
      }}
    >
      <Stack.Screen name="BundlesCredits" component={BundlesCreditsScreen} />
      <Stack.Screen name="Topup" component={TopupScreen} />
      <Stack.Screen name="Renew" component={RenewScreen} />
      <Stack.Screen name="BundlePayment" component={BundlePaymentScreen} />
      <Stack.Screen
        name="BundleSuccess"
        component={BundleSuccessScreen}
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen name="BundleHistory" component={BundleHistoryScreen} />
    </Stack.Navigator>
  );
}



