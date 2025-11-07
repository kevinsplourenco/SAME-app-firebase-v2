import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 3,
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
    fontSize: 32,
    fontWeight: "900",
    color: "#EA4335",
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
