import { View, Text, StyleSheet } from "react-native";
import type { PathPoint } from "../lib/types";

type RunMapProps = {
  path?: PathPoint[];
};

/** Placeholder for map (react-native-maps-osmdroid removed for now; can add back later). */
export default function RunMap({ path = [] }: RunMapProps) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.label}>Map (coming back later)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
});
