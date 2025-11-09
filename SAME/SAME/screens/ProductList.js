import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import {
  Card,
  Text,
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Snackbar,
  TextInput,
  IconButton,
  FAB,
  HelperText,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { userCol, userDoc } from "../firebase";

const currency = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);

const daysBetween = (a, b) =>
  Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snack, setSnack] = useState(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [batch, setBatch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [code, setCode] = useState("");
  const [expiry, setExpiry] = useState(undefined);
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const q = query(userCol("products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setWeight("");
    setBatch("");
    setQuantity("");
    setCode("");
    setExpiry(undefined);
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name || "");
    setPrice(String(product.price || ""));
    setWeight(String(product.weight || ""));
    setBatch(product.batch || "");
    setQuantity(String(product.quantity || ""));
    setCode(product.code || "");
    setExpiry(product.expiry?.toDate ? product.expiry.toDate() : undefined);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setScanning(false);
    setEditingProduct(null);
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);
    setCode(data);
    setSnack(`Código escaneado: ${data}`);
  };

  const startScanning = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        setSnack("Permissão de câmera negada");
        return;
      }
    }
    setScanning(true);
  };

  const saveProduct = async () => {
    if (!name || !quantity || Number(quantity) <= 0) {
      setSnack("Preencha nome e quantidade válida");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price) || 0,
        weight: weight ? Number(weight) : null,
        batch: batch || undefined,
        quantity: Number(quantity),
        code: code || undefined,
        expiry: expiry ? Timestamp.fromDate(expiry) : null,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(userDoc("products", editingProduct.id), payload);
        setSnack("Produto atualizado!");
      } else {
        await addDoc(userCol("products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSnack("Produto adicionado!");
      }
      closeModal();
    } catch (e) {
      setSnack("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const showDeleteDialog = (product) => {
    setSelectedForDelete(product);
  };

  const hideDeleteDialog = () => {
    setSelectedForDelete(null);
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(userDoc("products", selectedForDelete.id));
      setSnack("Produto excluído com sucesso!");
    } catch (e) {
      setSnack("Erro ao excluir: " + e.message);
    } finally {
      hideDeleteDialog();
    }
  };

  const renderProduct = ({ item }) => {
    let expiryText = "Sem validade";
    let expiryColor = "rgba(255, 255, 255, 0.6)";

    if (item.expiry) {
      const d = item.expiry.toDate ? item.expiry.toDate() : new Date(item.expiry);
      const days = daysBetween(d, new Date());
      expiryText = d.toLocaleDateString("pt-BR");
      expiryColor = days <= 7 ? "#EF4444" : "#25D366";
    }

    const isLowStock = (item.quantity || 0) < 5;

    return (
      <Card 
        style={{ 
          marginHorizontal: 16, 
          marginVertical: 6,
          backgroundColor: "#0F172A",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16, marginBottom: 4 }}>
              {item.name}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              <Text style={{ color: isLowStock ? "#EF4444" : "rgba(255, 255, 255, 0.6)", fontSize: 13 }}>
                {item.quantity || 0} un
              </Text>
              <Text style={{ color: "#25D366", fontSize: 13, fontWeight: "600" }}>
                {currency(item.price)}
              </Text>
              {item.expiry && (
                <Text style={{ color: expiryColor, fontSize: 13 }}>
                  {expiryText}
                </Text>
              )}
            </View>
          </View>
          <IconButton
            icon="pencil"
            iconColor="#0EA5E9"
            size={20}
            onPress={() => openEditModal(item)}
          />
          <IconButton
            icon="delete"
            iconColor="#EF4444"
            size={20}
            onPress={() => showDeleteDialog(item)}
          />
        </View>
      </Card>
    );
  };

  return (
    <LinearGradient
      colors={["#050F1B", "#0F172A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.12)",
            paddingHorizontal: 16,
            paddingTop: 48,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            MEUS PRODUTOS
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Lista de estoque • {products.length} produto(s)
          </Text>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 24 }} color="#6E56CF" />}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 80 }} // Aumentado para o Snackbar
        ListEmptyComponent={() => (
          !loading && (
            <Card style={{ margin: 16, backgroundColor: "#0F172A", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" }}>
              <Card.Content>
                <Text style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: 12 }}>
                  Nenhum produto cadastrado ainda.
                </Text>
                <Button 
                  mode="contained" 
                  icon="plus"
                  buttonColor="#6E56CF"
                  style={{marginTop: 12}}
                  onPress={() => navigation.navigate("Products")}
                >
                  Cadastrar primeiro produto
                </Button>
              </Card.Content>
            </Card>
          )
        )}
      />

      <Portal>
        <Dialog 
          visible={!!selectedForDelete} 
          onDismiss={hideDeleteDialog}
          style={{ backgroundColor: "#0F172A" }}
        >
          <Dialog.Title style={{ color: "#FFFFFF" }}>Confirmar Exclusão</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
              Tem certeza que deseja excluir o produto "
              {selectedForDelete?.name}"? Esta ação não pode ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog} disabled={isDeleting} textColor="rgba(255, 255, 255, 0.6)">
              Não
            </Button>
            <Button
              onPress={confirmDelete}
              loading={isDeleting}
              textColor="#EF4444"
            >
              Sim, Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}
        style={{ backgroundColor: "#0F172A" }}
      >
        <Text style={{ color: "#FFFFFF" }}>{snack}</Text>
      </Snackbar>

      <FAB
        icon="plus"
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: "#6E56CF",
        }}
        color="#FFFFFF"
        onPress={openAddModal}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" }}>
          <View style={{ 
            backgroundColor: "#0F172A", 
            borderTopLeftRadius: 20, 
            borderTopRightRadius: 20,
            maxHeight: "90%",
          }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255, 255, 255, 0.1)",
            }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
                {editingProduct ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
              </Text>
              <IconButton
                icon="close"
                iconColor="#FFFFFF"
                onPress={closeModal}
              />
            </View>

            {scanning ? (
              <View style={{ height: 400, backgroundColor: "#000", margin: 16, borderRadius: 12, overflow: "hidden" }}>
                {!permission ? (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <Text style={{ color: "#FFFFFF", marginBottom: 16, textAlign: "center" }}>
                      Precisamos de permissão para usar a câmera
                    </Text>
                    <Button
                      mode="contained"
                      buttonColor="#6E56CF"
                      onPress={requestPermission}
                    >
                      Conceder Permissão
                    </Button>
                  </View>
                ) : !permission.granted ? (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <Text style={{ color: "#EF4444", textAlign: "center" }}>Sem acesso à câmera</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1, padding: 16 }}>
                    <CameraView
                      onBarcodeScanned={handleBarCodeScanned}
                      barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
                      }}
                      style={{ flex: 1, borderRadius: 8, overflow: "hidden" }}
                    />
                  </View>
                )}
                <Button
                  mode="contained"
                  buttonColor="#EF4444"
                  onPress={() => setScanning(false)}
                  style={{ margin: 16, marginTop: 0 }}
                >
                  Cancelar Scanner
                </Button>
              </View>
            ) : (
              <ScrollView style={{ padding: 16 }}>
                <TextInput
                  label="Nome *"
                  value={name}
                  onChangeText={setName}
                  style={{ marginBottom: 12, backgroundColor: "#0F172A" }}
                  theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                  textColor="#FFFFFF"
                />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput
                    label="Preço (R$)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, backgroundColor: "#0F172A" }}
                    theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                    textColor="#FFFFFF"
                  />
                  <TextInput
                    label="Quantidade *"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                    style={{ flex: 1, backgroundColor: "#0F172A" }}
                    theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                    textColor="#FFFFFF"
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                  <TextInput
                    label="Peso (g)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, backgroundColor: "#0F172A" }}
                    theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                    textColor="#FFFFFF"
                  />
                  <TextInput
                    label="Lote"
                    value={batch}
                    onChangeText={setBatch}
                    style={{ flex: 1, backgroundColor: "#0F172A" }}
                    theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                    textColor="#FFFFFF"
                  />
                </View>

                <View style={{ marginTop: 12 }}>
                  <TextInput
                    label="Código (EAN/QR)"
                    value={code}
                    onChangeText={setCode}
                    style={{ backgroundColor: "#0F172A" }}
                    theme={{ colors: { text: "#FFFFFF", placeholder: "rgba(255, 255, 255, 0.6)" } }}
                    textColor="#FFFFFF"
                    right={
                      <TextInput.Icon
                        icon="barcode-scan"
                        onPress={startScanning}
                        color="#6E56CF"
                      />
                    }
                  />
                </View>

                <TouchableOpacity
                  onPress={() => setShowDate(true)}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 4,
                    padding: 16,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
                    Validade
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 16, marginTop: 4 }}>
                    {expiry ? expiry.toLocaleDateString("pt-BR") : "Sem validade"}
                  </Text>
                </TouchableOpacity>

                {showDate && (
                  <DateTimePicker
                    value={expiry || new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      setShowDate(false);
                      if (d) setExpiry(d);
                    }}
                  />
                )}

                <Button
                  mode="contained"
                  icon="content-save"
                  buttonColor="#6E56CF"
                  onPress={saveProduct}
                  loading={saving}
                  style={{ marginTop: 24, marginBottom: 16 }}
                >
                  {editingProduct ? "Salvar Alterações" : "Adicionar Produto"}
                </Button>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      </View>
    </LinearGradient>
  );
}