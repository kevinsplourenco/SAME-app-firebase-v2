import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  Modal,
} from "react-native";
import {
  Text,
  Button,
  Switch,
  Snackbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCol, userDoc, db } from "../firebase";

const CustomTextInput = ({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, onContentSizeChange, height }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13, marginBottom: 6 }}>
        {label}
      </Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        keyboardType={keyboardType}
        multiline={multiline}
        onContentSizeChange={onContentSizeChange}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#FFFFFF",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isFocused ? "#6E56CF" : "rgba(255, 255, 255, 0.12)",
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: "System",
          fontSize: 13,
          minHeight: multiline ? height : 44,
          height: multiline ? height : 44,
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [snack, setSnack] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [autoEmail, setAutoEmail] = useState(false);
  const [productFilter, setProductFilter] = useState("");
  const [notesHeight, setNotesHeight] = useState(44);
  useEffect(() => {
    const unsub = onSnapshot(userCol("suppliers"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSuppliers(list);
    });
    return () => unsub();
  }, []);

  // Load products
  useEffect(() => {
    const unsub = onSnapshot(userCol("products"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setSnack("Preencha nome e email");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(userCol("suppliers"), editingId), {
          name,
          email,
          phone,
          notes,
          selectedProducts,
          autoEmail,
          updatedAt: serverTimestamp(),
        });
        setSnack("Fornecedor atualizado");
      } else {
        await addDoc(userCol("suppliers"), {
          name,
          email,
          phone,
          notes,
          selectedProducts,
          autoEmail,
          createdAt: serverTimestamp(),
        });
        setSnack("Fornecedor adicionado");
      }

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setSelectedProducts([]);
      setAutoEmail(false);
      setEditingId(null);
      setShowModal(false);
    } catch (e) {
      setSnack("Erro: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(userCol("suppliers"), id));
      setSnack("Fornecedor removido");
    } catch (e) {
      setSnack("Erro ao deletar: " + e.message);
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setEmail(supplier.email);
    setPhone(supplier.phone || "");
    setNotes(supplier.notes || "");
    setSelectedProducts(supplier.selectedProducts || []);
    setAutoEmail(supplier.autoEmail || false);
    setShowModal(true);
  };

  const toggleProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productFilter.toLowerCase())
  );

  return (
    <LinearGradient
      colors={["#050F1B", "#0F172A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.12)",
            paddingHorizontal: 16,
            paddingTop: 45,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
            FORNECEDORES
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
            Gerencie seus fornecedores
          </Text>
        </View>

        {/* Suppliers List */}
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={suppliers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginTop: 16,
                }}
              >
                Nenhum fornecedor
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: 8,
                }}
              >
                Clique no + para adicionar um novo
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginBottom: 4,
                    }}
                  >
                    {item.name}
                  </Text>
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={14}
                        color="#0EA5E9"
                      />
                      <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                        {item.email}
                      </Text>
                    </View>
                    {item.phone && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <MaterialCommunityIcons
                          name="phone-outline"
                          size={14}
                          color="#25D366"
                        />
                        <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                          {item.phone}
                        </Text>
                      </View>
                    )}
                    {item.autoEmail && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <MaterialCommunityIcons
                          name="email-alert"
                          size={14}
                          color="#F59E0B"
                        />
                        <Text style={{ fontSize: 11, color: "#F59E0B", fontWeight: "600" }}>
                          Email automático ativo
                        </Text>
                      </View>
                    )}
                    {item.selectedProducts && item.selectedProducts.length > 0 && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "rgba(255, 255, 255, 0.5)",
                          marginTop: 6,
                        }}
                      >
                        {item.selectedProducts.length} produto(s) monitorado(s)
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: "rgba(110, 86, 207, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#6E56CF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          setEditingId(null);
          setName("");
          setEmail("");
          setPhone("");
          setNotes("");
          setSelectedProducts([]);
          setAutoEmail(false);
          setProductFilter("");
          setShowModal(true);
        }}
        style={{
          position: "absolute",
          bottom: 32,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#6E56CF",
          justifyContent: "center",
          alignItems: "center",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowModal(false);
          setProductFilter("");
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <LinearGradient
            colors={["#050F1B", "#0F172A"]}
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 32,
              maxHeight: "85%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
                {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <FlatList
              data={[1]}
              renderItem={() => (
                <View>
                  <CustomTextInput
                    label="Nome"
                    value={name}
                    onChangeText={setName}
                    placeholder="Nome do fornecedor"
                  />
                  <CustomTextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@fornecedor.com"
                    keyboardType="email-address"
                  />
                  <CustomTextInput
                    label="Telefone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(00) 00000-0000"
                  />
                  <CustomTextInput
                    label="Notas"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Informações adicionais..."
                    multiline
                    height={notesHeight}
                    onContentSizeChange={(event) => {
                      const newHeight = Math.max(44, event.nativeEvent.contentSize.height);
                      setNotesHeight(newHeight);
                    }}
                  />

                  {/* Auto Email Switch */}
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View>
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
                        Email Automático
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        Enviar quando estoque crítico
                      </Text>
                    </View>
                    <Switch
                      value={autoEmail}
                      onValueChange={setAutoEmail}
                      color="#6E56CF"
                    />
                  </View>

                  {/* Products Selection */}
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13, marginBottom: 8 }}>
                    Produtos Monitorados ({selectedProducts.length})
                  </Text>
                  
                  {/* Search Filter */}
                  <RNTextInput
                    value={productFilter}
                    onChangeText={setProductFilter}
                    placeholder="Filtrar produtos..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "#FFFFFF",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontFamily: "System",
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  />

                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      paddingHorizontal: 8,
                      marginBottom: 16,
                      height: 180,
                      overflow: "hidden",
                    }}
                  >
                    <FlatList
                      data={filteredProducts}
                      keyExtractor={(p) => p.id}
                      scrollEnabled={true}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => toggleProduct(item.id)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 4,
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              selectedProducts.includes(item.id)
                                ? "checkbox-marked"
                                : "checkbox-blank-outline"
                            }
                            size={18}
                            color={
                              selectedProducts.includes(item.id)
                                ? "#6E56CF"
                                : "rgba(255, 255, 255, 0.5)"
                            }
                          />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 12,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 12, textAlign: "center", paddingVertical: 16 }}>
                          Nenhum produto encontrado
                        </Text>
                      }
                    />
                  </View>

                  {/* Buttons */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowModal(false)}
                      style={{ flex: 1 }}
                      textColor="#FFFFFF"
                    >
                      Cancelar
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      style={{ flex: 1, backgroundColor: "#6E56CF" }}
                    >
                      Salvar
                    </Button>
                  </View>
                </View>
              )}
              scrollEnabled
            />
          </LinearGradient>
        </View>
      </Modal>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}
        style={{ backgroundColor: "#0F172A" }}
      >
        <Text style={{ color: "#FFFFFF" }}>{snack}</Text>
      </Snackbar>
    </LinearGradient>
  );
}
