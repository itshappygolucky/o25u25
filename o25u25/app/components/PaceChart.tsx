import { View, StyleSheet, useWindowDimensions, Text } from "react-native";
import type { KmSplit } from "../lib/pathDistance";

const CHART_SIZE = 280;
const PADDING = 40;
const MIN_PACE = 3;
const MAX_PACE = 12;

type PaceChartProps = {
  splits: KmSplit[];
  durationSeconds: number;
  avgPaceMinPerKm: number;
  accentColor?: string;
  labelColor?: string;
};

function formatPace(minPerKm: number): string {
  if (minPerKm <= 0) return "—";
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PaceChart({
  splits,
  durationSeconds,
  avgPaceMinPerKm,
  accentColor = "#2563eb",
  labelColor = "rgba(128,128,128,0.9)",
}: PaceChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, CHART_SIZE);
  const chartHeight = Math.min(200, Math.max(120, splits.length * 24));

  if (splits.length === 0) {
    return (
      <View style={[styles.container, { width: chartWidth }]}>
        <View style={[styles.placeholder, { height: chartHeight }]} />
      </View>
    );
  }

  const paces = splits.map((s) => s.paceMinPerKm);
  const minPace = Math.max(MIN_PACE, Math.min(...paces) - 0.5);
  const maxPace = Math.min(MAX_PACE, Math.max(...paces) + 0.5);
  const paceRange = maxPace - minPace || 1;
  const maxKm = splits.length;
  const graphW = chartWidth - PADDING * 2;
  const graphH = chartHeight - PADDING * 2;

  const toX = (pace: number) =>
    PADDING + ((pace - minPace) / paceRange) * graphW;
  const toY = (km: number) =>
    PADDING + ((maxKm - km) / (maxKm || 1)) * graphH;

  const points = splits.map((s) => ({
    x: toX(s.paceMinPerKm),
    y: toY(s.km),
    km: s.km,
    pace: s.paceMinPerKm,
  }));

  const fastestSplit =
    splits.length > 0
      ? splits.reduce((a, b) =>
          a.paceMinPerKm <= b.paceMinPerKm ? a : b
        )
      : null;

  return (
    <View style={[styles.container, { width: chartWidth }]}>
      <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
        {/* Y axis labels (km) */}
        {splits.length <= 8 &&
          splits.map((s) => (
            <Text
              key={`y-${s.km}`}
              style={[styles.axisLabel, { color: labelColor, left: 0, top: toY(s.km) - 8 }]}
            >
              {s.km} km
            </Text>
          ))}
        {/* X axis labels (pace) */}
        <Text
          style={[
            styles.axisLabel,
            { color: labelColor, bottom: 0, left: PADDING },
          ]}
        >
          {formatPace(minPace)}
        </Text>
        <Text
          style={[
            styles.axisLabel,
            { color: labelColor, bottom: 0, right: PADDING },
          ]}
        >
          {formatPace(maxPace)}
        </Text>
        {/* Line segments */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1]!;
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <View
              key={`seg-${p.km}`}
              style={[
                styles.lineSeg,
                {
                  width: len,
                  left: prev.x,
                  top: prev.y,
                  backgroundColor: accentColor,
                  transform: [
                    { translateX: -len / 2 },
                    { translateY: -1 },
                    { rotate: `${angleDeg}deg` },
                    { translateX: len / 2 },
                    { translateY: 1 },
                  ],
                },
              ]}
            />
          );
        })}
        {/* Points */}
        {points.map((p) => (
          <View
            key={`pt-${p.km}`}
            style={[
              styles.point,
              {
                left: p.x - 4,
                top: p.y - 4,
                backgroundColor: accentColor,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.dataRow}>
        <Text style={[styles.dataLabel, { color: labelColor }]}>
          Elapsed: {formatDuration(durationSeconds)}
        </Text>
        <Text style={[styles.dataLabel, { color: labelColor }]}>
          Avg pace: {formatPace(avgPaceMinPerKm)}/km
        </Text>
        {fastestSplit && (
          <Text style={[styles.dataLabel, { color: labelColor }]}>
            Fastest: km {fastestSplit.km} {formatPace(fastestSplit.paceMinPerKm)}/km
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginTop: 8,
  },
  chart: {
    position: "relative",
  },
  lineSeg: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
  },
  point: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  axisLabel: {
    position: "absolute",
    fontSize: 10,
  },
  placeholder: {
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 8,
    width: "100%",
  },
  dataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  dataLabel: {
    fontSize: 13,
  },
});
