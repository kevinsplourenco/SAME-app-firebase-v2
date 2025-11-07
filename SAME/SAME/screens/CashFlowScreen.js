import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Platform, TouchableOpacity, Text as RNText } from "react-native";
import { auth } from "../firebase";
import {
  TextInput,
  Button,
  Snackbar,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { userCol } from "../firebase";

// Componente de botões customizado
const CustomSegmentedButtons = ({ value, onValueChange, buttons }) => {
  return (
    <View style={{ flexDirection: "row", gap: 8, backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 8, padding: 6 }}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.value}
          onPress={() => onValueChange(btn.value)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: value === btn.value ? "#6E56CF" : "transparent",
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const currency = (v, hide = false) =>
  hide
    ? "••••"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v || 0);

export default function CashFlowScreen() {
  const [kind, setKind] = useState("entrada");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [when, setWhen] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const [items, setItems] = useState([]);
  const [saleEntries, setSaleEntries] = useState([]);

  const [period, setPeriod] = useState("mes");
  const [hideAmounts, setHideAmounts] = useState(false);
  const [snack, setSnack] = useState(null);
  const [expandedList, setExpandedList] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedForm, setExpandedForm] = useState(true);
  useEffect(() => {
    const q = query(userCol("cashflows"), orderBy("when", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(list);
    });
    return () => unsub();
  }, []);

  // Listener das vendas
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(userCol("sales"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const s = d.data();
        const when = s.at?.toDate ? s.at.toDate() : new Date();

        return {
          id: "sale-" + d.id,
          kind: "entrada",
          label: `Venda (${(s.items?.length || 1)} itens)`,
          amount: Number(s.total || 0),
          when,
          source: "sale",
        };
      });
      setSaleEntries(list);
    });

    return () => unsub();
  }, [auth.currentUser]);

  // Mesclando lançamentos manuais + vendas
  const allItems = useMemo(() => {
    const normCash = items.map((i) => ({
      ...i,
      when: i.when?.toDate ? i.when.toDate() : new Date(i.when),
      source: "manual",
    }));
    return [...normCash, ...saleEntries].sort((a, b) => b.when - a.when);
  }, [items, saleEntries]);

  // Filtro (Dia / Mês / Ano) + Busca
  const filtered = useMemo(() => {
    const now = new Date();
    return allItems.filter((i) => {
      const d = i.when;
      const periodMatch = 
        period === "dia" ? d.toDateString() === now.toDateString() :
        period === "mes" ? d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() :
        d.getFullYear() === now.getFullYear();
      
      const searchMatch = searchFilter === "" || i.label.toLowerCase().includes(searchFilter.toLowerCase());
      
      return periodMatch && searchMatch;
    });
  }, [allItems, period, searchFilter]);

  // Totais (considerando vendas como entrada)
  const totals = useMemo(() => {
    const entrada = filtered
      .filter((i) => i.kind === "entrada")
      .reduce((s, x) => s + x.amount, 0);
    const saida = filtered
      .filter((i) => i.kind === "saida")
      .reduce((s, x) => s + x.amount, 0);
    return { entrada, saida, saldo: entrada - saida };
  }, [filtered]);

  const save = async () => {
    if (!label || !(Number(amount) > 0)) {
      setSnack("Preencha descrição e valor > 0");
      return;
    }
    try {
      await addDoc(userCol("cashflows"), {
        kind,
        label,
        amount: Number(amount),
        when: Timestamp.fromDate(when),
        createdAt: serverTimestamp(),
      });
      setLabel("");
      setAmount("");
      setWhen(new Date());
      setSnack("Lançamento adicionado");
    } catch (e) {
      setSnack("Erro: " + e.message);
    }
  };

  return (
    <LinearGradient colors={["#050F1B", "#0F172A"]} style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255, 255, 255, 0.12)",
              paddingHorizontal: 16,
              paddingTop: 43,
              paddingBottom: 12,
            }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
                FLUXO DE CAIXA
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                Controle suas entradas e saídas
              </Text>
            </View>

            {/* Novo Lançamento */}
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 24,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setExpandedForm(!expandedForm)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: expandedForm ? 12 : 0 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="plus-circle" size={24} color="#0EA5E9" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                    Novo Lançamento
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={expandedForm ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {expandedForm && (
                <>
                  <CustomSegmentedButtons
                    value={kind}
                    onValueChange={setKind}
                    buttons={[
                      { value: "entrada", label: "Entrada" },
                      { value: "saida", label: "Saída" },
                    ]}
                  />

                  <TextInput
                    label="Descrição"
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Ex: Venda à vista"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", marginBottom: 12, marginTop: 12 }}
                    textColor="#FFFFFF"
                    activeUnderlineColor="#6E56CF"
                    labelStyle={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}
                    underlineColor="rgba(255, 255, 255, 0.2)"
                    mode="flat"
                  />

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <TextInput
                  label="Valor (R$)"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  textColor="#FFFFFF"
                  activeUnderlineColor="#6E56CF"
                  labelStyle={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}
                  underlineColor="rgba(255, 255, 255, 0.2)"
                  mode="flat"
                />
                <TextInput
                  label="Data"
                  value={when.toLocaleDateString("pt-BR")}
                  onFocus={() => setShowDate(true)}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  textColor="#FFFFFF"
                  activeUnderlineColor="#6E56CF"
                  labelStyle={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}
                  underlineColor="rgba(255, 255, 255, 0.2)"
                  mode="flat"
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => setShowDate(true)}
                      color="#6E56CF"
                    />
                  }
                />
              </View>

              {showDate && (
                <DateTimePicker
                  value={when}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, d) => {
                    setShowDate(Platform.OS === "ios");
                    if (d) setWhen(d);
                  }}
                />
              )}

              <Button
                mode="contained"
                onPress={save}
                icon="plus"
                style={{ backgroundColor: "#0EA5E9", borderRadius: 8 }}
                labelStyle={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}
              >
                Adicionar
              </Button>
                </>
              )}
            </View>

            {/* Filtro por período */}
            <View style={{ marginHorizontal: 16, marginBottom: 24, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MaterialCommunityIcons name="calendar-range" size={20} color="#F59E0B" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255, 255, 255, 0.7)" }}>
                  Período
                </Text>
              </View>
              <CustomSegmentedButtons
                value={period}
                onValueChange={setPeriod}
                buttons={[
                  { value: "dia", label: "Dia" },
                  { value: "mes", label: "Mês" },
                  { value: "ano", label: "Ano" },
                ]}
              />
            </View>

            {/* Resumo Total */}
            <View style={{ marginHorizontal: 16, marginBottom: 24, gap: 12 }}>
              <View
                style={{
                  backgroundColor: "rgba(37, 211, 102, 0.15)",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(37, 211, 102, 0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#25D366" />
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
                    Entradas
                  </Text>
                </View>
                <Text style={{ color: "#25D366", fontSize: 16, fontWeight: "700" }}>
                  {currency(totals.entrada, hideAmounts)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#EF4444" />
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
                    Saídas
                  </Text>
                </View>
                <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>
                  {currency(totals.saida, hideAmounts)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(110, 86, 207, 0.15)",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(110, 86, 207, 0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="scale-balance" size={20} color="#6E56CF" />
                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
                    Saldo
                  </Text>
                </View>
                <Text style={{ color: "#6E56CF", fontSize: 16, fontWeight: "700" }}>
                  {currency(totals.entrada - totals.saida, hideAmounts)}
                </Text>
              </View>
            </View>

            {/* Listagem de lançamentos */}
            <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
              {/* Filtro de busca - Aparece apenas quando expandido */}
              {expandedList && (
                <TextInput
                  label="Buscar lançamento"
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                  placeholder="Ex: Aluguel, Venda..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", marginBottom: 12 }}
                  textColor="#FFFFFF"
                  activeUnderlineColor="#6E56CF"
                  labelStyle={{ color: "#FFFFFF" }}
                  underlineColor="rgba(255, 255, 255, 0.2)"
                  mode="flat"
                  left={<TextInput.Icon icon="magnify" color="#6E56CF" />}
                />
              )}

              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  overflow: "hidden",
                }}
              >
                {/* Título e estatísticas */}
                <TouchableOpacity
                  onPress={() => setExpandedList(!expandedList)}
                  style={{
                    backgroundColor: "rgba(110, 86, 207, 0.15)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: expandedList ? 1 : 0,
                    borderBottomColor: "rgba(255, 255, 255, 0.12)",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialCommunityIcons name="receipt-text" size={18} color="rgba(255, 255, 255, 0.6)" />
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontWeight: "600" }}>
                        LANÇAMENTOS
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                      <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13, fontWeight: "600" }}>
                        {filtered.length} registros
                      </Text>
                      <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                        {currency(filtered.reduce((sum, i) => sum + (i.kind === "entrada" ? i.amount : -i.amount), 0), hideAmounts)}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedList ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Linhas com melhor layout - Expandível */}
                {expandedList && (filtered.length > 0 ? (
                  filtered.map((i, idx) => (
                    <View
                      key={i.id}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                        borderBottomColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <MaterialCommunityIcons
                            name={i.source === "sale" ? "shopping-outline" : i.kind === "saida" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                            size={20}
                            color={i.source === "sale" ? "#0EA5E9" : i.kind === "saida" ? "#EF4444" : "#25D366"}
                          />
                          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                            {i.label}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: i.kind === "entrada" ? "#25D366" : "#EF4444",
                            fontSize: 14,
                            fontWeight: "700",
                            marginLeft: 12,
                          }}
                        >
                          {i.kind === "entrada" ? "+" : "-"}
                          {currency(i.amount, hideAmounts)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}>
                          {i.when.toLocaleDateString("pt-BR")} às {i.when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        <View
                          style={{
                            backgroundColor: i.kind === "entrada" ? "rgba(37, 211, 102, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: i.kind === "entrada" ? "#25D366" : "#EF4444", fontSize: 10, fontWeight: "600" }}>
                            {i.kind === "entrada" ? "ENTRADA" : "SAÍDA"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="inbox-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, marginTop: 12 }}>
                      Nenhum lançamento registrado
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Botão esconder valores */}
            <TouchableOpacity
              onPress={() => setHideAmounts((v) => !v)}
              style={{
                marginHorizontal: 16,
                marginBottom: 24,
                backgroundColor: hideAmounts ? "rgba(14, 165, 233, 0.15)" : "rgba(110, 86, 207, 0.15)",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: hideAmounts ? "rgba(14, 165, 233, 0.3)" : "rgba(110, 86, 207, 0.3)",
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <MaterialCommunityIcons
                name={hideAmounts ? "eye-off" : "eye"}
                size={20}
                color={hideAmounts ? "#0EA5E9" : "#6E56CF"}
              />
              <Text style={{ color: hideAmounts ? "#0EA5E9" : "#6E56CF", fontWeight: "600" }}>
                {hideAmounts ? "Mostrar valores" : "Esconder valores"}
              </Text>
            </TouchableOpacity>
          </>
        }
        data={[]}
        renderItem={null}
      />

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack}
      </Snackbar>
    </LinearGradient>
  );
}
