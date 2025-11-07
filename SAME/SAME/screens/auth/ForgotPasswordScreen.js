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
import { sendPasswordResetEmail } from "firebase/auth";
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
    marginBottom: 16,
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
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 12,
    textAlign: "center",
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(null);

  const recover = async () => {
    if (!email) {
      setSnack("Por favor, preencha o campo de e-mail");
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSnack("Enviamos um link de recuperação para seu e-mail.");
    } catch (e) {
      setSnack(e?.message || "Erro ao enviar e-mail");
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
            <Text style={styles.title}>Recuperar Senha</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail para receber um link de recuperação
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

            <Button
              mode="contained"
              onPress={recover}
              loading={busy}
              disabled={busy}
              style={styles.button}
              labelStyle={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
            >
              {busy ? "" : "Enviar link"}
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
              <Text style={styles.registerLink}>Voltar para </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={busy}>
                <Text style={styles.registerLinkBold}>Login</Text>
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