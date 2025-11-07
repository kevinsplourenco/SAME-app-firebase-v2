import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Provider as PaperProvider,
  ActivityIndicator,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { auth, userDoc } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { theme } from "./theme";

// App tabs
import HomeScreen from "./screens/HomeScreen";
import ProductFormScreen from "./screens/ProductFormScreen";
import SalesScreen from "./screens/SalesScreen";
import CashFlowScreen from "./screens/CashFlowScreen";
import SettingsScreen from "./screens/SettingsScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import SuppliersScreen from "./screens/SuppliersScreen";

// Auth stack
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

// Tabbar customizada
function CustomTabBar({ state, descriptors, navigation, modules }) {
  if (!state || !state.routes) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#0F172A",
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 4,
        marginBottom: 0,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            preventDefault: false,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const map = {
          Home: "home-variant",
          Products: "cube-outline",
          Sales: "barcode-scan",
          CashFlow: "cash-multiple",
          Suppliers: "truck-outline",
          Settings: "cog",
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <View style={{ alignItems: "center", justifyContent: "center", gap: 4 }}>
              <MaterialCommunityIcons
                name={map[route.name] || "dots-horizontal"}
                size={24}
                color={isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                  textAlign: "center",
                }}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Stack para Home + Notifications
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs({ modules }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: "#050F1B" },
      }}
      tabBar={(props) => <CustomTabBar {...props} modules={modules} />}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Products"
        component={ProductFormScreen}
        options={{ title: "Prod." }}
      />
      {modules.sales && (
        <Tab.Screen
          name="Sales"
          component={SalesScreen}
          options={{ title: "Vendas" }}
        />
      )}
      {modules.cashflow && (
        <Tab.Screen
          name="CashFlow"
          component={CashFlowScreen}
          options={{ title: "Fluxo" }}
        />
      )}
      {modules.suppliers && (
        <Tab.Screen
          name="Suppliers"
          component={SuppliersScreen}
          options={{ title: "Fornec." }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Config" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState({
    sales: true,
    cashflow: true,
    notifications: true,
    suppliers: true,
    reports: true,
    integrations: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const ref = userDoc("meta", "settings");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const s = snap.data();
        setModules(
          s.modules || { 
            sales: true, 
            cashflow: true, 
            notifications: true,
            suppliers: true,
            reports: true,
            integrations: true,
          }
        );
      }
    });
    return () => unsub();
  }, [user]);

  if (!ready) {
    return (
      <PaperProvider theme={theme}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 12 }}>Inicializando…</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        {user ? (
          <MainTabs modules={modules} />
        ) : (
          <AuthStack.Navigator>
            <AuthStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <AuthStack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <AuthStack.Screen
              name="Forgot"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}
