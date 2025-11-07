import React, { useEffect, useState } from "react";
import { View, Image, FlatList, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import {
  Button,
  Text,
  Switch,
  Snackbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { userDoc, auth, db } from "../firebase";
import { signOut } from "firebase/auth";

// Componente customizado para TextInput com label branco
const CustomTextInput = ({ label, value, onChangeText, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15, marginBottom: 8 }}>
        {label}
      </Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderWidth: 1,
          borderColor: isFocused ? "#6E56CF" : "rgba(255, 255, 255, 0.2)",
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: "#FFFFFF",
          fontSize: 14,
        }}
      />
    </View>
  );
};

export default function SettingsScreen() {
  const [fantasyName, setFantasyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [mods, setMods] = useState({
    sales: true,
    cashflow: true,
    notifications: true,
    suppliers: true,
    reports: true,
    integrations: true,
  });
  const [snack, setSnack] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    empresa: true,
    modulos: true,
    integracao: false,
  });

  useEffect(() => {
    const ref = userDoc("meta", "settings");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const s = snap.data();
        setFantasyName(s.fantasyName || "");
        setMods(
          s.modules || { sales: true, cashflow: true, notifications: true }
        );
      }
    });

    // Carregar logo do documento meta/config
    const configRef = userDoc("meta", "config");
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists() && snap.data().logo) {
        setLogoUrl(snap.data().logo);
      }
    });

    return () => {
      unsub();
      unsubConfig();
    };
  }, []);

  const pickLogo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setSnack("Permissão de mídia negada");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (res.canceled) return;
      const base64 = res.assets?.[0]?.base64;
      if (!base64) return;

      setSnack("Enviando logo...");
      
      // Salvar em Base64 no Firestore - usar meta/config (caminho com número par de segmentos)
      await setDoc(
        userDoc("meta", "config"),
        {
          logo: `data:image/jpeg;base64,${base64}`,
          logoUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
      setLogoUrl(`data:image/jpeg;base64,${base64}`);
      setSnack("Logo enviado com sucesso!");
    } catch (e) {
      console.error("Erro pickLogo:", e);
      setSnack("Erro ao enviar logo: " + (e.message || "desconhecido"));
    }
  };

  const save = async () => {
    try {
      const ref = userDoc("meta", "settings");
      await setDoc(
        ref,
        { fantasyName, modules: mods, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSnack("Configurações salvas");
    } catch (e) {
      setSnack("Erro: " + e.message);
    }
  };

  return (
    <LinearGradient colors={["#050F1B", "#0F172A"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: 32 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.12)",
            paddingHorizontal: 16,
            paddingTop: 48,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
              CONFIGURAÇÕES
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
              Personalize sua experiência
            </Text>
          </View>
          <TouchableOpacity onPress={() => signOut(auth)}>
            <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}
          data={[1]}
          renderItem={() => (
            <View>
              {/* Seção: Informações da Empresa */}
              <View style={{ marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedSections({
                      ...expandedSections,
                      empresa: !expandedSections.empresa,
                    })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}
                >
                  <MaterialCommunityIcons name="store-outline" size={20} color="#6E56CF" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", flex: 1 }}>
                    Empresa
                  </Text>
                  <MaterialCommunityIcons
                    name={expandedSections.empresa ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>

                {expandedSections.empresa && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                    }}
                  >
                    <CustomTextInput
                      label="Nome fantasia"
                      value={fantasyName}
                      onChangeText={setFantasyName}
                      placeholder="Digite o nome da empresa"
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={{ width: 80, height: 80, borderRadius: 12 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialCommunityIcons name="image-outline" size={32} color="rgba(255, 255, 255, 0.3)" />
                        </View>
                      )}
                      <Button
                        mode="contained"
                        onPress={pickLogo}
                        icon="image-plus"
                        style={{ backgroundColor: "#0EA5E9", flex: 1 }}
                      >
                        Enviar logo
                      </Button>
                    </View>
                  </View>
                )}
              </View>

              {/* Seção: Módulos */}
              <View style={{ marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedSections({
                      ...expandedSections,
                      modulos: !expandedSections.modulos,
                    })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}
                >
                  <MaterialCommunityIcons name="puzzle-outline" size={20} color="#6E56CF" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", flex: 1 }}>
                    Módulos
                  </Text>
                  <MaterialCommunityIcons
                    name={expandedSections.modulos ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>

                {expandedSections.modulos && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      gap: 12,
                    }}
                  >
                    {/* Vendas */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="barcode-scan" size={20} color="#0EA5E9" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Vendas</Text>
                      </View>
                      <Switch
                        value={mods.sales}
                        onValueChange={(v) => setMods({ ...mods, sales: v })}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Fluxo de Caixa */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="cash-multiple" size={20} color="#25D366" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Fluxo de Caixa</Text>
                      </View>
                      <Switch
                        value={mods.cashflow}
                        onValueChange={(v) => setMods({ ...mods, cashflow: v })}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Notificações */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#F59E0B" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Notificações</Text>
                      </View>
                      <Switch
                        value={mods.notifications}
                        onValueChange={(v) => setMods({ ...mods, notifications: v })}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Fornecedores */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="truck-outline" size={20} color="#8B5CF6" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Fornecedores</Text>
                      </View>
                      <Switch
                        value={mods.suppliers}
                        onValueChange={(v) => setMods({ ...mods, suppliers: v })}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Relatórios */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="chart-box-outline" size={20} color="#EC4899" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Relatórios</Text>
                      </View>
                      <Switch
                        value={mods.reports}
                        onValueChange={(v) => setMods({ ...mods, reports: v })}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Integrações */}
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons name="link-box-outline" size={20} color="#06B6D4" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Integrações</Text>
                      </View>
                      <Switch
                        value={mods.integrations}
                        onValueChange={(v) => setMods({ ...mods, integrations: v })}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Botão Salvar */}
              <Button 
                mode="contained" 
                icon="content-save" 
                onPress={save}
                style={{ backgroundColor: "#6E56CF" }}
                labelStyle={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
              >
                Salvar Configurações
              </Button>
            </View>
          )}
        />
      </View>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}
        style={{ backgroundColor: "#1F2937" }}
      >
        <Text style={{ color: "#FFFFFF" }}>{snack}</Text>
      </Snackbar>
    </LinearGradient>
  );
}

const styles = {
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
};
