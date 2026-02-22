import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getRuns } from "../lib/db";
import type { Run } from "../lib/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPace(paceMinPerKm: number): string {
  if (paceMinPerKm <= 0) return "—";
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export default function RunsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    getRuns().then(setRuns);
  }, []);

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
        <Text style={[styles.title, { color: theme.text }]}>Previous runs</Text>
      </View>

      {runs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No runs yet. Start a run from the home screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/runs/${item.id}`)}
              style={({ pressed }) => [
                styles.runCard,
                { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.runDate, { color: theme.textMuted }]}>
                {formatDate(item.startTime)}
              </Text>
              <View style={styles.runRow}>
                <Text style={[styles.runStat, { color: theme.text }]}>
                  {formatDuration(item.durationSeconds)}
                </Text>
                <Text style={[styles.runStat, { color: theme.text }]}>
                  {(item.distanceKm * 1000).toFixed(0)} m
                </Text>
                <Text style={[styles.runStat, { color: theme.textMuted }]}>
                  {formatPace(item.paceMinPerKm)} avg
                </Text>
                {item.avgHeartRate != null && (
                  <Text style={[styles.runStat, { color: theme.textMuted }]}>
                    {Math.round(item.avgHeartRate)} bpm
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
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
    marginBottom: 24,
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
  list: {
    paddingBottom: 24,
  },
  runCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  runDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  runRow: {
    flexDirection: "row",
    gap: 20,
  },
  runStat: {
    fontSize: 17,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
