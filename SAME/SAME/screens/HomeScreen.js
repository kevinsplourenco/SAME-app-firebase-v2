import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  TextInput as RNTextInput,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Appbar,
  Card,
  Text,
  Avatar,
  Chip,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { query, orderBy, onSnapshot } from "firebase/firestore";
import { userCol } from "../firebase";
import NotificationBell from "../components/NotificationBell";
import RSSParser from "react-native-rss-parser";

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = (screenWidth - 48) / 2;
const LOW_STOCK_THRESHOLD = 5;
const EXPIRY_DAYS_THRESHOLD = 7;

const daysBetween = (a, b) =>
  Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !UIManager.isNewArchitectureEnabled?.()
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MetricCard = ({ title, value, icon, color = "#6E56CF" }) => (
  <Card
    style={{
      flex: 1,
      marginBottom: 12,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
      elevation: 0,
    }}
  >
    <Card.Content style={{ paddingTop: 16, paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            backgroundColor: `${color}25`,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: `${color}40`,
          }}
        >
          <Avatar.Icon
            icon={icon}
            size={28}
            style={{ backgroundColor: "transparent", color }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.6)",
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>
            {value}
          </Text>
        </View>
      </View>
    </Card.Content>
  </Card>
);

const ExpandableCard = ({ title, icon, children, width }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
      <Card
        style={{
          width,
          marginBottom: 16,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          elevation: 0,
        }}
      >
        <View style={{ overflow: "hidden", borderRadius: 12 }}>
          <Card.Title
            title={title}
            left={(p) => (
              <Avatar.Icon
                {...p}
                icon={icon}
                style={{ backgroundColor: "rgba(110, 86, 207, 0.3)" }}
              />
            )}
            titleStyle={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}
          />
          {expanded && (
            <Card.Content style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
              {children}
            </Card.Content>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("user_notes");
      if (saved) setNotes(JSON.parse(saved));
    })();
  }, []);

  const handleAddNote = async () => {
    if (newNote.trim()) {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const updatedNotes = [...notes, { id: uniqueId, text: newNote }];
      setNotes(updatedNotes);
      await AsyncStorage.setItem("user_notes", JSON.stringify(updatedNotes));
      setNewNote("");
    }
  };

  const handleDeleteNote = async (id) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    await AsyncStorage.setItem("user_notes", JSON.stringify(updatedNotes));
  };

  useEffect(() => {
    const q = query(userCol("products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(userCol("sales"), orderBy("at", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSales(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchNews = async () => {
      try {
        setLoadingNews(true);
        const res = await fetch("https://agenciasebrae.com.br/feed/");
        const text = await res.text();
        const parsed = await RSSParser.parse(text);
        if (!mounted) return;
        setNews(parsed.items.slice(0, 2));
      } catch {
        if (mounted) setNews([]);
      } finally {
        if (mounted) setLoadingNews(false);
      }
    };
    fetchNews();
    return () => {
      mounted = false;
    };
  }, []);

  const { low, expiring } = useMemo(() => {
    const now = new Date();
    const low = products.filter((p) => (p.quantity || 0) <= LOW_STOCK_THRESHOLD);
    const expiring = products.filter((p) => {
      if (!p.expiry) return false;
      const d = p.expiry.toDate ? p.expiry.toDate() : new Date(p.expiry);
      return daysBetween(d, now) <= EXPIRY_DAYS_THRESHOLD;
    });
    return { low, expiring };
  }, [products]);

  const totalAlerts = low.length + expiring.length;

  const salesData = useMemo(() => {
    if (sales.length === 0) {
      return {
        labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
        legend: ["Sem dados de vendas"],
      };
    }

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const totals = Array(7).fill(0);

    sales.forEach((s) => {
      const date = s.at?.toDate ? s.at.toDate() : new Date(s.at);
      const day = date.getDay();
      totals[day] += s.total || 0;
    });

    const rotatedLabels = [...weekDays.slice(1), weekDays[0]];
    const rotatedTotals = [...totals.slice(1), totals[0]];

    return {
      labels: rotatedLabels,
      datasets: [{ data: rotatedTotals }],
      legend: ["Vendas da Semana"],
    };
  }, [sales]);

  const { topWeek, topDay, topMonth } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const getProductName = (id) =>
      products.find((p) => p.id === id)?.name || "Produto";

    const daySales = sales.filter((s) => {
      const d = s.at?.toDate ? s.at.toDate() : new Date(s.at);
      return d.toDateString() === now.toDateString();
    });

    const weekSales = sales.filter((s) => {
      const d = s.at?.toDate ? s.at.toDate() : new Date(s.at);
      return d >= sevenDaysAgo;
    });

    const monthSales = sales.filter((s) => {
      const d = s.at?.toDate ? s.at.toDate() : new Date(s.at);
      return d >= thirtyDaysAgo;
    });

    const calcRanking = (list) => {
      const counts = {};
      list.forEach((s) => {
        const name = getProductName(s.productId);
        counts[name] = (counts[name] || 0) + (s.qty || 1);
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    };

    return {
      topDay: calcRanking(daySales),
      topWeek: calcRanking(weekSales),
      topMonth: calcRanking(monthSales),
    };
  }, [sales, products]);

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
            paddingTop: 43,
            paddingBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
              HOME
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
              Bem-vindo de volta!
            </Text>
          </View>
          <NotificationBell
            count={totalAlerts}
            onPress={() => setShowNotificationModal(true)}
          />
        </View>

        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            <>
              {/* Metrics Row */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Resumo
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <MetricCard
                    title="Produtos"
                    value={String(products.length)}
                    icon="cube-outline"
                    color="#6E56CF"
                  />
                  <MetricCard
                    title="Vendas"
                    value={String(sales.length)}
                    icon="cart"
                    color="#0EA5E9"
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <MetricCard
                    title="Alertas"
                    value={String(totalAlerts)}
                    icon="alert-circle-outline"
                    color="#F59E0B"
                  />
                  <MetricCard
                    title="Em Falta"
                    value={String(low.length)}
                    icon="alert-outline"
                    color="#EF4444"
                  />
                </View>
              </View>

              {/* News Section */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Notícias
                </Text>
                <ExpandableCard
                  title="Notícias do Sebrae"
                  icon="newspaper-variant-outline"
                  width={screenWidth - 32}
                >
                  {loadingNews ? (
                    <ActivityIndicator
                      animating
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  ) : news.length === 0 ? (
                    <Text style={{ color: "#FFFFFF" }}>
                      Sem notícias disponíveis
                    </Text>
                  ) : (
                    news.map((item, idx) => (
                      <View key={`news-${item.title}-${idx}`} style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#FFFFFF",
                            marginBottom: 4,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 12,
                            color: "rgba(255, 255, 255, 0.6)",
                            marginBottom: 8,
                          }}
                        >
                          {item.contentSnippet ||
                            item.description ||
                            "Sem descrição disponível."}
                        </Text>
                        <Button
                          mode="text"
                          compact
                          labelStyle={{ fontSize: 11, color: "#0EA5E9" }}
                          onPress={() =>
                            Linking.openURL(
                              item.links?.[0]?.url || item.link || ""
                            )
                          }
                        >
                          Ler mais →
                        </Button>
                      </View>
                    ))
                  )}
                </ExpandableCard>
              </View>

              {/* Notes Section */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Anotações
                </Text>
                <ExpandableCard
                  title="Minhas Anotações"
                  icon="note-text-outline"
                  width={screenWidth - 32}
                >
                  <View style={{ gap: 12 }}>
                    {/* Input para adicionar nova nota */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <RNTextInput
                        value={newNote}
                        onChangeText={setNewNote}
                        placeholder="Adicionar nota..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          color: "#FFFFFF",
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: "rgba(255, 255, 255, 0.12)",
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontFamily: "System",
                          fontSize: 13,
                        }}
                      />
                      <TouchableOpacity
                        onPress={handleAddNote}
                        style={{
                          backgroundColor: "#6E56CF",
                          borderRadius: 6,
                          justifyContent: "center",
                          alignItems: "center",
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Lista de notas */}
                    <View style={{ paddingHorizontal: 8 }}>
                      {notes.length === 0 ? (
                        <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13 }}>
                          Nenhuma nota ainda
                        </Text>
                      ) : (
                        notes.map((note) => (
                          <View
                            key={note.id}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.12)",
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              marginBottom: 8,
                            }}
                          >
                            <Text
                              style={{
                                flex: 1,
                                color: "#FFFFFF",
                                fontSize: 13,
                                fontWeight: "500",
                              }}
                              numberOfLines={2}
                            >
                              {note.text}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleDeleteNote(note.id)}
                              style={{
                                padding: 4,
                              }}
                            >
                              <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>
                                ✕
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </ExpandableCard>
              </View>

              {/* Alerts Section */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Alertas
                </Text>
                <ExpandableCard
                  title="Itens com Alerta"
                  icon="alert-circle-outline"
                  width={screenWidth - 32}
                >
                  <View style={{ gap: 16 }}>
                    {/* Próximos de acabar */}
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "rgba(255, 255, 255, 0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Próximos de acabar
                      </Text>
                      {low.length === 0 ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                          Nenhum item crítico
                        </Text>
                      ) : (
                        low.map((p) => (
                          <Chip
                            key={p.id}
                            icon="cube-outline"
                            style={{
                              marginVertical: 4,
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(239, 68, 68, 0.4)",
                            }}
                            textStyle={{ color: "#FFFFFF", fontSize: 12 }}
                          >
                            {p.name} · {p.quantity} un
                          </Chip>
                        ))
                      )}
                    </View>

                    {/* Vencendo em breve */}
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "rgba(255, 255, 255, 0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Vencendo em breve
                      </Text>
                      {expiring.length === 0 ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                          Sem vencimentos
                        </Text>
                      ) : (
                        expiring.map((p) => (
                          <Chip
                            key={p.id}
                            icon="calendar"
                            style={{
                              marginVertical: 4,
                              backgroundColor: "rgba(245, 158, 11, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(245, 158, 11, 0.4)",
                            }}
                            textStyle={{ color: "#FFFFFF", fontSize: 12 }}
                          >
                            {p.name} ·{" "}
                            {p.expiry
                              ? daysBetween(
                                  p.expiry.toDate
                                    ? p.expiry.toDate()
                                    : new Date(p.expiry),
                                  new Date()
                                )
                              : "?"}
                            d
                          </Chip>
                        ))
                      )}
                    </View>
                  </View>
                </ExpandableCard>
              </View>

              {/* Chart Section */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Vendas
                </Text>
                <ExpandableCard
                  title="Vendas da Semana"
                  icon="chart-line"
                  width={screenWidth - 32}
                >
                  <View style={{ gap: 12 }}>
                    {salesData.datasets[0].data.every(v => v === 0) ? (
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13, textAlign: "center" }}>
                        Sem dados de vendas
                      </Text>
                    ) : (
                      <>
                        {/* Timeline de vendas */}
                        <View style={{ gap: 10 }}>
                          {salesData.labels.map((label, idx) => {
                            const value = salesData.datasets[0].data[idx];
                            const maxValue = Math.max(...salesData.datasets[0].data);
                            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                            
                            return (
                              <View key={`sales-${label}-${idx}`} style={{ gap: 4 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontWeight: "600", minWidth: 30 }}>
                                    {label}
                                  </Text>
                                  <Text style={{ color: "#6E56CF", fontSize: 12, fontWeight: "700" }}>
                                    {value > 0 ? "R$ " + value.toFixed(0) : "-"}
                                  </Text>
                                </View>
                                <View
                                  style={{
                                    height: 8,
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                  }}
                                >
                                  <View
                                    style={{
                                      height: "100%",
                                      width: `${percentage}%`,
                                      backgroundColor: "#6E56CF",
                                      borderRadius: 4,
                                    }}
                                  />
                                </View>
                              </View>
                            );
                          })}
                        </View>

                        {/* Resumo */}
                        <View
                          style={{
                            backgroundColor: "rgba(110, 86, 207, 0.15)",
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "rgba(110, 86, 207, 0.3)",
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            marginTop: 8,
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, marginBottom: 4 }}>
                                Total da Semana
                              </Text>
                              <Text style={{ color: "#6E56CF", fontSize: 18, fontWeight: "700" }}>
                                R$ {salesData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(0)}
                              </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, marginBottom: 4 }}>
                                Média Diária
                              </Text>
                              <Text style={{ color: "#0EA5E9", fontSize: 18, fontWeight: "700" }}>
                                R$ {(salesData.datasets[0].data.reduce((a, b) => a + b, 0) / 7).toFixed(0)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </ExpandableCard>
              </View>

              {/* Top Products Section */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Top Produtos
                </Text>
                <ExpandableCard
                  title="Produtos Mais Vendidos"
                  icon="chart-bar"
                  width={screenWidth - 32}
                >
                  <View style={{ gap: 16 }}>
                    {/* Mais vendidos hoje */}
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "rgba(255, 255, 255, 0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Hoje
                      </Text>
                      {topDay.length === 0 ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                          Sem vendas hoje
                        </Text>
                      ) : (
                        topDay.map(([name, qty], idx) => (
                          <Text
                            key={`topDay-${name}-${qty}`}
                            style={{
                              fontSize: 13,
                              marginBottom: 6,
                              color: "#FFFFFF",
                            }}
                          >
                            <Text style={{ fontWeight: "700", color: "#0EA5E9" }}>
                              {idx + 1}.{" "}
                            </Text>
                            <Text style={{ color: "#FFFFFF" }}>{name} — </Text>
                            <Text style={{ fontWeight: "600", color: "#FFFFFF" }}>{qty}</Text>
                            <Text style={{ color: "#FFFFFF" }}> un</Text>
                          </Text>
                        ))
                      )}
                    </View>

                    {/* Mais vendidos da semana */}
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "rgba(255, 255, 255, 0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Semana
                      </Text>
                      {topWeek.length === 0 ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                          Sem vendas na semana
                        </Text>
                      ) : (
                        topWeek.map(([name, qty], idx) => (
                          <Text
                            key={`topWeek-${name}-${qty}`}
                            style={{
                              fontSize: 13,
                              marginBottom: 6,
                              color: "#FFFFFF",
                            }}
                          >
                            <Text style={{ fontWeight: "700", color: "#6E56CF" }}>
                              {idx + 1}.{" "}
                            </Text>
                            <Text style={{ color: "#FFFFFF" }}>{name} — </Text>
                            <Text style={{ fontWeight: "600", color: "#FFFFFF" }}>{qty}</Text>
                            <Text style={{ color: "#FFFFFF" }}> un</Text>
                          </Text>
                        ))
                      )}
                    </View>

                    {/* Mais vendidos do mês */}
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "rgba(255, 255, 255, 0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Mês
                      </Text>
                      {topMonth.length === 0 ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                          Sem vendas no mês
                        </Text>
                      ) : (
                        topMonth.map(([name, qty], idx) => (
                          <Text
                            key={`topMonth-${name}-${qty}`}
                            style={{
                              fontSize: 13,
                              marginBottom: 6,
                              color: "#FFFFFF",
                            }}
                          >
                            <Text style={{ fontWeight: "700", color: "#F59E0B" }}>
                              {idx + 1}.{" "}
                            </Text>
                            <Text style={{ color: "#FFFFFF" }}>{name} — </Text>
                            <Text style={{ fontWeight: "600", color: "#FFFFFF" }}>{qty}</Text>
                            <Text style={{ color: "#FFFFFF" }}> un</Text>
                          </Text>
                        ))
                      )}
                    </View>
                  </View>
                </ExpandableCard>
              </View>
            </>
          }
          data={[]}
          renderItem={null}
        />
      </View>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-start",
            paddingTop: 60,
          }}
        >
          <View
            style={{
              backgroundColor: "#0F172A",
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16,
              maxHeight: "80%",
              marginHorizontal: 12,
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Header do Modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                Notificações
              </Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Text style={{ fontSize: 24, color: "#FFFFFF", fontWeight: "300" }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            <FlatList
              scrollEnabled
              data={[
                ...low.map((p) => ({
                  id: p.id,
                  type: "low",
                  name: p.name,
                  quantity: p.quantity,
                })),
                ...expiring.map((p) => ({
                  id: p.id,
                  type: "expiring",
                  name: p.name,
                  expiry: p.expiry,
                })),
              ]}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: 14,
                    textAlign: "center",
                    paddingVertical: 24,
                  }}
                >
                  Nenhuma notificação
                </Text>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 13,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: 12,
                        }}
                      >
                        {item.type === "low"
                          ? `Apenas ${item.quantity} unidade(s)`
                          : `Vence em ${daysBetween(
                              item.expiry?.toDate
                                ? item.expiry.toDate()
                                : new Date(item.expiry),
                              new Date()
                            )} dia(s)`}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          item.type === "low" ? "#EF4444" : "#F59E0B",
                        marginLeft: 8,
                      }}
                    />
                  </View>
                </View>
              )}
              style={{ flex: 1 }}
            />

            {/* Botão para ir para central */}
            {totalAlerts > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setShowNotificationModal(false);
                  navigation.navigate("Notifications", { low, expiring });
                }}
                style={{
                  backgroundColor: "#6E56CF",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                  Central de Notificações
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
