import React, { useMemo } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const daysBetweenN = (a, b) =>
  Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

export default function NotificationsScreen({ route }) {
  const low = route?.params?.low || [];
  const expiring = route?.params?.expiring || [];

  const totalAlerts = low.length + expiring.length;

  const allAlerts = useMemo(() => {
    const alerts = [
      ...low.map((p) => ({
        id: p.id,
        type: "low",
        name: p.name,
        quantity: p.quantity,
        icon: "alert-circle-outline",
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "rgba(239, 68, 68, 0.3)",
        message: `Apenas ${p.quantity} unidade(s) em estoque`,
      })),
      ...expiring.map((p) => ({
        id: p.id,
        type: "expiring",
        name: p.name,
        days: p.expiry
          ? daysBetweenN(
              p.expiry.toDate ? p.expiry.toDate() : new Date(p.expiry),
              new Date()
            )
          : "?",
        icon: "calendar-alert",
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.15)",
        borderColor: "rgba(245, 158, 11, 0.3)",
        message: (days) => `Vence em ${days} dia(s)`,
      })),
    ];
    return alerts.sort((a, b) => {
      // Priorizar alertas críticos (low stock) primeiro
      if (a.type === "low" && b.type !== "low") return -1;
      if (a.type !== "low" && b.type === "low") return 1;
      return 0;
    });
  }, [low, expiring]);

  return (
    <LinearGradient
      colors={["#050F1B", "#0F172A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.12)",
            paddingHorizontal: 16,
            paddingTop: 45,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
            NOTIFICAÇÕES
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
            {totalAlerts} alerta(s) ativo(s)
          </Text>
        </View>

        {/* Alerts List */}
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={allAlerts}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={48}
                color="rgba(37, 211, 102, 0.6)"
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginTop: 16,
                }}
              >
                Tudo em ordem!
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: 8,
                }}
              >
                Nenhuma notificação pendente
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: item.bgColor,
                borderWidth: 1,
                borderColor: item.borderColor,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Icon Container */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: item.color + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.color}
                />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {item.type === "low"
                    ? item.message
                    : item.message(item.days)}
                </Text>
              </View>

              {/* Badge */}
              <View
                style={{
                  backgroundColor: item.color,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  minWidth: 40,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {item.type === "low"
                    ? item.quantity
                    : `${item.days}d`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </LinearGradient>
  );
}
