import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

const styles = StyleSheet.create({
  appFooter: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#0EA5E9",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  versionText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
});

export default function AuthFooter() {
  return (
    <View style={styles.appFooter}>
      <Text style={styles.footerText}>© 2025 SAME. Todos os direitos reservados.</Text>
      <Text style={styles.versionText}>Versão 1.0</Text>
    </View>
  );
}
