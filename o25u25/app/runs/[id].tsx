import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../lib/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getRunById } from "../../lib/db";
import {
  getSplitsWithHeartRate,
  type SplitWithHr,
} from "../../lib/pathDistance";
import type { Run } from "../../lib/types";
import RunMap from "../components/RunMap";
import HeartRateChartByKm from "../components/HeartRateChartByKm";
import PaceChart from "../components/PaceChart";

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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export default function RunDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id != null ? Number(params.id) : NaN;
  const [run, setRun] = useState<Run | null>(null);
  const { width } = useWindowDimensions();
  const mapHeight = Math.min((width - 48) * 0.6, 200);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    getRunById(id).then(setRun);
  }, [id]);

  if (run == null) {
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
          <Text style={[styles.title, { color: theme.text }]}>Run</Text>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading…
          </Text>
        </View>
      </View>
    );
  }

  const splitsWithHr: SplitWithHr[] = getSplitsWithHeartRate(
    run.path,
    run.heartRateSamples
  );
  const splits = splitsWithHr;
  const maxPaceInSplits =
    splits.length > 0
      ? Math.max(...splits.map((s) => s.paceMinPerKm))
      : 1;
  const hrPointsFromSplits = splits
    .filter((s): s is SplitWithHr & { avgHeartRate: number } =>
      s.avgHeartRate != null
    )
    .map((s) => ({ km: s.km, avgBpm: s.avgHeartRate }));
  const overallAvgHr =
    run.avgHeartRate ??
    (hrPointsFromSplits.length > 0
      ? hrPointsFromSplits.reduce((a, p) => a + p.avgBpm, 0) /
        hrPointsFromSplits.length
      : 0);
  const overallMaxHr =
    run.heartRateSamples.length > 0
      ? Math.max(...run.heartRateSamples.map((s) => s.bpm))
      : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
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
        <Text style={[styles.title, { color: theme.text }]}>
          {formatDate(run.startTime)}
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            Duration
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatDuration(run.durationSeconds)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            Distance
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {(run.distanceKm * 1000).toFixed(0)} m
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            Avg pace
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatPace(run.paceMinPerKm)}
          </Text>
        </View>
        {run.avgHeartRate != null && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              Avg heart rate
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {Math.round(run.avgHeartRate)} bpm
            </Text>
          </View>
        )}
      </View>

      {run.path.length >= 2 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Route</Text>
          <View style={[styles.mapWrap, { height: mapHeight }]}>
            <RunMap path={run.path} />
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Splits (per km)
      </Text>
      <View style={[styles.splitsCard, { backgroundColor: theme.surface }]}>
        {splits.length > 0 ? (
          <>
            <View
              style={[
                styles.splitsHeader,
                { borderBottomColor: theme.textMuted },
              ]}
            >
              <Text
                style={[styles.splitsHeaderCell, { color: theme.textMuted }]}
              >
                Km
              </Text>
              <Text
                style={[
                  styles.splitsHeaderCell,
                  styles.splitsPace,
                  { color: theme.textMuted },
                ]}
              >
                Pace
              </Text>
              <View style={styles.splitsBarHeader} />
              <Text
                style={[styles.splitsHeaderCell, { color: theme.textMuted }]}
              >
                Avg HR
              </Text>
            </View>
            {splits.map((s) => {
              const barWidthPct =
                maxPaceInSplits > 0
                  ? (s.paceMinPerKm / maxPaceInSplits) * 100
                  : 0;
              return (
                <View
                  key={s.km}
                  style={[
                    styles.splitsRow,
                    { borderBottomColor: theme.textMuted },
                  ]}
                >
                  <Text style={[styles.splitsCell, styles.splitsKm, { color: theme.text }]}>
                    {s.km}
                  </Text>
                  <Text style={[styles.splitsCell, styles.splitsPace, { color: theme.text }]}>
                    {formatPace(s.paceMinPerKm)}
                  </Text>
                  <View style={styles.splitsBarWrap}>
                    <View
                      style={[
                        styles.splitsBar,
                        {
                          width: `${Math.min(100, barWidthPct)}%`,
                          backgroundColor: theme.icon,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.splitsCell, styles.splitsHr, { color: theme.text }]}
                  >
                    {s.avgHeartRate != null
                      ? `${Math.round(s.avgHeartRate)}`
                      : "—"}
                  </Text>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={[styles.dataUnavailable, { color: theme.textMuted }]}>
            Data not available. Need at least 1 km of distance for splits.
          </Text>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Pace (line: pace vs km)
      </Text>
      <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
        {splits.length > 0 ? (
          <PaceChart
            splits={splits}
            durationSeconds={run.durationSeconds}
            avgPaceMinPerKm={run.paceMinPerKm}
            accentColor={theme.icon}
            labelColor={theme.textMuted}
          />
        ) : (
          <Text style={[styles.dataUnavailable, { color: theme.textMuted }]}>
            Data not available.
          </Text>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Heart rate (bpm vs km)
      </Text>
      <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
        {hrPointsFromSplits.length > 0 ? (
          <HeartRateChartByKm
            points={hrPointsFromSplits}
            avgBpm={overallAvgHr}
            maxBpm={overallMaxHr}
            accentColor={theme.icon}
            labelColor={theme.textMuted}
          />
        ) : (
          <Text style={[styles.dataUnavailable, { color: theme.textMuted }]}>
            Data not available.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  mapWrap: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  splitsCard: {
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  splitsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  splitsHeaderCell: {
    fontSize: 13,
    fontWeight: "600",
  },
  splitsBarHeader: {
    width: 80,
  },
  splitsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  splitsCell: {
    fontSize: 16,
  },
  splitsKm: {
    width: 28,
  },
  splitsPace: {
    width: 72,
  },
  splitsBarWrap: {
    width: 80,
    height: 14,
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
  },
  splitsBar: {
    height: "100%",
    borderRadius: 4,
  },
  splitsHr: {
    width: 44,
    textAlign: "right",
  },
  chartCard: {
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  dataUnavailable: {
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
});
