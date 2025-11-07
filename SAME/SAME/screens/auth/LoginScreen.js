import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  TextInput,
  Button,
  Text,
  Snackbar,
} from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
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
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  logoContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    marginBottom: 0,
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
  loginButton: {
    borderRadius: 14,
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#6E56CF",
  },
  googleButton: {
    borderRadius: 14,
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.3,
    marginLeft: 16,
  },
  googleButtonIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#EA4335",
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#eef3ffff",
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 40,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
  registerLink: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
  },
  registerLinkBold: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerSection: {
    alignItems: "center",
  },
  divider: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginVertical: 16,
  },
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(null);

  const login = async () => {
    if (!email || !password) {
      setSnack("Por favor, preencha todos os campos");
      return;
    }

    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setSnack(e?.message || "Erro ao entrar");
    } finally {
      setBusy(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const webURL = "http://localhost:5173"; // Desenvolvimento
      await Linking.openURL(webURL);
    } catch (error) {
      setSnack("Não foi possível abrir o navegador");
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
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Gerencie suas vendas com facilidade
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
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

            <TouchableOpacity
              onPress={() => navigation.navigate("Forgot")}
              disabled={busy}
              style={{ alignSelf: "flex-end", marginBottom: 24 }}
            >
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={login}
              loading={busy}
              disabled={busy}
              style={styles.loginButton}
              labelStyle={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
            >
              {busy ? "" : "Entrar"}
            </Button>

            <TouchableOpacity
              onPress={loginWithGoogle}
              disabled={busy}
              style={styles.googleButton}
            >
              <View style={styles.googleButtonContent}>
                <Text style={styles.googleButtonIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continuar com Google</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
              />
              <Text style={{ marginHorizontal: 12, color: "rgba(255, 255, 255, 0.5)" }}>ou</Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Text style={styles.registerLink}>Não tem uma conta? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={busy}
              >
                <Text style={styles.registerLinkBold}>Criar conta</Text>
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