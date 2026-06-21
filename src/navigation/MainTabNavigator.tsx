import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MainTabParamList } from "./types";
import { Colors } from "../theme";

// ── Default icons ─────────────────────────────────────────────────────────────
import HomeIconSvg from "../assets/icons/home_icon.svg";
import ActivitiesIconSvg from "../assets/icons/activities_icon.svg";
import AccountIconSvg from "../assets/icons/account_icon.svg";

// ── Deep (active) icons ───────────────────────────────────────────────────────
import HomeIconDeepSvg from "../assets/icons/home_icon_deep.svg";
import ActivitiesIconDeepSvg from "../assets/icons/activities_icon_deep.svg";
import AccountIconDeepSvg from "../assets/icons/account_icon_deep.svg";

import HomeMapScreen from "../screens/home/HomeMapScreen";
import AccountStackNavigator from "./AccountStackNavigator";
import ActivitiesStackNavigator from "./ActivitiesStackNavigator";

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  const TABS = [
    { Icon: HomeIconSvg,       IconActive: HomeIconDeepSvg },
    { Icon: ActivitiesIconSvg, IconActive: ActivitiesIconDeepSvg },
    { Icon: AccountIconSvg,    IconActive: AccountIconDeepSvg },
  ];

  return (
    <View style={[tabStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <View style={tabStyles.tabsGroup}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const { Icon, IconActive } = TABS[index];
          const DisplayIcon = isFocused ? IconActive : Icon;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tabStyles.iconWrap,
                  isFocused && tabStyles.iconWrapActive,
                ]}
              >
                <DisplayIcon width={24} height={24} />
              </View>
              {isFocused && <View style={tabStyles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    alignItems: "center",
  },
  tabsGroup: {
    flexDirection: "row",
    gap: 62,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  iconWrapActive: {
    // backgroundColor: "rgba(11,31,58,0.07)",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.navy,
  },
});

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeMap" component={HomeMapScreen} />
      <Tab.Screen name="Activities" component={ActivitiesStackNavigator} />
      <Tab.Screen name="Account" component={AccountStackNavigator} />
    </Tab.Navigator>
  );
}





