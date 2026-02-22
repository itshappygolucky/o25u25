import { View, StyleSheet, useWindowDimensions } from "react-native";
import type { HeartRateSample } from "../lib/types";

const GRAPH_HEIGHT = 72;
const MIN_BPM = 60;
const MAX_BPM = 200;
const MAX_BARS = 80;

type HeartRateGraphProps = {
  samples: HeartRateSample[];
  accentColor?: string;
};

function downsample(samples: HeartRateSample[], maxPoints: number): HeartRateSample[] {
  if (samples.length <= maxPoints) return samples;
  const step = samples.length / maxPoints;
  const out: HeartRateSample[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), samples.length - 1);
    out.push(samples[idx]);
  }
  return out;
}

export default function HeartRateGraph({
  samples,
  accentColor = "#dc2626",
}: HeartRateGraphProps) {
  const { width } = useWindowDimensions();
  const padding = 24;
  const graphWidth = Math.min(width - padding * 2, 400);

  if (samples.length < 2) {
    return (
      <View style={[styles.container, { width: graphWidth }]}>
        <View style={[styles.placeholder, { height: GRAPH_HEIGHT }]} />
      </View>
    );
  }

  const points = downsample(samples, MAX_BARS);
  const bpmValues = points.map((s) => s.bpm);
  const minBpm = Math.max(MIN_BPM, Math.min(...bpmValues) - 5);
  const maxBpm = Math.min(MAX_BPM, Math.max(...bpmValues) + 5);
  const range = maxBpm - minBpm || 1;
  const barWidth = graphWidth / points.length;

  return (
    <View style={[styles.container, { width: graphWidth }]}>
      <View style={[styles.graph, { height: GRAPH_HEIGHT }]}>
        {points.map((s, i) => {
          const normalized = (s.bpm - minBpm) / range;
          const barHeight = Math.max(2, normalized * GRAPH_HEIGHT);
          return (
            <View
              key={`${s.timestamp}-${i}`}
              style={[
                styles.bar,
                {
                  width: Math.max(1, barWidth - 1),
                  height: barHeight,
                  backgroundColor: accentColor,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginTop: 12,
  },
  graph: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  bar: {
    borderRadius: 1,
  },
  placeholder: {
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 8,
    width: "100%",
  },
});
