import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { TimerProvider } from "../lib/TimerContext";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function ThemedLayout() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.background === "#ffffff" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerShown: false,
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TimerProvider>
        <ThemedLayout />
      </TimerProvider>
    </ThemeProvider>
  );
}
