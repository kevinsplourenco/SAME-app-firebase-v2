// src/screens/salesScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import {
  Card,
  TextInput,
  Button,
  Snackbar,
  Text,
  IconButton,
  Portal,
  Dialog,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { userCol, userDoc, db } from "../firebase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental && !UIManager.isNewArchitectureEnabled?.()) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCAN_COOLDOWN_MS = 1200;

const ExpandableCard = ({ title, icon, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Card
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        marginBottom: 16,
        marginHorizontal: 16,
        elevation: 0,
      }}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <MaterialCommunityIcons name={icon} size={24} color="#6E56CF" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
            {title}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {expanded && <Card.Content style={{ paddingVertical: 12, paddingHorizontal: 12 }}>{children}</Card.Content>}
    </Card>
  );
};

export default function SalesScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // Entrada manual
  const [manualCode, setManualCode] = useState("");
  const [manualQty, setManualQty] = useState("1");

  // Carrinho
  const [cart, setCart] = useState([]); // [{id, code, name, price, quantity, stock}]

  // Delivery/Entrega
  const [deliveryType, setDeliveryType] = useState("delivery"); // "delivery" ou "pickup"
  
  // Pagamento
  const [paymentType, setPaymentType] = useState("cash"); // "cash" ou "card"

  // Scanner control via refs (bloqueio síncrono)
  const scanLockRef = useRef(false);
  const lastScanAtRef = useRef(0);
  const lastCodeRef = useRef(null);

  // Fluxo
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnimRef = useRef(new (require("react-native").Animated).Value(0));

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission]);

  // ---------- Helpers ----------
  const findProductByCode = async (code) => {
    const qProd = query(userCol("products"), where("code", "==", String(code)));
    const snap = await getDocs(qProd);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      id: d.id,
      code: data.code ?? "",
      name: data.name ?? data.title ?? "Produto",
      price: Number(data.price || 0),
      stock: Number(data.quantity || 0),
    };
  };

  const addToCart = async (code, qty = 1) => {
    if (!code) return;
    try {
      const prod = await findProductByCode(code);
      if (!prod) {
        setFeedback("Produto não encontrado para o código: " + code);
        return;
      }

      setCart((prev) => {
        const idx = prev.findIndex((p) => p.id === prod.id);
        if (idx >= 0) {
          setFeedback(`"${prev[idx].name}" já está no carrinho`);
          return prev; // não soma mais
        }
        return [...prev, { ...prod, quantity: Math.max(1, Number(qty) || 1) }];
      });
    } catch (e) {
      setFeedback("Erro ao adicionar: " + (e?.message || String(e)));
    } finally {
      setManualCode("");
    }
  };

  const updateItemQty = (id, nextQty) => {
    setCart((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, Number(nextQty) || 1) } : it
      )
    );
  };

  const incQty = (id) =>
    setCart((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it))
    );

  const decQty = (id) =>
    setCart((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
      )
    );

  const removeItem = (id) => setCart((prev) => prev.filter((it) => it.id !== id));

  const total = useMemo(
    () => cart.reduce((acc, it) => acc + it.price * it.quantity, 0),
    [cart]
  );

  // ---------- Scanner handler com lock síncrono ----------
  const handleBarCodeScanned = async ({ data }) => {
    if (!data) return;
    const code = String(data).trim();
    const now = Date.now();

    // Bloqueios imediatos via ref (sem depender de re-render)
    if (scanLockRef.current) return;
    if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) return;
    if (code === lastCodeRef.current) return;

    // Ativa trava e registra contexto
    scanLockRef.current = true;
    lastScanAtRef.current = now;
    lastCodeRef.current = code;

    try {
      await addToCart(code, 1);
    } finally {
      // libera após cooldown
      setTimeout(() => {
        scanLockRef.current = false;
      }, SCAN_COOLDOWN_MS);
    }
  };

  // ---------- Câmera ----------
  const renderCamera = () => {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <Card style={{ margin: 16 }}>
          <Card.Title title="Câmera bloqueada" />
          <Card.Content>
            <Text>Precisamos da sua permissão para acessar a câmera.</Text>
            <Button mode="contained" style={{ marginTop: 8 }} onPress={requestPermission}>
              Permitir câmera
            </Button>
          </Card.Content>
        </Card>
      );
    }
    return (
      <View style={{ height: 280, margin: 16, borderRadius: 16, overflow: "hidden" }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128"],
          }}
          // mesmo que a câmera chame várias vezes, o handler é bloqueado pelas refs
          onBarcodeScanned={handleBarCodeScanned}
        />
      </View>
    );
  };

  // ---------- Venda em lote (ler → validar → escrever) ----------
  const confirmSale = async () => {
    if (!cart.length) {
      setFeedback("Carrinho vazio");
      return;
    }
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const reads = [];
        for (const item of cart) {
          const pRef = userDoc("products", item.id);
          const pSnap = await tx.get(pRef);
          if (!pSnap.exists()) throw new Error(`Produto ausente: ${item.name}`);
          reads.push({ ref: pRef, snap: pSnap, requested: item });
        }

        const itemsForSale = [];
        for (const { ref, snap, requested } of reads) {
          const current = snap.data();
          const stock = Number(current.quantity || 0);
          const req = Number(requested.quantity || 0);
          const next = stock - req;
          if (next < 0) {
            throw new Error(
              `Estoque insuficiente para "${current.name ?? requested.name}". ` +
                `Disponível: ${stock}, solicitado: ${req}`
            );
          }
          itemsForSale.push({
            ref,
            nextQty: next,
            payload: {
              productId: requested.id,
              code: requested.code,
              name: current.name ?? requested.name,
              unitPrice: Number(current.price || requested.price || 0),
              qty: req,
              lineTotal: Number(current.price || requested.price || 0) * req,
            },
          });
        }

        for (const it of itemsForSale) tx.update(it.ref, { quantity: it.nextQty });

        const saleTotal = itemsForSale.reduce((a, it) => a + it.payload.lineTotal, 0);
        const sRef = doc(userCol("sales"));
        tx.set(sRef, {
          items: itemsForSale.map((it) => it.payload),
          total: saleTotal,
          at: serverTimestamp(),
        });
      });

      setCart([]);
      setShowSuccess(true);
      setFeedback("Venda confirmada e estoque atualizado!");
      
      // Esconder sucesso após 2.5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 2500);
    } catch (e) {
      setFeedback("Erro na venda: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  // ---------- Render ----------
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
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
                  VENDAS
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                  Gerencie suas vendas
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCart([])}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Scanner Section */}
            {scanning && (
              <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                <View
                  style={{
                    height: 340,
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    padding: 12,
                  }}
                >
                  {renderCamera()}
                </View>
              </View>
            )}

            {/* Câmera Toggle */}
            <TouchableOpacity
              onPress={() => {
                setScanning((v) => !v);
                scanLockRef.current = false;
                lastCodeRef.current = null;
                lastScanAtRef.current = 0;
              }}
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 16,
                backgroundColor: "#6E56CF",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <MaterialCommunityIcons
                name={scanning ? "close" : "barcode-scan"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                {scanning ? "Fechar Scanner" : "Abrir Scanner"}
              </Text>
            </TouchableOpacity>

            {/* Adicionar por código */}
            <ExpandableCard
              title="Adicionar por Código"
              icon="pencil"
              defaultExpanded={true}
            >
              <View style={{ gap: 12 }}>
                <TextInput
                  mode="flat"
                  label="Código"
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="EAN/QR/SKU"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                  textColor="#FFFFFF"
                  activeUnderlineColor="#6E56CF"
                  underlineColor="rgba(255, 255, 255, 0.2)"
                  labelStyle={{ color: "#FFFFFF" }}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput
                    mode="flat"
                    label="Quantidade"
                    value={manualQty}
                    onChangeText={setManualQty}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                    textColor="#FFFFFF"
                    activeUnderlineColor="#6E56CF"
                    underlineColor="rgba(255, 255, 255, 0.2)"
                    labelStyle={{ color: "#FFFFFF" }}
                  />
                  <Button
                    mode="contained"
                    onPress={() => addToCart(manualCode, Number(manualQty) || 1)}
                    disabled={!manualCode || busy}
                    loading={busy}
                    style={{ justifyContent: "center", backgroundColor: "#0EA5E9" }}
                  >
                    Adicionar
                  </Button>
                </View>
              </View>
            </ExpandableCard>

            {/* Carrinho */}
            <ExpandableCard title="Produtos" icon="cart" defaultExpanded={true}>
              {cart.length === 0 ? (
                <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13, textAlign: "center" }}>
                  Escaneie ou adicione um código para começar
                </Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {cart.map((item, idx) => (
                    <View
                      key={`cart-${item.id}`}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}>
                          {item.code} • R$ {item.price?.toFixed(2)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => decQty(item.id)}
                          style={{
                            backgroundColor: "#6E56CF",
                            borderRadius: 6,
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                            −
                          </Text>
                        </TouchableOpacity>

                        <TextInput
                          value={String(item.quantity)}
                          onChangeText={(v) => updateItemQty(item.id, v)}
                          keyboardType="number-pad"
                          style={{
                            flex: 1,
                            textAlign: "center",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                          }}
                          textColor="#FFFFFF"
                        />

                        <TouchableOpacity
                          onPress={() => incQty(item.id)}
                          style={{
                            backgroundColor: "#0EA5E9",
                            borderRadius: 6,
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                            +
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => removeItem(item.id)}
                          style={{ marginLeft: 8 }}
                        >
                          <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>
                            ✕
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Total */}
                  <View
                    style={{
                      backgroundColor: "rgba(110, 86, 207, 0.15)",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "rgba(110, 86, 207, 0.3)",
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      marginTop: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12 }}>
                        Total ({cart.length} item(ns))
                      </Text>
                      <Text style={{ color: "#6E56CF", fontSize: 18, fontWeight: "700" }}>
                        R$ {total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ExpandableCard>

            {/* Entrega */}
            {cart.length > 0 && (
              <ExpandableCard title="Entrega" icon="truck-outline" defaultExpanded={true}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setDeliveryType("delivery")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: deliveryType === "delivery" ? "#0EA5E9" : "rgba(255, 255, 255, 0.1)",
                      borderWidth: 1,
                      borderColor: deliveryType === "delivery" ? "#0EA5E9" : "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="bike-fast"
                      size={20}
                      color={deliveryType === "delivery" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
                    />
                    <Text
                      style={{
                        color: deliveryType === "delivery" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 4,
                      }}
                    >
                      Entrega
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDeliveryType("pickup")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: deliveryType === "pickup" ? "#0EA5E9" : "rgba(255, 255, 255, 0.1)",
                      borderWidth: 1,
                      borderColor: deliveryType === "pickup" ? "#0EA5E9" : "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="store"
                      size={20}
                      color={deliveryType === "pickup" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
                    />
                    <Text
                      style={{
                        color: deliveryType === "pickup" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 4,
                      }}
                    >
                      Retirar
                    </Text>
                  </TouchableOpacity>
                </View>
              </ExpandableCard>
            )}

            {/* Pagamento */}
            {cart.length > 0 && (
              <ExpandableCard title="Pagamento" icon="credit-card" defaultExpanded={true}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setPaymentType("cash")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: paymentType === "cash" ? "#0EA5E9" : "rgba(255, 255, 255, 0.1)",
                      borderWidth: 1,
                      borderColor: paymentType === "cash" ? "#0EA5E9" : "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cash"
                      size={20}
                      color={paymentType === "cash" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
                    />
                    <Text
                      style={{
                        color: paymentType === "cash" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 4,
                      }}
                    >
                      Dinheiro
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPaymentType("card")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: paymentType === "card" ? "#0EA5E9" : "rgba(255, 255, 255, 0.1)",
                      borderWidth: 1,
                      borderColor: paymentType === "card" ? "#0EA5E9" : "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="credit-card"
                      size={20}
                      color={paymentType === "card" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
                    />
                    <Text
                      style={{
                        color: paymentType === "card" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 4,
                      }}
                    >
                      Cartão
                    </Text>
                  </TouchableOpacity>
                </View>
              </ExpandableCard>
            )}

            {/* Botão Registrar Venda */}
            {cart.length > 0 && (
              <TouchableOpacity
                onPress={() => setConfirmOpen(true)}
                disabled={busy}
                style={{
                  marginHorizontal: 16,
                  marginTop: 16,
                  backgroundColor: "#0EA5E9",
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                  {busy ? "Registrando..." : "Registrar Venda"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        }
        data={[]}
        renderItem={null}
      />

      {/* Diálogo de confirmação */}
      <Portal>
        {confirmOpen && (
          <View
            style={{
              flex: 1,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <View
              style={{
                backgroundColor: "#0F172A",
                borderRadius: 12,
                padding: 24,
                width: "80%",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 }}>
                Confirmar Venda
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 14, marginBottom: 8 }}>
                {cart.length} item(ns) | Total: <Text style={{ fontWeight: "bold" }}>R$ {total.toFixed(2)}</Text>
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, marginBottom: 24 }}>
                Entrega: {deliveryType === "delivery" ? "Entrega" : "Retirada"} • Pagamento: {paymentType === "cash" ? "Dinheiro" : "Cartão"}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, justifyContent: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => setConfirmOpen(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmSale}
                  disabled={busy}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 6,
                    backgroundColor: "#0EA5E9",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {busy ? "Registrando..." : "Confirmar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Portal>

      {/* Efeito Visual de Sucesso */}
      {showSuccess && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 2000,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 16,
              paddingHorizontal: 32,
              paddingVertical: 40,
              alignItems: "center",
              gap: 16,
              borderWidth: 1,
              borderColor: "rgba(37, 211, 102, 0.3)",
            }}
          >
            {/* Checkmark animado */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#25D366",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons name="check" size={60} color="#FFFFFF" />
            </View>

            {/* Texto de sucesso */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              Venda Registrada!
            </Text>

            {/* Texto secundário */}
            <Text
              style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.8)",
                textAlign: "center",
              }}
            >
              Estoque atualizado com sucesso
            </Text>
          </View>
        </View>
      )}

      <Snackbar visible={!!feedback} onDismiss={() => setFeedback(null)} duration={2500}>
        {feedback}
      </Snackbar>
    </LinearGradient>
  );
}
