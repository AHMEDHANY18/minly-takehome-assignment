import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  StyleSheet,
  View,
} from "react-native";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";


type TabButtonProps = BottomTabBarButtonProps & {
  href?: string;
};


function PlusTabBarButton(props: TabButtonProps) {
  const { style, children, ...rest } = props;

  return (
    <PlatformPressable
      {...rest}
      android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true }}
      style={(state) => {
        const baseStyles = [
          styles.plusBtnWrap,
          state.pressed ? { transform: [{ scale: 0.96 }] } : undefined,
        ];
        if (typeof style === "function") {
          return [...baseStyles, style(state)];
        }
        return [...baseStyles, style];
      }}
    >
      <View style={styles.plusBtn}>
        <Ionicons name="add" size={28} color="#FFF" />
      </View>
    </PlatformPressable>
  );
}

/* -------------------------------------------------------
 * Tabs Layout
 * ----------------------------------------------------- */

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: "#2D7CFF",
        tabBarInactiveTintColor: "#9CA3AF",

        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.item,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Notifications */}
      <Tabs.Screen
        name="notification"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Upload (+) */}
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <PlusTabBarButton {...(props as TabButtonProps)} />
          ),
        }}
      />

      {/* Saved */}
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bookmark" : "bookmark-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFF",
    borderTopWidth: 0,

    height: Platform.OS === "ios" ? 90 : 72,
    paddingBottom: Platform.OS === "ios" ? 30 : 14,
    paddingTop: 12,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    elevation: 20,
  },

  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  plusBtnWrap: {
    position: "absolute",
    top: -22,
    left: "50%",
    transform: [{ translateX: -29 }],
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  plusBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2D7CFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#2D7CFF",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 22,
  },
});
