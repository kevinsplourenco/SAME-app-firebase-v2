export const firebaseConfig = {
  apiKey: "AIzaSyC2-xHByT0qQBYA8TdkBZbQPQ8mirHGXWM",
  authDomain: "same-40d0e.firebaseapp.com",
  projectId: "same-40d0e",
  storageBucket: "same-40d0e.firebasestorage.app",
  messagingSenderId: "288241109960",
  appId: "1:288241109960:web:12c483943aba541330cefd",
  measurementId: "G-FWY5QBJQL9",
};

import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);

function requireUID() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

// Helpers de caminho escopados ao usuário logado (tenant = UID)
export const userCol = (name) => collection(db, "tenants", requireUID(), name);
export const userDoc = (...segments) =>
  doc(db, "tenants", requireUID(), ...segments);
