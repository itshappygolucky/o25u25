import { View, StyleSheet, useWindowDimensions, Text } from "react-native";

const CHART_SIZE = 280;
const PADDING = 44;
const MIN_BPM = 60;
const MAX_BPM = 200;

export type HrPerKmPoint = { km: number; avgBpm: number };

type HeartRateChartByKmProps = {
  points: HrPerKmPoint[];
  avgBpm: number;
  maxBpm: number;
  accentColor?: string;
  labelColor?: string;
};

export default function HeartRateChartByKm({
  points,
  avgBpm,
  maxBpm,
  accentColor = "#dc2626",
  labelColor = "rgba(128,128,128,0.9)",
}: HeartRateChartByKmProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, CHART_SIZE);
  const chartHeight = Math.min(200, Math.max(120, points.length * 24));

  if (points.length === 0) {
    return (
      <View style={[styles.container, { width: chartWidth }]}>
        <View style={[styles.placeholder, { height: chartHeight }]} />
      </View>
    );
  }

  const bpmValues = points.map((p) => p.avgBpm);
  const minBpm = Math.max(MIN_BPM, Math.min(...bpmValues) - 5);
  const maxBpmRange = Math.min(MAX_BPM, Math.max(...bpmValues) + 5);
  const bpmRange = maxBpmRange - minBpm || 1;
  const maxKm = points.length;
  const graphW = chartWidth - PADDING * 2;
  const graphH = chartHeight - PADDING * 2;

  const toX = (bpm: number) =>
    PADDING + ((bpm - minBpm) / bpmRange) * graphW;
  const toY = (km: number) =>
    PADDING + ((maxKm - km) / (maxKm || 1)) * graphH;

  const pts = points.map((p) => ({
    x: toX(p.avgBpm),
    y: toY(p.km),
    km: p.km,
    bpm: p.avgBpm,
  }));

  return (
    <View style={[styles.container, { width: chartWidth }]}>
      <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
        {points.length <= 8 &&
          points.map((p) => (
            <Text
              key={`y-${p.km}`}
              style={[
                styles.axisLabel,
                { color: labelColor, left: 0, top: toY(p.km) - 8 },
              ]}
            >
              {p.km} km
            </Text>
          ))}
        <Text
          style={[
            styles.axisLabel,
            { color: labelColor, bottom: 0, left: PADDING },
          ]}
        >
          {minBpm} bpm
        </Text>
        <Text
          style={[
            styles.axisLabel,
            { color: labelColor, bottom: 0, right: PADDING },
          ]}
        >
          {maxBpmRange} bpm
        </Text>
        {pts.map((p, i) => {
          if (i === 0) return null;
          const prev = pts[i - 1]!;
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
        {pts.map((p) => (
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
          Avg HR: {Math.round(avgBpm)} bpm
        </Text>
        <Text style={[styles.dataLabel, { color: labelColor }]}>
          Max HR: {Math.round(maxBpm)} bpm
        </Text>
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
