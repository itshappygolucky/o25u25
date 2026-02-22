import { Text, View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../lib/ThemeContext";
import { useTimer } from "../lib/TimerContext";
import RunMap from "./components/RunMap";
import HeartRateGraph from "./components/HeartRateGraph";

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    seconds,
    isRunning,
    playPause,
    stop,
    formattedTime,
    runPath,
    distanceKm,
    currentSplitPaceMinPerKm,
    avgPaceMinPerKm,
    currentBpm,
    avgBpm,
    heartRateSamples,
  } = useTimer();

  const formatPace = (minPerKm: number) => {
    const min = Math.floor(minPerKm);
    const sec = Math.round((minPerKm - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}/km`;
  };

  const showStartRun = runPath.length === 0 && seconds === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={() => router.push("/settings")}
        style={({ pressed }) => [
          styles.settingsButton,
          styles.circleButton,
          {
            top: insets.top + 12,
            backgroundColor: theme.background,
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons name="settings-outline" size={28} color={theme.icon} />
      </Pressable>

      <RunMap path={runPath} />

      <View style={[styles.timerSection, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.timerContent}>
          <Text
            style={{
              fontSize: 72,
              fontWeight: "bold",
              fontVariant: ["tabular-nums"],
              color: theme.text,
            }}
          >
            {formattedTime}
          </Text>

          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: theme.textMuted }]}>
              {(distanceKm * 1000).toFixed(0)} m
            </Text>
            <Text style={[styles.statText, { color: theme.textMuted }]}>
              {avgPaceMinPerKm != null && avgPaceMinPerKm > 0
                ? `${formatPace(avgPaceMinPerKm)} avg`
                : "— avg"}
            </Text>
            <Text style={[styles.statText, { color: theme.textMuted }]}>
              {currentBpm != null ? `${currentBpm} bpm` : "— bpm"}
            </Text>
            <Text style={[styles.statText, { color: theme.textMuted }]}>
              {avgBpm != null ? `${Math.round(avgBpm)} avg hr` : "— avg hr"}
            </Text>
            {currentSplitPaceMinPerKm != null && (
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {formatPace(currentSplitPaceMinPerKm)} split
              </Text>
            )}
          </View>

          {heartRateSamples.length > 0 && (
            <HeartRateGraph
              samples={heartRateSamples}
              accentColor={theme.icon}
            />
          )}

          {showStartRun ? (
            <Pressable
              onPress={playPause}
              style={({ pressed }) => [
                styles.startRunButton,
                {
                  backgroundColor: theme.icon,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="play" size={32} color={theme.background} />
              <Text
                style={[styles.startRunButtonText, { color: theme.background }]}
              >
                Start run
              </Text>
            </Pressable>
          ) : (
            <View style={styles.buttonsRow}>
              <Pressable
                onPress={playPause}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 16,
                })}
              >
                <Ionicons
                  name={isRunning ? "pause" : "play"}
                  size={48}
                  color={theme.icon}
                />
              </Pressable>

              <Pressable
                onPress={stop}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 16,
                })}
              >
                <Ionicons name="stop" size={48} color={theme.icon} />
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/runs")}
            style={({ pressed }) => [
              styles.previousRunsLink,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="list-outline" size={20} color={theme.textMuted} />
            <Text style={[styles.previousRunsText, { color: theme.textMuted }]}>
              Previous runs
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    right: 24,
    zIndex: 2,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timerSection: {
    padding: 24,
    paddingTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContent: {
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  statText: {
    fontSize: 15,
  },
  startRunButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 28,
  },
  startRunButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
    marginTop: 16,
    marginBottom: 28,
  },
  previousRunsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previousRunsText: {
    fontSize: 15,
  },
});
