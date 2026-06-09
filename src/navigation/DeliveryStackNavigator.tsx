import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeliveryStackParamList } from "./types";

import ChooseRouteScreen from "../screens/delivery/ChooseRouteScreen";
import SchedulePickupScreen from "../screens/delivery/SchedulePickupScreen";
import DeliveryDetailsScreen from "../screens/delivery/DeliveryDetailsScreen";
import SelectVehicleScreen from "../screens/delivery/SelectVehicleScreen";
import ReviewDeliveryScreen from "../screens/delivery/ReviewDeliveryScreen";
import PayWithScreen from "../screens/payment/PayWithScreen";
import AddPaymentMethodScreen from "../screens/payment/AddPaymentMethodScreen";

// Tracking flow
import RiderMatchingScreen from "../screens/tracking/RiderMatchingScreen";
import RiderFoundScreen from "../screens/tracking/RiderFoundScreen";
import RiderArrivingScreen from "../screens/tracking/RiderArrivingScreen";
import ActiveDeliveryScreen from "../screens/tracking/ActiveDeliveryScreen";
import DeliveryCompleteScreen from "@/screens/delivery/DeliveryCompleteScreen";
import AddMobileMoneyScreen from "@/screens/payment/AddMobileMoneyScreen";
import AddCardScreen from "@/screens/payment/AddCardScreen";

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

export default function DeliveryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 260,
        presentation: "card", // ← default all screens to card
      }}
    >
      {/* ── Booking flow ── */}
      <Stack.Screen name="ChooseRoute" component={ChooseRouteScreen} />

      {/* Sheet-like modal */}
      <Stack.Screen
        name="SchedulePickup"
        component={SchedulePickupScreen}
        options={{ animation: "slide_from_bottom" }} 
      />

      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
      <Stack.Screen name="ReviewDelivery" component={ReviewDeliveryScreen} />

      {/* Modal payment sheet */}
      <Stack.Screen
        name="PayWith"
        component={PayWithScreen}
        options={{
          presentation: "modal", // ← modal for this one
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethodScreen}
      />
      <Stack.Screen name="AddMobileMoney" component={AddMobileMoneyScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />

      <Stack.Screen
        name="DeliveryComplete"
        component={DeliveryCompleteScreen}
        options={{ animation: "fade", gestureEnabled: false }}
      />

      {/* ── Tracking flow ── */}
      <Stack.Screen
        name="RiderMatching"
        component={RiderMatchingScreen}
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="RiderFound"
        component={RiderFoundScreen}
        options={{ animation: "slide_from_bottom" }} 
      />
      <Stack.Screen name="RiderArriving" component={RiderArrivingScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  );
}
