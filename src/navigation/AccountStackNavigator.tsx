import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountScreen from "../screens/account/AccountScreen";
import ProfileScreen from "../screens/account/ProfileScreen";
import NotificationsScreen from "../screens/account/NotificationsScreen";
import SecurityScreen from "../screens/account/SecurityScreen";
import SupportScreen from "../screens/account/SupportScreen";
import SettingsScreen from "../screens/account/SettingsScreen";
import BundlesCreditsScreen from "@/screens/bundles/BundlesCreditsScreen";
import AddPaymentMethodScreen from "@/screens/payment/AddPaymentMethodScreen";
import AddMobileMoneyScreen from "@/screens/payment/AddMobileMoneyScreen";
import AddCardScreen from "@/screens/payment/AddCardScreen";
import PayWithScreen from "@/screens/payment/PayWithScreen";
import PaymentMethodsScreen from "@/screens/payment/PaymentMethodsScreen";

const Stack = createNativeStackNavigator();

export default function AccountStackNavigator() {
  return (
    <Stack.Navigator
      id="AccountStack"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="BundlesCredits" component={BundlesCreditsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethodScreen}
      />
      <Stack.Screen name="PayWith" component={PayWithScreen} />
      <Stack.Screen name="AddMobileMoney" component={AddMobileMoneyScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
    </Stack.Navigator>
  );
}
