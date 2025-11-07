import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  TextInput,
  Button,
  Text,
  Snackbar,
} from "react-native-paper";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, userDoc } from "../../firebase";
import { setDoc, serverTimestamp } from "firebase/firestore";
import AuthFooter from "../../components/AuthFooter";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  headerSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  logoText: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginBottom: 24,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formSection: {
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#6E56CF",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
  footerSection: {
    alignItems: "center",
  },
  registerLink: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
  },
  registerLinkBold: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(null);

  const register = async () => {
    if (!email || !password) {
      setSnack("Por favor, preencha e-mail e senha");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (name) await updateProfile(cred.user, { displayName: name });
      // cria settings iniciais do tenant do usuário
      await setDoc(
        userDoc("meta", "settings"),
        {
          fantasyName: name || "",
          logoUrl: "",
          modules: { sales: true, cashflow: true, notifications: true },
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      navigation.goBack();
    } catch (e) {
      setSnack(e?.message || "Erro ao criar conta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#6E56CF", "#0EA5E9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.logoText}>SAME</Text>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Comece a gerenciar suas vendas agora
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputWrapper}>
              <TextInput
                label="Nome fantasia (opcional)"
                mode="outlined"
                value={name}
                onChangeText={setName}
                outlineStyle={{ borderRadius: 14 }}
                style={styles.input}
                editable={!busy}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="E-mail"
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                outlineStyle={{ borderRadius: 14 }}
                style={styles.input}
                editable={!busy}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Senha"
                mode="outlined"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                outlineStyle={{ borderRadius: 14 }}
                style={styles.input}
                editable={!busy}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Button
              mode="contained"
              onPress={register}
              loading={busy}
              disabled={busy}
              style={styles.button}
              labelStyle={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
            >
              {busy ? "" : "Criar conta"}
            </Button>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={styles.registerLink}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={busy}>
                <Text style={styles.registerLinkBold}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* App Footer */}
      <AuthFooter />

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}
        style={{
          backgroundColor: "#DC2626",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "500" }}>{snack}</Text>
      </Snackbar>
    </View>
  );
}
