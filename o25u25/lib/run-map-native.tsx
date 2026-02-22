import { View, StyleSheet } from "react-native";
import type { PathPoint } from "./types";

type RunMapProps = {
  path?: PathPoint[];
};

export default function RunMapNative({ path = [] }: RunMapProps) {
  return <View style={styles.placeholder} />;
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "#e8e8e8",
  },
});
