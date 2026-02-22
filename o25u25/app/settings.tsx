import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BleHr from "../lib/ble-hr";
import type { ThemeMode } from "../lib/ThemeContext";

const HR_DEVICE_KEY = "@o25u25/hrDeviceId";
const HR_DEVICE_NAME_KEY = "@o25u25/hrDeviceName";

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hrDeviceName, setHrDeviceName] = useState<string | null>(null);
  const [hrScanning, setHrScanning] = useState(false);
  const [hrDevices, setHrDevices] = useState<BleHr.BleHrDevice[]>([]);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [hrScanError, setHrScanError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HR_DEVICE_NAME_KEY).then(setHrDeviceName);
  }, []);

  const requestBleScanPermissions = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setHrScanError("Location permission is required to scan for sensors.");
      return false;
    }
    if (Platform.OS === "android") {
      const apiLevel = (Platform as { Version?: number }).Version ?? 0;
      if (apiLevel >= 31) {
        const perms = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ] as const;
        const result = await PermissionsAndroid.requestMultiple(perms);
        const denied = perms.some((p) => result[p] !== PermissionsAndroid.RESULTS.GRANTED);
        if (denied) {
          setHrScanError("Bluetooth permission is required to scan for sensors.");
          return false;
        }
      }
    }
    setHrScanError(null);
    return true;
  };

  const handleScanHr = async () => {
    if (!BleHr.isBleAvailable()) return;
    const allowed = await requestBleScanPermissions();
    if (!allowed) {
      return;
    }
    setHrScanning(true);
    setHrDevices([]);
    setHrScanError(null);
    const seen = new Set<string>();
    await BleHr.scanForDevices(
      (device) => {
        if (seen.has(device.id)) return;
        seen.add(device.id);
        setHrDevices((prev) => [...prev, device]);
      },
      { timeoutMs: 8000 }
    );
    setHrScanning(false);
  };

  const handleSelectHrDevice = async (deviceId: string, name: string | null) => {
    if (!BleHr.isBleAvailable()) return;
    setConnectingDeviceId(deviceId);
    try {
      const { disconnect } = await BleHr.connectAndSubscribe(deviceId, {
        onBpm: () => {},
      });
      await AsyncStorage.setItem(HR_DEVICE_KEY, deviceId);
      await AsyncStorage.setItem(HR_DEVICE_NAME_KEY, name ?? "Heart rate sensor");
      setHrDeviceName(name ?? "Heart rate sensor");
      setHrDevices([]);
      await disconnect();
    } catch (_) {
      setHrDevices([]);
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const modes: { value: ThemeMode; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "night", label: "Night" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 16 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.icon} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          Appearance
        </Text>
        <View style={styles.optionsRow}>
          {modes.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setThemeMode(value)}
              style={({ pressed }) => [
                styles.option,
                {
                  opacity: pressed ? 0.7 : 1,
                  borderColor: theme.textMuted,
                },
              ]}
            >
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                {label}
              </Text>
              {themeMode === value ? (
                <Ionicons name="checkmark" size={20} color={theme.icon} />
              ) : (
                <View style={{ width: 20 }} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          Connect a HR sensor
        </Text>
        <Text style={[styles.hrDescription, { color: theme.textMuted }]}>
          Many heart rate straps and armbands can be connected from here. You don’t need to pair them in your phone’s Bluetooth settings—just tap below to scan and choose your sensor.
        </Text>
        {!BleHr.isBleAvailable() ? (
          <View style={[styles.hrUnavailable, { backgroundColor: theme.background }]}>
            <Ionicons name="bluetooth-outline" size={24} color={theme.textMuted} />
            <Text style={[styles.hrUnavailableText, { color: theme.textMuted }]}>
              BLE is not available in this build. Use a development build (not Expo Go) to connect a heart rate monitor.
            </Text>
          </View>
        ) : (
          <>
            {hrDeviceName ? (
              <View style={[styles.hrConnectedRow, styles.hrConnectedBadge, { backgroundColor: theme.background }]}>
                <Ionicons name="checkmark-circle" size={22} color={theme.icon} />
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  Connected: {hrDeviceName}
                </Text>
              </View>
            ) : null}
            {hrScanError ? (
              <View style={[styles.hrErrorWrap, { backgroundColor: theme.background }]}>
                <Ionicons name="warning-outline" size={20} color={theme.textMuted} />
                <Text style={[styles.hrErrorText, { color: theme.textMuted }]}>
                  {hrScanError}
                </Text>
              </View>
            ) : null}
            <Pressable
              onPress={handleScanHr}
              disabled={hrScanning}
              style={({ pressed }) => [
                styles.hrButton,
                { opacity: pressed || hrScanning ? 0.7 : 1 },
              ]}
            >
              {hrScanning ? (
                <ActivityIndicator size="small" color={theme.icon} />
              ) : (
                <Text style={[styles.hrButtonText, { color: theme.text }]}>
                  {hrDeviceName ? "Change sensor" : "Scan for sensors"}
                </Text>
              )}
            </Pressable>
            {hrDevices.length > 0 && (
              <View style={styles.deviceListWrap}>
                <Text style={[styles.availableSensorsLabel, { color: theme.textMuted }]}>
                  Available sensors
                </Text>
                <View style={styles.deviceList}>
                  {hrDevices.map((d) => {
                    const isConnecting = connectingDeviceId === d.id;
                    const displayName = d.name ?? d.id;
                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => handleSelectHrDevice(d.id, d.name)}
                        disabled={!!connectingDeviceId}
                        style={({ pressed }) => [
                          styles.deviceItem,
                          {
                            opacity: pressed && !isConnecting ? 0.7 : 1,
                            backgroundColor: isConnecting ? theme.background : "transparent",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                          },
                        ]}
                      >
                        <Text style={[styles.optionLabel, { color: theme.text }]} numberOfLines={1}>
                          {displayName}
                        </Text>
                        {isConnecting ? (
                          <ActivityIndicator size="small" color={theme.icon} />
                        ) : (
                          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 15,
  },
  hrDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  hrUnavailable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 8,
  },
  hrUnavailableText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  hrConnectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hrConnectedBadge: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  hrErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  hrErrorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  hrButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  hrButtonText: {
    fontSize: 15,
  },
  deviceListWrap: {
    marginTop: 12,
  },
  availableSensorsLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deviceList: {
    gap: 4,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
});
